import { Resend } from 'resend'
import { env } from './env'

export const resend = new Resend(env.RESEND_KEY)

const fromEmail = env.EMAIL_FROM
const adminEmail = env.ADMIN_EMAIL

export function wrapEmailTemplate(contentHtml: string): string {
  return `
    <div style="background-color: #f3f4f6; padding: 30px 15px; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; min-height: 100%;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); overflow: hidden;">
        <!-- Header -->
        <div style="background-color: #030E1E; padding: 24px; text-align: center; border-bottom: 2px solid #D4AF37;">
          <img src="https://immigrationagentnearme.com/images/logo.jpg" alt="Migration Republic" style="width: 70px; height: 70px; border-radius: 50%; border: 2px solid #D4AF37; display: block; margin: 0 auto 12px auto; object-fit: cover;" />
          <div style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; line-height: 1.2;">Migration Republic</div>
          <div style="color: #D4AF37; margin: 4px 0 0 0; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px;">Registered Migration Agents</div>
        </div>
        
        <!-- Body Content -->
        <div style="padding: 32px 24px; color: #1e293b; line-height: 1.6; font-size: 15px;">
          ${contentHtml}
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 28px 24px; text-align: center; color: #64748b; font-size: 13px;">
          <div style="font-weight: bold; color: #030E1E; margin-bottom: 8px; font-size: 14px;">Migration Republic</div>
          <div style="margin-bottom: 16px; line-height: 1.5;">
            📍 470 St Kilda Road, Melbourne, VIC 3004<br/>
            📞 <a href="tel:+61435321219" style="color: #030E1E; text-decoration: none; font-weight: 600;">+61 435 321 219</a><br/>
            ✉️ <a href="mailto:info@migrationrepublic.com.au" style="color: #030E1E; text-decoration: none; font-weight: 600;">info@migrationrepublic.com.au</a><br/>
            🌐 <a href="https://migrationrepublic.com.au" target="_blank" rel="noopener noreferrer" style="color: #D4AF37; text-decoration: none; font-weight: 600;">migrationrepublic.com.au</a>
          </div>
          
          <div style="margin: 20px 0; border-top: 1px solid #e2e8f0; padding-top: 16px;">
            <span style="font-weight: 600; color: #030E1E; display: block; margin-bottom: 10px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Follow Us</span>
            <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #3b5998; color: #ffffff; padding: 6px 14px; border-radius: 4px; text-decoration: none; font-size: 12px; font-weight: bold; margin: 0 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Facebook</a>
            <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #e1306c; color: #ffffff; padding: 6px 14px; border-radius: 4px; text-decoration: none; font-size: 12px; font-weight: bold; margin: 0 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Instagram</a>
            <a href="https://www.linkedin.com/" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #0077b5; color: #ffffff; padding: 6px 14px; border-radius: 4px; text-decoration: none; font-size: 12px; font-weight: bold; margin: 0 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">LinkedIn</a>
          </div>
          
          <div style="font-size: 11px; color: #94a3b8; margin-top: 20px; line-height: 1.5; border-top: 1px solid #e2e8f0; padding-top: 16px;">
            🏛️ MARN: 2518961 | All agents MARA registered.<br/>
            © 2026 Migration Republic. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  `;
}

