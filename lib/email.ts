import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY!)

const fromEmail = process.env.EMAIL_FROM!
const adminEmail = process.env.ADMIN_EMAIL!

export async function sendBookingConfirmation(email: string, name: string, planName: string, date: string, time: string) {
  try {
    await resend.emails.send({
      from: `Migration Agent Near Me <${fromEmail}>`,
      to: email,
      subject: `Booking Confirmed: ${planName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
          <h2 style="color: #333;">Booking Confirmed</h2>
          <p>Hi ${name},</p>
          <p>Your booking for a <strong>${planName}</strong> has been successfully confirmed.</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Date:</strong> ${date}</p>
            <p style="margin: 5px 0 0 0;"><strong>Time:</strong> ${time}</p>
          </div>
          <p>If you selected an online consultation, a meeting link will be sent to you shortly.</p>
          <p>Thank you,<br/>Migration Agent Near Me Team</p>
        </div>
      `
    })
  } catch (error) {
    console.error('Failed to send confirmation email:', error)
  }
}

export async function sendAdminAlert(name: string, email: string, planName: string, date: string, time: string, notes?: string) {
  try {
    await resend.emails.send({
      from: `System Notification <${fromEmail}>`,
      to: adminEmail,
      subject: `New Booking: ${planName} - ${name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
          <h2 style="color: #0066cc;">New Booking Received</h2>
          <p>A new consultation has been booked.</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Client:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${name}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${email}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Plan:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${planName}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Date:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${date}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Time:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${time}</td></tr>
            <tr><td style="padding: 8px;"><strong>Notes:</strong></td><td style="padding: 8px;">${notes || 'None'}</td></tr>
          </table>
        </div>
      `
    })
  } catch (error) {
    console.error('Failed to send admin alert email:', error)
  }
}
