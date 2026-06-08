import nodemailer from 'nodemailer';

export async function sendEmail(subject: string, body: string): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.GMAIL_USER!,
      pass: process.env.GMAIL_APP_PASSWORD!,
    },
  });

  await transporter.sendMail({
    from: process.env.GMAIL_USER!,
    to: process.env.RECIPIENT_EMAIL!,
    subject,
    text: body,
  });
}