export async function sendBookingConfirmation(
  email: string,
  name: string,
  planName: string,
  date: string,
  time: string,
  phone?: string
) {
  try {
    const isVideoConsultation = planName.toLowerCase().includes("video") || planName.toLowerCase().includes("online");
    const meetLink = env.MICROSOFT_MEET_LINK;

    const videoLinkSection = isVideoConsultation ? `
      <div style="background-color: #f0f4ff; border-left: 4px solid #030E1E; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0; color: #030E1E; font-weight: bold;">Microsoft Teams Video Meeting Link:</p>
        <p style="margin: 5px 0 15px 0; font-size: 14px; color: #4b5563;">You can join your scheduled online consultation directly by clicking the button below:</p>
        <div style="text-align: center;">
          <a href="${meetLink}" target="_blank" rel="noopener noreferrer" style="background-color: #e40229; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px; box-shadow: 0 4px 6px rgba(228, 2, 41, 0.15);">Join Microsoft Teams Meeting</a>
        </div>
      </div>
    ` : `
      <p style="color: #64748b; font-size: 14px; background-color: #f8fafc; border-left: 4px solid #D4AF37; padding: 12px; border-radius: 4px; margin: 20px 0;">
        📞 We will call you at your scheduled time on the phone number provided: <strong>${phone || 'N/A'}</strong>. Please ensure you are available.
      </p>
    `;

    const htmlContent = wrapEmailTemplate(`
      <h2 style="color: #030E1E; margin-top: 0; font-size: 20px; font-weight: bold; border-bottom: 2px solid #D4AF37; padding-bottom: 8px;">Booking Confirmed</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your booking for a <strong>${planName}</strong> has been successfully confirmed. Below are your booking details:</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 14px; width: 100px;"><strong>Date:</strong></td>
            <td style="padding: 6px 0; color: #030E1E; font-size: 14px; font-weight: 600;">${date}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 14px;"><strong>Time:</strong></td>
            <td style="padding: 6px 0; color: #030E1E; font-size: 14px; font-weight: 600;">${time}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 14px;"><strong>Phone:</strong></td>
            <td style="padding: 6px 0; color: #030E1E; font-size: 14px; font-weight: 600;">${phone || 'N/A'}</td>
          </tr>
        </table>
      </div>
      
      ${videoLinkSection}
      
      <p style="margin-top: 24px;">Thank you for choosing Migration Republic. We look forward to assisting you.</p>
    `);

    await resend.emails.send({
      from: `Migration Republic <${fromEmail}>`,
      to: email,
      subject: `Booking Confirmed: ${planName}`,
      html: htmlContent
    });
  } catch (error) {
    console.error('Failed to send confirmation email:', error)
  }
}

export async function sendAdminAlert(
  name: string,
  email: string,
  planName: string,
  date: string,
  time: string,
  phone?: string,
  notes?: string
) {
  try {
    const isVideoConsultation = planName.toLowerCase().includes("video") || planName.toLowerCase().includes("online");
    const meetLink = env.MICROSOFT_MEET_LINK;

    const videoLinkRow = isVideoConsultation ? `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 0; color: #64748b; font-size: 14px; vertical-align: top;"><strong>Meeting Link:</strong></td>
        <td style="padding: 10px 0; font-size: 14px;">
          <a href="${meetLink}" target="_blank" rel="noopener noreferrer" style="color: #e40229; font-weight: bold; text-decoration: underline;">Join Microsoft Teams Meeting</a>
        </td>
      </tr>
    ` : "";

    const htmlContent = wrapEmailTemplate(`
      <h2 style="color: #030E1E; margin-top: 0; font-size: 20px; font-weight: bold; border-bottom: 2px solid #D4AF37; padding-bottom: 8px;">New Booking Received</h2>
      <p>A new consultation has been booked through the website. Here are the client's details:</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-size: 14px; width: 120px;"><strong>Client Name:</strong></td>
            <td style="padding: 10px 0; color: #030E1E; font-size: 14px; font-weight: 600;">${name}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-size: 14px;"><strong>Email:</strong></td>
            <td style="padding: 10px 0; color: #030E1E; font-size: 14px; font-weight: 600;"><a href="mailto:${email}" style="color: #030E1E; text-decoration: none;">${email}</a></td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-size: 14px;"><strong>Phone:</strong></td>
            <td style="padding: 10px 0; color: #030E1E; font-size: 14px; font-weight: 600;"><a href="tel:${phone}" style="color: #030E1E; text-decoration: none;">${phone || 'N/A'}</a></td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-size: 14px;"><strong>Selected Plan:</strong></td>
            <td style="padding: 10px 0; color: #030E1E; font-size: 14px; font-weight: 600;">${planName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-size: 14px;"><strong>Date:</strong></td>
            <td style="padding: 10px 0; color: #030E1E; font-size: 14px; font-weight: 600;">${date}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-size: 14px;"><strong>Time:</strong></td>
            <td style="padding: 10px 0; color: #030E1E; font-size: 14px; font-weight: 600;">${time}</td>
          </tr>
          ${videoLinkRow}
          <tr>
            <td style="padding: 10px 0; color: #64748b; font-size: 14px; vertical-align: top;"><strong>Notes:</strong></td>
            <td style="padding: 10px 0; color: #1e293b; font-size: 14px; white-space: pre-wrap; vertical-align: top;">${notes || 'None'}</td>
          </tr>
        </table>
      </div>
    `);

    await resend.emails.send({
      from: `System Notification <${fromEmail}>`,
      to: adminEmail,
      subject: `New Booking: ${planName} - ${name}`,
      html: htmlContent
    });
  } catch (error) {
    console.error('Failed to send admin alert email:', error)
  }
}

