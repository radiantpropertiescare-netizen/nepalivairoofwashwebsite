const { Resend } = require('resend');

/**
 * Helper to get the Resend client instance.
 */
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('Missing RESEND_API_KEY environment variable');
  }
  return new Resend(apiKey);
}

/**
 * Escapes HTML characters to prevent XSS / HTML injection in emails.
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Safely formats multi-line text into HTML.
 */
function formatMultiline(str) {
  if (!str) return 'N/A';
  return escapeHtml(str).replace(/\r?\n/g, '<br>');
}

module.exports = async (req, res) => {
  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Parse request body
    let data;
    if (typeof req.body === 'string') {
      try {
        data = JSON.parse(req.body);
      } catch (err) {
        return res.status(400).json({ error: 'Invalid JSON payload' });
      }
    } else {
      data = req.body || {};
    }

    // 1. Honeypot check
    if (data.website) {
      // If honeypot is filled, silently return success to deter bots
      return res.status(200).json({ message: 'Request received' });
    }

    // 2. Extract and validate required fields
    const {
      name,
      email,
      phone,
      address,
      roofType = 'N/A',
      tileDamage = 'N/A',
      hasLeak = 'N/A',
      services = [],
      contactMethod = 'N/A',
      notes = 'N/A',
      tracking = {}
    } = data;

    if (!name || !email || !phone || !address) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // 3. Format and sanitize fields for safe HTML rendering
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safePhone = escapeHtml(phone);
    const safeAddress = escapeHtml(address);
    const safeContactMethod = escapeHtml(contactMethod);
    const safeRoofType = escapeHtml(roofType);
    const safeTileDamage = escapeHtml(tileDamage);
    const safeHasLeak = escapeHtml(hasLeak);
    const safeNotes = formatMultiline(notes);

    const rawServicesList = Array.isArray(services) ? services : (services ? [services] : []);
    const servicesText = rawServicesList.length > 0
      ? rawServicesList.map(s => escapeHtml(s)).join(', ')
      : 'None selected';

    const safeTracking = {
      timestamp: escapeHtml(tracking.timestamp || new Date().toISOString()),
      pageUrl: escapeHtml(tracking.pageUrl || 'N/A'),
      referrer: escapeHtml(tracking.referrer || 'N/A'),
      utm_source: escapeHtml(tracking.utm_source || 'N/A'),
      utm_medium: escapeHtml(tracking.utm_medium || 'N/A'),
      utm_campaign: escapeHtml(tracking.utm_campaign || 'N/A'),
      utm_content: escapeHtml(tracking.utm_content || 'N/A'),
      utm_term: escapeHtml(tracking.utm_term || 'N/A'),
      fbclid: escapeHtml(tracking.fbclid || 'N/A')
    };

    // 4. Construct email HTML
    const htmlContent = `
      <h2>New Roof Quote Request</h2>
      <p>A new quote request has been submitted from <strong>Nepali Vai Roof Wash</strong>.</p>
      
      <h3>Customer Details</h3>
      <ul>
        <li><strong>Full Name:</strong> ${safeName}</li>
        <li><strong>Email:</strong> ${safeEmail}</li>
        <li><strong>Phone Number:</strong> ${safePhone}</li>
        <li><strong>Full Address:</strong> ${safeAddress}</li>
        <li><strong>Preferred Contact Method:</strong> ${safeContactMethod}</li>
      </ul>

      <h3>Project Details</h3>
      <ul>
        <li><strong>Roof Type:</strong> ${safeRoofType}</li>
        <li><strong>Missing/Cracked Tiles:</strong> ${safeTileDamage}</li>
        <li><strong>Roof Leak:</strong> ${safeHasLeak}</li>
        <li><strong>Services Selected:</strong> ${servicesText}</li>
      </ul>

      <h3>Additional Notes</h3>
      <p>${safeNotes}</p>

      <h3>Tracking Information</h3>
      <ul>
        <li><strong>Timestamp:</strong> ${safeTracking.timestamp}</li>
        <li><strong>Page URL:</strong> ${safeTracking.pageUrl}</li>
        <li><strong>Referrer:</strong> ${safeTracking.referrer}</li>
        <li><strong>UTM Source:</strong> ${safeTracking.utm_source}</li>
        <li><strong>UTM Medium:</strong> ${safeTracking.utm_medium}</li>
        <li><strong>UTM Campaign:</strong> ${safeTracking.utm_campaign}</li>
        <li><strong>UTM Content:</strong> ${safeTracking.utm_content}</li>
        <li><strong>UTM Term:</strong> ${safeTracking.utm_term}</li>
        <li><strong>FBCLID:</strong> ${safeTracking.fbclid}</li>
      </ul>
    `;

    // 5. Send Email via Resend
    const resend = getResendClient();
    const { data: resendData, error } = await resend.emails.send({
      from: process.env.QUOTE_FROM_EMAIL || 'quotes@nepalivairoofwash.com.au',
      to: [process.env.QUOTE_TO_EMAIL || 'nepalivairoofwash@gmail.com'],
      reply_to: email,
      subject: 'New Roof Quote Request - Nepali Vai Roof Wash',
      html: htmlContent,
    });

    if (error) {
      console.error('Resend API Error:', error);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    return res.status(200).json({ message: 'Email sent successfully', id: resendData?.id });
  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
