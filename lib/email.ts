import { Resend } from 'resend';

export async function sendAdminNotification(subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.FROM_EMAIL;
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map((v) => v.trim()).filter(Boolean) ?? [];

  if (!apiKey || !from || adminEmails.length === 0) {
    return { skipped: true };
  }

  const resend = new Resend(apiKey);
  return resend.emails.send({
    from,
    to: adminEmails,
    subject,
    html,
  });
}
