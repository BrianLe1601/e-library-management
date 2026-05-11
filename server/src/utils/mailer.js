'use strict';

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.MAIL_HOST || 'smtp.gmail.com',
  port:   parseInt(process.env.MAIL_PORT || '587', 10),
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/**
 * sendMail({ to, subject, html })
 * TV3 gọi hàm này để gửi email nhắc nhở hạn trả sách.
 */
const sendMail = async ({ to, subject, html }) => {
  return transporter.sendMail({
    from:    process.env.MAIL_FROM || '"E-Library" <no-reply@elibrary.com>',
    to,
    subject,
    html,
  });
};

module.exports = { sendMail };