export async function sendToolLeadAdminAlert(
  name: string,
  email: string,
  phone: string | undefined,
  toolName: string,
  resultsSummary: string
) {
  try {
    const htmlContent = wrapEmailTemplate(`
      <h2 style="color: #030E1E; margin-top: 0; font-size: 20px; font-weight: bold; border-bottom: 2px solid #D4AF37; padding-bottom: 8px;">New Tool Lead Captured</h2>
      <p>A new lead has been captured from the migration tools section. Here are the client's details:</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-size: 14px; width: 120px;"><strong>Tool Used:</strong></td>
            <td style="padding: 10px 0; color: #030E1E; font-size: 14px; font-weight: 600;">${toolName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-size: 14px;"><strong>Client Name:</strong></td>
            <td style="padding: 10px 0; color: #030E1E; font-size: 14px; font-weight: 600;">${name}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-size: 14px;"><strong>Email:</strong></td>
            <td style="padding: 10px 0; color: #030E1E; font-size: 14px; font-weight: 600;"><a href="mailto:${email}" style="color: #030E1E; text-decoration: none;">${email}</a></td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-size: 14px;"><strong>Phone:</strong></td>
            <td style="padding: 10px 0; color: #030E1E; font-size: 14px; font-weight: 600;"><a href="tel:${phone}" style="color: #030E1E; text-decoration: none;">${phone || 'N/A'}</a></td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #64748b; font-size: 14px; vertical-align: top;"><strong>Results Summary:</strong></td>
            <td style="padding: 10px 0; color: #1e293b; font-size: 14px; vertical-align: top;"><div>${resultsSummary}</div></td>
          </tr>
        </table>
      </div>
    `);

    await resend.emails.send({
      from: `System Notification <${fromEmail}>`,
      to: adminEmail,
      subject: `New Tool Lead: ${toolName} - ${name}`,
      html: htmlContent
    });
  } catch (error) {
    console.error('Failed to send tool admin alert email:', error)
  }
}

export async function sendToolResultClientEmail(
  email: string,
  name: string,
  toolName: string,
  phone?: string
) {
  try {
    const htmlContent = wrapEmailTemplate(`
      <h2 style="color: #030E1E; margin-top: 0; font-size: 20px; font-weight: bold; border-bottom: 2px solid #D4AF37; padding-bottom: 8px;">Your Tool Results Are Ready</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Thank you for using our <strong>${toolName}</strong> at Migration Republic.</p>
      
      <p>We have successfully received your assessment details. Below are the contact details you submitted for confirmation:</p>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 14px; width: 100px;"><strong>Email:</strong></td>
            <td style="padding: 6px 0; color: #030E1E; font-size: 14px; font-weight: 600;">${email}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 14px;"><strong>Phone:</strong></td>
            <td style="padding: 6px 0; color: #030E1E; font-size: 14px; font-weight: 600;">${phone || 'N/A'}</td>
          </tr>
        </table>
      </div>
      
      <p>Please note that the tool provides an initial estimate based on current migration guidelines. For a comprehensive legal assessment of your specific eligibility, visa pathways, and options, we highly recommend booking a formal consultation with one of our registered MARA agents.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://migrationrepublic.com.au/book-a-consultation/" style="background-color: #e40229; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 15px; box-shadow: 0 4px 6px rgba(228, 2, 41, 0.15);">Book a Consultation</a>
      </div>
      
      <p>Thank you,<br/><strong>Migration Republic Team</strong></p>
    `);

    await resend.emails.send({
      from: `Migration Republic <${fromEmail}>`,
      to: email,
      subject: `Your ${toolName} Results - Migration Republic`,
      html: htmlContent
    });
  } catch (error) {
    console.error('Failed to send tool client email:', error)
  }
}
