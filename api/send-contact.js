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
    // Safely parse JSON body if needed
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
    if (data.website || data._gotcha) {
      return res.status(200).json({ success: true, message: 'Request received' });
    }

    // 6. Extract fields
    const {
      name = '',
      email = '',
      phone = '',
      subject = '',
      address = '',
      service_type = '',
      message = ''
    } = data;

    // 7. Server-side validation
    const trimmedName = String(name).trim();
    if (!trimmedName) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }
    if (trimmedName.length > 100) {
      return res.status(400).json({ success: false, error: 'Name is too long (max 100 characters)' });
    }

    const trimmedPhone = String(phone).trim();
    const trimmedEmail = String(email).trim();
    if (!trimmedPhone && !trimmedEmail) {
      return res.status(400).json({ success: false, error: 'Please provide either a phone number or an email address' });
    }

    // Validate email if provided
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (trimmedEmail) {
      if (trimmedEmail.length > 254 || !emailRegex.test(trimmedEmail)) {
        return res.status(400).json({ success: false, error: 'Invalid email format' });
      }
    }

    // Validate phone if provided (flexible for Australian formatting: numbers, spaces, +, -, (), .)
    const phoneRegex = /^[0-9+\s\-().]{6,30}$/;
    if (trimmedPhone) {
      if (!phoneRegex.test(trimmedPhone)) {
        return res.status(400).json({ success: false, error: 'Invalid phone number format' });
      }
    }

    // Validate optional field lengths
    const trimmedAddress = String(address).trim();
    if (trimmedAddress.length > 200) {
      return res.status(400).json({ success: false, error: 'Address is too long (max 200 characters)' });
    }

    const trimmedSubject = String(subject).trim();
    if (trimmedSubject.length > 200) {
      return res.status(400).json({ success: false, error: 'Subject is too long (max 200 characters)' });
    }

    const trimmedServiceType = String(service_type).trim();
    if (trimmedServiceType.length > 100) {
      return res.status(400).json({ success: false, error: 'Service type is too long (max 100 characters)' });
    }

    const trimmedMessage = String(message).trim();
    if (trimmedMessage.length > 5000) {
      return res.status(400).json({ success: false, error: 'Message is too long (max 5000 characters)' });
    }

    // 8. Normalise & sanitize subject
    let normalizedSubject = trimmedSubject;
    if (!normalizedSubject) {
      if (trimmedServiceType) {
        normalizedSubject = `Service Inquiry: ${trimmedServiceType}`;
      } else {
        normalizedSubject = 'General Website Inquiry';
      }
    }
    const cleanSubject = sanitizeHeader(normalizedSubject);

    // 9. Sanitize all customer-supplied fields for HTML rendering
    const safeName = escapeHtml(trimmedName);
    const safeEmail = trimmedEmail ? escapeHtml(trimmedEmail) : 'Not provided';
    const safePhone = trimmedPhone ? escapeHtml(trimmedPhone) : 'Not provided';
    const safeSubject = escapeHtml(cleanSubject);
    const safeAddress = trimmedAddress ? escapeHtml(trimmedAddress) : 'Not provided';
    const safeServiceType = trimmedServiceType ? escapeHtml(trimmedServiceType) : 'N/A';
    const safeMessage = trimmedMessage ? formatMultiline(trimmedMessage) : 'No message provided';

    // 10. Construct HTML email body
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

    // 11. Build emailOptions with header injection protection
    const subjectPrefix = cleanSubject.startsWith('Service Inquiry:') ? '' : 'New Message: ';
    const emailOptions = {
      from: process.env.QUOTE_FROM_EMAIL || 'quotes@nepalivairoofwash.com.au',
      to: [process.env.QUOTE_TO_EMAIL || 'nepalivairoofwash@gmail.com'],
      subject: `${subjectPrefix}${cleanSubject} - Nepali Vai Roof Wash`,
      html: htmlContent
    };

    // Only set replyTo when a valid customer email exists
    if (trimmedEmail && emailRegex.test(trimmedEmail)) {
      emailOptions.replyTo = sanitizeHeader(trimmedEmail);
    }

    // 12. Send Email via Resend
    const resend = getResendClient();
    const { data: resendData, error } = await resend.emails.send(emailOptions);

    if (error) {
      console.error('Resend send-contact error:', {
        name: error.name,
        message: error.message || error.error,
        statusCode: error.statusCode
      });

      return res.status(500).json({
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
      error: 'Unable to send message'
    });
  }
};
