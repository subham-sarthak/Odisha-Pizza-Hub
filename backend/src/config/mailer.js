import nodemailer from "nodemailer";
import { env } from "./env.js";

let transporter;

const createTransporter = async () => {
  if (transporter) return transporter;

  if (env.emailProvider === "smtp" && env.smtpHost && env.smtpUser && env.smtpPass) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass
      }
    });
    return transporter;
  }

  transporter = nodemailer.createTransport({
    jsonTransport: true
  });
  return transporter;
};

export const sendMail = async ({ to, subject, html, text }) => {
  const mailer = await createTransporter();
  const info = await mailer.sendMail({
    from: env.mailFrom,
    to,
    subject,
    html,
    text
  });

  if (env.emailProvider !== "smtp") {
    console.log("Mock email payload:", info.message?.toString?.() || info.message);
  }

  return info;
};
