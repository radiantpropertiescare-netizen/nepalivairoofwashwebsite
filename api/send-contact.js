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
  // 1. Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    // 2. Safely parse JSON body
    let data;
    if (typeof req.body === 'string') {
      try {
        data = JSON.parse(req.body);
      } catch (err) {
        return res.status(400).json({ success: false, error: 'Invalid JSON payload' });
      }
    } else {
      data = req.body || {};
    }

    // 3. Honeypot check (silently accept bot submissions)
    if (data.website || data._gotcha) {
      return res.status(200).json({ success: true, message: 'Request received' });
    }

    // 4. Extract fields
    const {
      name = '',
      email = '',
      phone = '',
      subject = '',
      address = '',
      service_type = '',
      message = ''
    } = data;

    // 5. Validation
    const trimmedName = String(name).trim();
    if (!trimmedName) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }

    const trimmedPhone = String(phone).trim();
    const trimmedEmail = String(email).trim();
    if (!trimmedPhone && !trimmedEmail) {
      return res.status(400).json({ success: false, error: 'Please provide either a phone number or an email address' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (trimmedEmail && !emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ success: false, error: 'Invalid email format' });
    }

    // 6. Normalise subject
    let normalizedSubject = String(subject).trim();
    if (!normalizedSubject) {
      if (service_type && String(service_type).trim()) {
        normalizedSubject = `Service Inquiry: ${String(service_type).trim()}`;
      } else {
        normalizedSubject = 'General Website Inquiry';
      }
    }

    // 7. Sanitize all customer-supplied fields
    const safeName = escapeHtml(trimmedName);
    const safeEmail = trimmedEmail ? escapeHtml(trimmedEmail) : 'Not provided';
    const safePhone = trimmedPhone ? escapeHtml(trimmedPhone) : 'Not provided';
    const safeSubject = escapeHtml(normalizedSubject);
    const safeAddress = address && String(address).trim() ? escapeHtml(String(address).trim()) : 'Not provided';
    const safeServiceType = service_type && String(service_type).trim() ? escapeHtml(String(service_type).trim()) : 'N/A';
    const safeMessage = message && String(message).trim() ? formatMultiline(String(message).trim()) : 'No message provided';

    // 8. Construct HTML email body
    const htmlContent = `
      <h2>New Contact Form Submission</h2>
      <p>A new message has been submitted from the <strong>Nepali Vai Roof Wash</strong> website.</p>
      
      <h3>Customer Details</h3>
      <ul>
        <li><strong>Full Name:</strong> ${safeName}</li>
        <li><strong>Email:</strong> ${safeEmail}</li>
        <li><strong>Phone Number:</strong> ${safePhone}</li>
        <li><strong>Address:</strong> ${safeAddress}</li>
      </ul>

      <h3>Inquiry Details</h3>
      <ul>
        <li><strong>Subject:</strong> ${safeSubject}</li>
        <li><strong>Service Type:</strong> ${safeServiceType}</li>
      </ul>

      <h3>Message</h3>
      <p>${safeMessage}</p>
    `;

    // 9. Build emailOptions explicitly using the same environment-variable strategy as working send-quote
    const emailOptions = {
      from: process.env.QUOTE_FROM_EMAIL || 'quotes@nepalivairoofwash.com.au',
      to: [process.env.QUOTE_TO_EMAIL || 'nepalivairoofwash@gmail.com'],
      subject: `New Message: ${safeSubject} - Nepali Vai Roof Wash`,
      html: htmlContent
    };

    // Only set replyTo when a valid customer email exists
    if (trimmedEmail && emailRegex.test(trimmedEmail)) {
      emailOptions.replyTo = trimmedEmail;
    }

    // 10. Send Email via Resend
    const resend = getResendClient();
    const { data: resendData, error } = await resend.emails.send(emailOptions);

    if (error) {
      console.error('Resend send-contact error:', {
        name: error.name,
        message: error.message || error.error,
        statusCode: error.statusCode
      });

      return res.status(error.statusCode || 500).json({
        success: false,
        error: 'Unable to send message'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      id: resendData?.id
    });
  } catch (error) {
    console.error('Server Error:', error.message || error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error'
    });
  }
};
