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

/**
 * Strips carriage returns and newlines to prevent email header injection.
 */
function sanitizeHeader(str) {
  if (!str) return '';
  return String(str).replace(/[\r\n]/g, '').trim();
}

/**
 * Validates whether the incoming Origin header is permitted.
 */
function isValidOrigin(req) {
  const origin = req.headers['origin'];
  if (!origin) {
    const secFetchSite = req.headers['sec-fetch-site'];
    if (secFetchSite && secFetchSite !== 'same-origin' && secFetchSite !== 'same-site' && secFetchSite !== 'none') {
      return false;
    }
    return true;
  }

  try {
    const parsedOrigin = new URL(origin);
    const originHost = parsedOrigin.host.toLowerCase();
    const originHref = parsedOrigin.origin.toLowerCase();

    // 1. Approved production origins
    if (
      originHref === 'https://www.nepalivairoofwash.com.au' ||
      originHref === 'https://nepalivairoofwash.com.au'
    ) {
      return true;
    }

    // 2. Exact match with request Host (preserves same-origin Vercel previews and localhost)
    const hostHeader = (req.headers['x-forwarded-host'] || req.headers['host'] || '').toLowerCase();
    if (hostHeader && originHost === hostHeader) {
      return true;
    }

    return false;
  } catch (e) {
    return false;
  }
}

const MAX_PAYLOAD_SIZE = 50 * 1024; // 50 KB

