const nodemailer = require('nodemailer');

let transporter = null;

// Called once at server start — creates Ethereal test account in dev if no SMTP config
async function init() {
  if (process.env.EMAIL_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    console.log('[email] SMTP transporter ready:', process.env.EMAIL_HOST);
  } else if (process.env.NODE_ENV !== 'production') {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log('[email] Ethereal test account:', testAccount.user);
    console.log('[email] Preview emails at https://ethereal.email');
  }
}

const FROM    = process.env.EMAIL_FROM   || '"AI Doctor" <noreply@aidoctor.app>';
const APP_URL = process.env.CLIENT_URL   || 'http://localhost:5173';

async function send(options) {
  if (!transporter) return;
  try {
    const info = await transporter.sendMail({ from: FROM, ...options });
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) console.log('[email] Preview:', previewUrl);
  } catch (err) {
    console.error('[email] send error:', err.message);
  }
}

async function sendWelcomeEmail(user) {
  await send({
    to: user.email,
    subject: 'Welcome to AI Doctor',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0d1221;color:#f1f5f9;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#3b82f6,#06b6d4);padding:32px;text-align:center">
          <div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px">
            <span style="font-size:24px;font-weight:900;color:#fff">AI</span>
          </div>
          <h1 style="color:#fff;margin:0;font-size:22px">Welcome to AI Doctor</h1>
        </div>
        <div style="padding:32px">
          <p style="color:#94a3b8">Hi <strong style="color:#f1f5f9">${user.name}</strong>,</p>
          <p style="color:#94a3b8">Your account is ready. You can now upload chest X-rays for AI-powered analysis and check symptoms using our NLP pipeline.</p>
          <div style="text-align:center;margin:28px 0">
            <a href="${APP_URL}" style="background:#3b82f6;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600">Open AI Doctor</a>
          </div>
          <p style="color:#475569;font-size:12px;border-top:1px solid #1e293b;padding-top:16px;margin-top:24px">
            For educational use only. Not a substitute for professional medical advice.
          </p>
        </div>
      </div>
    `,
  });
}

async function sendPasswordResetEmail(user, token) {
  const resetUrl = `${APP_URL}/reset-password/${token}`;
  await send({
    to: user.email,
    subject: 'Reset your AI Doctor password',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0d1221;color:#f1f5f9;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#7c3aed,#3b82f6);padding:32px;text-align:center">
          <div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;font-size:28px">
            🔑
          </div>
          <h1 style="color:#fff;margin:0;font-size:22px">Password Reset</h1>
        </div>
        <div style="padding:32px">
          <p style="color:#94a3b8">Hi <strong style="color:#f1f5f9">${user.name}</strong>,</p>
          <p style="color:#94a3b8">We received a request to reset your password. Click the button below — this link expires in <strong style="color:#f1f5f9">1 hour</strong>.</p>
          <div style="text-align:center;margin:28px 0">
            <a href="${resetUrl}" style="background:#7c3aed;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600">Reset my password</a>
          </div>
          <p style="color:#475569;font-size:12px">Or copy this URL into your browser:<br>
            <span style="color:#94a3b8;word-break:break-all">${resetUrl}</span>
          </p>
          <p style="color:#475569;font-size:12px;border-top:1px solid #1e293b;padding-top:16px;margin-top:16px">
            If you didn't request a password reset, ignore this email.
          </p>
        </div>
      </div>
    `,
  });
}

module.exports = { init, sendWelcomeEmail, sendPasswordResetEmail };
