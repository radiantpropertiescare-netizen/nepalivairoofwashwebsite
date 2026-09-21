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
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
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

    const {
      name = 'N/A',
      email = 'N/A',
      phone = 'N/A',
      subject = 'General Inquiry',
      address = 'N/A',
      service_type = 'N/A',
      message = 'N/A'
    } = data;

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safePhone = escapeHtml(phone);
    const safeSubject = escapeHtml(subject);
    const safeAddress = escapeHtml(address);
    const safeServiceType = escapeHtml(service_type);
    const safeMessage = formatMultiline(message);

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

    const resend = getResendClient();
    const { data: resendData, error } = await resend.emails.send({
      from: process.env.QUOTE_FROM_EMAIL || 'quotes@nepalivairoofwash.com.au',
      to: [process.env.QUOTE_TO_EMAIL || 'nepalivairoofwash@gmail.com'],
      reply_to: email !== 'N/A' && email !== '' ? email : 'nepalivairoofwash@gmail.com',
      subject: `New Message: ${safeSubject} - Nepali Vai Roof Wash`,
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
