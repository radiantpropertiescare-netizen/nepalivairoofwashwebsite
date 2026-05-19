const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  
  try {
    const data = JSON.parse(event.body);

    const {
      name = 'N/A',
      email = 'N/A',
      phone = 'N/A',
      subject = 'General Inquiry',
      address = 'N/A',
      service_type = 'N/A',
      message = 'N/A'
    } = data;

    const htmlContent = `
      <h2>New Contact Form Submission</h2>
      <p>A new message has been submitted from the <strong>Nepali Vai Roof Wash</strong> website.</p>
      
      <h3>Customer Details</h3>
      <ul>
        <li><strong>Full Name:</strong> ${name}</li>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Phone Number:</strong> ${phone}</li>
        <li><strong>Address:</strong> ${address}</li>
      </ul>

      <h3>Inquiry Details</h3>
      <ul>
        <li><strong>Subject:</strong> ${subject}</li>
        <li><strong>Service Type:</strong> ${service_type}</li>
      </ul>

      <h3>Message</h3>
      <p>${message}</p>
    `;

    const { data: resendData, error } = await resend.emails.send({
      from: process.env.QUOTE_FROM_EMAIL || 'quotes@nepalivairoofwash.com.au',
      to: [process.env.QUOTE_TO_EMAIL || 'nepalivairoofwash@gmail.com'],
      reply_to: email !== 'N/A' && email !== '' ? email : 'nepalivairoofwash@gmail.com',
      subject: `New Message: ${subject} - Nepali Vai Roof Wash`,
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
