import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY!)

const fromEmail = process.env.EMAIL_FROM!
const adminEmail = process.env.ADMIN_EMAIL!

export async function sendBookingConfirmation(email: string, name: string, planName: string, date: string, time: string) {
  try {
    await resend.emails.send({
      from: `Migration Republic <${fromEmail}>`,
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
          <p>Thank you,<br/><strong>Migration Republic Team</strong></p>
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

export async function sendToolLeadAdminAlert(name: string, email: string, phone: string | undefined, toolName: string, resultsSummary: string) {
  try {
    await resend.emails.send({
      from: `System Notification <${fromEmail}>`,
      to: adminEmail,
      subject: `New Tool Lead: ${toolName} - ${name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
          <h2 style="color: #0066cc;">New Tool Lead Received</h2>
          <p>A new lead has been captured from the tools section.</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Tool:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${toolName}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Client:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${name}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${email}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Phone:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${phone || 'N/A'}</td></tr>
            <tr><td style="padding: 8px;"><strong>Results Summary:</strong></td><td style="padding: 8px;"><pre style="font-size: 12px;">${resultsSummary}</pre></td></tr>
          </table>
        </div>
      `
    })
  } catch (error) {
    console.error('Failed to send tool admin alert email:', error)
  }
}

export async function sendToolResultClientEmail(email: string, name: string, toolName: string) {
  try {
    await resend.emails.send({
      from: `Migration Republic <${fromEmail}>`,
      to: email,
      subject: `Your ${toolName} Results - Migration Republic`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
          <h2 style="color: #333;">Your Tool Results</h2>
          <p>Hi ${name},</p>
          <p>Thank you for using our <strong>${toolName}</strong>.</p>
          <p>We have successfully received your details. Please note that the tool provides an initial estimate based on the information you provided.</p>
          <p>For more detailed information, step-by-step guidance, and a comprehensive assessment of your specific migration options, please book a formal consultation with our experts.</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="https://migrationrepublic.com.au/book-a-consultation/" style="background-color: #0066cc; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Book a Consultation</a>
          </p>
          <p>Thank you,<br/><strong>Migration Republic Team</strong></p>
        </div>
      `
    })
  } catch (error) {
    console.error('Failed to send tool client email:', error)
  }
}