module.exports = async (req, res) => {
  // 1. Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  // 2. Origin validation
  if (!isValidOrigin(req)) {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }

  // 3. Request Content-Type validation
  const contentType = req.headers['content-type'] || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return res.status(415).json({ success: false, error: 'Unsupported Media Type' });
  }

  // 4. Request size protection (Content-Length and body size)
  const contentLength = parseInt(req.headers['content-length'], 10);
  if (!isNaN(contentLength) && contentLength > MAX_PAYLOAD_SIZE) {
    return res.status(413).json({ success: false, error: 'Payload Too Large' });
  }

  try {
    // Parse request body
    let data;
    if (typeof req.body === 'string') {
      if (Buffer.byteLength(req.body) > MAX_PAYLOAD_SIZE) {
        return res.status(413).json({ success: false, error: 'Payload Too Large' });
      }
      try {
        data = JSON.parse(req.body);
      } catch (err) {
        return res.status(400).json({ success: false, error: 'Invalid JSON payload' });
      }
    } else {
      data = req.body || {};
      if (Buffer.byteLength(JSON.stringify(data)) > MAX_PAYLOAD_SIZE) {
        return res.status(413).json({ success: false, error: 'Payload Too Large' });
      }
    }

    // 5. Honeypot check (silently accept bot submissions)
    if (data.website) {
      return res.status(200).json({ success: true, message: 'Request received' });
    }

    // 6. Extract fields
    const {
      name,
      email,
      phone,
      address,
      roofType = 'N/A',
      tileDamage = 'N/A',
      hasLeak = 'N/A',
      services = [],
      contactMethod,
      notes = 'N/A',
      tracking = {}
    } = data;

    // 7. Validate required fields
    const trimmedName = String(name || '').trim();
    const trimmedEmail = String(email || '').trim();
    const trimmedPhone = String(phone || '').trim();
    const trimmedAddress = String(address || '').trim();

    if (!trimmedName || !trimmedEmail || !trimmedPhone || !trimmedAddress) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    if (trimmedName.length > 100) {
      return res.status(400).json({ success: false, error: 'Name is too long (max 100 characters)' });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (trimmedEmail.length > 254 || !emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ success: false, error: 'Invalid email format' });
    }

    // Phone format validation
    const phoneRegex = /^[0-9+\s\-().]{6,30}$/;
    if (!phoneRegex.test(trimmedPhone)) {
      return res.status(400).json({ success: false, error: 'Invalid phone number format' });
    }

    if (trimmedAddress.length > 200) {
      return res.status(400).json({ success: false, error: 'Address is too long (max 200 characters)' });
    }

    // Optional fields validation & sanitization
    const trimmedNotes = String(notes || 'N/A').trim();
    if (trimmedNotes.length > 5000) {
      return res.status(400).json({ success: false, error: 'Notes are too long (max 5000 characters)' });
    }

    const safeName = escapeHtml(trimmedName);
    const safeEmail = escapeHtml(trimmedEmail);
    const safePhone = escapeHtml(trimmedPhone);
    const safeAddress = escapeHtml(trimmedAddress);
    const trimmedContactMethod = String(contactMethod || '').trim();
    const contactMethodRow = (trimmedContactMethod && trimmedContactMethod !== 'N/A')
      ? `\n        <li><strong>Preferred Contact Method:</strong> ${escapeHtml(trimmedContactMethod.slice(0, 100))}</li>`
      : '';
    const safeRoofType = escapeHtml(String(roofType || 'N/A').slice(0, 100));
    const safeTileDamage = escapeHtml(String(tileDamage || 'N/A').slice(0, 100));
    const safeHasLeak = escapeHtml(String(hasLeak || 'N/A').slice(0, 100));
    const safeNotes = formatMultiline(trimmedNotes);

    const rawServicesList = Array.isArray(services) ? services : (services ? [services] : []);
    const servicesText = rawServicesList.length > 0
      ? rawServicesList.slice(0, 20).map(s => escapeHtml(String(s).slice(0, 100))).join(', ')
      : 'None selected';

    const safeTracking = {
      timestamp: escapeHtml(String(tracking?.timestamp || new Date().toISOString()).slice(0, 50)),
      pageUrl: escapeHtml(String(tracking?.pageUrl || 'N/A').slice(0, 300)),
      referrer: escapeHtml(String(tracking?.referrer || 'N/A').slice(0, 300)),
      utm_source: escapeHtml(String(tracking?.utm_source || 'N/A').slice(0, 100)),
      utm_medium: escapeHtml(String(tracking?.utm_medium || 'N/A').slice(0, 100)),
      utm_campaign: escapeHtml(String(tracking?.utm_campaign || 'N/A').slice(0, 100)),
      utm_content: escapeHtml(String(tracking?.utm_content || 'N/A').slice(0, 100)),
      utm_term: escapeHtml(String(tracking?.utm_term || 'N/A').slice(0, 100)),
      fbclid: escapeHtml(String(tracking?.fbclid || 'N/A').slice(0, 100))
    };

    // 8. Construct email HTML
    const htmlContent = `
      <h2>New Roof Quote Request</h2>
      <p>A new quote request has been submitted from <strong>Nepali Vai Roof Wash</strong>.</p>
      
      <h3>Customer Details</h3>
      <ul>
        <li><strong>Full Name:</strong> ${safeName}</li>
        <li><strong>Email:</strong> ${safeEmail}</li>
        <li><strong>Phone Number:</strong> ${safePhone}</li>
        <li><strong>Full Address:</strong> ${safeAddress}</li>${contactMethodRow}
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

    // 9. Send Email via Resend
    const resend = getResendClient();
    const { data: resendData, error } = await resend.emails.send({
      from: process.env.QUOTE_FROM_EMAIL || 'quotes@nepalivairoofwash.com.au',
      to: [process.env.QUOTE_TO_EMAIL || 'nepalivairoofwash@gmail.com'],
      reply_to: sanitizeHeader(trimmedEmail),
      subject: 'New Roof Quote Request - Nepali Vai Roof Wash',
      html: htmlContent,
    });

    if (error) {
      console.error('Resend send-quote error:', {
        name: error.name,
        message: error.message || error.error,
        statusCode: error.statusCode
      });
      return res.status(500).json({ success: false, error: 'Unable to send message' });
    }

    return res.status(200).json({ success: true, message: 'Email sent successfully', id: resendData?.id });
  } catch (error) {
    console.error('Server Error:', error.message || error);
    return res.status(500).json({ success: false, error: 'Unable to send message' });
  }
};
