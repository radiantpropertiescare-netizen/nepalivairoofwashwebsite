const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body);

    // 1. Honeypot check
    if (data.website) {
      // If honeypot is filled, silently return success to deter bots
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Request received' }),
      };
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
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid email format' }),
      };
    }

    // 3. Format services array
    const servicesText = Array.isArray(services) ? services.join(', ') : services;

    // 4. Construct email HTML
    const htmlContent = `
      <h2>New Roof Quote Request</h2>
      <p>A new quote request has been submitted from <strong>Nepali Vai Roof Wash</strong>.</p>
      
      <h3>Customer Details</h3>
      <ul>
        <li><strong>Full Name:</strong> ${name}</li>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Phone Number:</strong> ${phone}</li>
        <li><strong>Full Address:</strong> ${address}</li>
        <li><strong>Preferred Contact Method:</strong> ${contactMethod}</li>
      </ul>

      <h3>Project Details</h3>
      <ul>
        <li><strong>Roof Type:</strong> ${roofType}</li>
        <li><strong>Missing/Cracked Tiles:</strong> ${tileDamage}</li>
        <li><strong>Roof Leak:</strong> ${hasLeak}</li>
        <li><strong>Services Selected:</strong> ${servicesText}</li>
      </ul>

      <h3>Additional Notes</h3>
      <p>${notes}</p>

      <h3>Tracking Information</h3>
      <ul>
        <li><strong>Timestamp:</strong> ${tracking.timestamp || new Date().toISOString()}</li>
        <li><strong>Page URL:</strong> ${tracking.pageUrl || 'N/A'}</li>
        <li><strong>Referrer:</strong> ${tracking.referrer || 'N/A'}</li>
        <li><strong>UTM Source:</strong> ${tracking.utm_source || 'N/A'}</li>
        <li><strong>UTM Medium:</strong> ${tracking.utm_medium || 'N/A'}</li>
        <li><strong>UTM Campaign:</strong> ${tracking.utm_campaign || 'N/A'}</li>
        <li><strong>UTM Content:</strong> ${tracking.utm_content || 'N/A'}</li>
        <li><strong>UTM Term:</strong> ${tracking.utm_term || 'N/A'}</li>
        <li><strong>FBCLID:</strong> ${tracking.fbclid || 'N/A'}</li>
      </ul>
    `;

    // 5. Send Email via Resend
    const { data: resendData, error } = await resend.emails.send({
      from: process.env.QUOTE_FROM_EMAIL || 'quotes@nepalivairoofwash.com.au',
      to: [process.env.QUOTE_TO_EMAIL || 'nepalivairoofwash@gmail.com'],
      reply_to: email,
      subject: 'New Roof Quote Request - Nepali Vai Roof Wash',
      html: htmlContent,
    });

    if (error) {
      console.error('Resend API Error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to send email' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Email sent successfully', id: resendData?.id }),
    };
  } catch (error) {
    console.error('Server Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
