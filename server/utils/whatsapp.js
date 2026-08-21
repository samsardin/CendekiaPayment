const axios = require('axios');
const { run } = require('../database/db');

/**
 * Send WhatsApp Message helper for Cendekia SFMS
 * Supports Fonnte / Wablas / Custom Gateway or fallback db logging
 */
const sendWhatsApp = async (phone, name, message, type = 'PaymentSuccess') => {
  if (!phone) return { success: false, error: 'Nomor telepon tidak tersedia' };

  // Normalize Indonesian phone number (0812... -> 62812...)
  let targetPhone = phone.toString().replace(/[^0-9]/g, '');
  if (targetPhone.startsWith('0')) {
    targetPhone = '62' + targetPhone.substring(1);
  }

  const token = process.env.WA_TOKEN || process.env.FONNTE_TOKEN;
  let status = 'Pending';
  let apiResponse = null;

  try {
    if (token) {
      // Integration with Fonnte WhatsApp Gateway API
      const response = await axios.post(
        'https://api.fonnte.com/send-message',
        {
          target: targetPhone,
          message: message,
          countryCode: '62'
        },
        {
          headers: {
            Authorization: token
          },
          timeout: 10000
        }
      );

      if (response.data && (response.data.status === true || response.data.status === 'true')) {
        status = 'Sent';
        apiResponse = JSON.stringify(response.data);
      } else {
        status = 'Failed';
        apiResponse = JSON.stringify(response.data);
      }
    } else {
      // Demo / Simulation Mode when token is not configured yet
      status = 'Simulated';
      console.log(`📱 [WA Gateway Simulation] To: ${targetPhone} (${name})\nMessage: ${message}`);
    }
  } catch (err) {
    status = 'Failed';
    apiResponse = err.message;
    console.error('WA Send Error:', err.message);
  }

  // Save log to database wa_logs table
  try {
    await run(
      `INSERT INTO wa_logs (recipient_phone, recipient_name, message, type, status, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [targetPhone, name || 'Wali Murid', message, type, status]
    );
  } catch (dbErr) {
    console.error('WA DB Log Error:', dbErr.message);
  }

  return { success: status === 'Sent' || status === 'Simulated', status, response: apiResponse };
};

module.exports = { sendWhatsApp };
