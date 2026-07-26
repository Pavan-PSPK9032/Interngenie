const nodemailer = require("nodemailer");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    return null;
  }
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: parseInt(process.env.SMTP_PORT, 10) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

async function sendMail(to, subject, html) {
  const transport = getTransporter();
  if (!transport) {
    console.log("[Email] SMTP not configured. Logging email to console.");
    console.log("[Email] To:", to);
    console.log("[Email] Subject:", subject);
    console.log("[Email] Body:", html);
    return;
  }
  await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
  });
}

async function sendPasswordResetEmail(email, resetUrl) {
  const subject = "InternGenie - Password Reset Request";
  const html = `
    <h2>Password Reset</h2>
    <p>You requested a password reset. Click the link below to set a new password:</p>
    <a href="${resetUrl}">${resetUrl}</a>
    <p>This link expires in 1 hour.</p>
    <p>If you did not request this, you can safely ignore this email.</p>
  `;
  await sendMail(email, subject, html);
}

async function sendVerificationEmail(email, verificationUrl) {
  const subject = "InternGenie - Verify Your Email";
  const html = `
    <h2>Email Verification</h2>
    <p>Click the link below to verify your email address:</p>
    <a href="${verificationUrl}">${verificationUrl}</a>
    <p>This link expires in 24 hours.</p>
  `;
  await sendMail(email, subject, html);
}

async function sendInterviewScheduled(email, internshipTitle, date) {
  const subject = `InternGenie - Interview Scheduled: ${internshipTitle}`;
  const html = `
    <h2>Interview Scheduled</h2>
    <p>Your interview for <strong>${internshipTitle}</strong> has been scheduled.</p>
    <p>Date: ${date}</p>
    <p>Please be prepared and join on time.</p>
  `;
  await sendMail(email, subject, html);
}

async function sendApplicationStatus(email, status, internshipTitle) {
  const subject = `InternGenie - Application Update: ${internshipTitle}`;
  const html = `
    <h2>Application Status Update</h2>
    <p>Your application for <strong>${internshipTitle}</strong> has been updated.</p>
    <p>Status: <strong>${status}</strong></p>
  `;
  await sendMail(email, subject, html);
}

module.exports = {
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendInterviewScheduled,
  sendApplicationStatus,
};
