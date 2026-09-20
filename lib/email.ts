import { Resend } from 'resend'
import { env } from './env'
import { SettingsService } from './services/settings.service'
import { AppSettings } from './types'

export const resend = new Resend(env.RESEND_KEY)

const fromEmail = env.EMAIL_FROM
const adminEmail = env.ADMIN_EMAIL
const adminRecipients = adminEmail ? adminEmail.split(',').map(e => e.trim()).filter(Boolean) : []

// Escapes untrusted values (names, emails, results, etc.) before they are
// interpolated into HTML email templates, preventing markup/script injection.
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Business name/address/contact/social links come from Admin > Settings so
// every email below stays in sync without a code change.
export function wrapEmailTemplate(contentHtml: string, settings: AppSettings): string {
  const websiteLabel = settings.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')
  const socialLinks = [
    { url: settings.facebook_url, label: 'Facebook', bg: '#3b5998' },
    { url: settings.instagram_url, label: 'Instagram', bg: '#e1306c' },
    { url: settings.linkedin_url, label: 'LinkedIn', bg: '#0077b5' },
  ].filter(s => !!s.url)

  return `
    <div style="background-color: #f3f4f6; padding: 30px 15px; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; min-height: 100%;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #e2e8f0;">
        <!-- Header -->
        <div style="background-color: #ffffff; padding: 28px 24px 20px 24px; text-align: center; border-bottom: 2px solid #D4AF37;">
          <img src="${settings.logo_url}" alt="${settings.business_name}" style="width: 85px; height: auto; display: block; margin: 0 auto 10px auto; border-radius: 50%; border: none; outline: none; box-shadow: none;" />
          <div style="color: #06276C; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; line-height: 1.2;">${settings.business_name}</div>
          <div style="color: #D4AF37; margin: 4px 0 0 0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">${settings.tagline}</div>
        </div>

        <!-- Body Content -->
        <div style="padding: 32px 24px; color: #1e293b; line-height: 1.6; font-size: 15px;">
          ${contentHtml}
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 28px 24px; text-align: center; color: #64748b; font-size: 13px;">
          <div style="font-weight: bold; color: #06276C; margin-bottom: 8px; font-size: 14px;">${settings.business_name}</div>
          <div style="margin-bottom: 16px; line-height: 1.5;">
            📍 ${settings.office_address}<br/>
            📞 <a href="tel:${settings.contact_phone.replace(/\s+/g, '')}" style="color: #06276C; text-decoration: none; font-weight: 600;">${settings.contact_phone}</a><br/>
            ✉️ <a href="mailto:${settings.contact_email}" style="color: #06276C; text-decoration: none; font-weight: 600;">${settings.contact_email}</a><br/>
            🌐 <a href="${settings.website_url}" target="_blank" rel="noopener noreferrer" style="color: #D4AF37; text-decoration: none; font-weight: 600;">${websiteLabel}</a>
          </div>

          ${socialLinks.length > 0 ? `
          <div style="margin: 20px 0; border-top: 1px solid #e2e8f0; padding-top: 16px;">
            <span style="font-weight: 600; color: #06276C; display: block; margin-bottom: 10px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Follow Us</span>
            ${socialLinks.map(s => `<a href="${s.url}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: ${s.bg}; color: #ffffff; padding: 6px 14px; border-radius: 4px; text-decoration: none; font-size: 12px; font-weight: bold; margin: 0 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">${s.label}</a>`).join('')}
          </div>
          ` : ''}

          <div style="font-size: 11px; color: #94a3b8; margin-top: 20px; line-height: 1.5; border-top: 1px solid #e2e8f0; padding-top: 16px;">
            🏛️ MARN: ${settings.marn_number} | All agents MARA registered.<br/>
            © ${new Date().getFullYear()} ${settings.business_name}. All rights reserved.
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
    const settings = await SettingsService.getSettings()
    const isVideoConsultation = planName.toLowerCase().includes("video") || planName.toLowerCase().includes("online");
    const meetLink = env.MICROSOFT_MEET_LINK;

    const videoLinkSection = isVideoConsultation ? `
      <div style="background-color: #f0f4ff; border-left: 4px solid #06276C; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0; color: #06276C; font-weight: bold;">Microsoft Teams Video Meeting Link:</p>
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
      <h2 style="color: #06276C; margin-top: 0; font-size: 20px; font-weight: bold; border-bottom: 2px solid #D4AF37; padding-bottom: 8px;">Booking Confirmed</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your booking for a <strong>${planName}</strong> has been successfully confirmed. Below are your booking details:</p>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 14px; width: 100px;"><strong>Date:</strong></td>
            <td style="padding: 6px 0; color: #06276C; font-size: 14px; font-weight: 600;">${date}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 14px;"><strong>Time:</strong></td>
            <td style="padding: 6px 0; color: #06276C; font-size: 14px; font-weight: 600;">${time}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 14px;"><strong>Phone:</strong></td>
            <td style="padding: 6px 0; color: #06276C; font-size: 14px; font-weight: 600;">${phone || 'N/A'}</td>
          </tr>
        </table>
      </div>

      ${videoLinkSection}

      <p style="margin-top: 24px;">Thank you for choosing ${settings.business_name}. We look forward to assisting you.</p>
    `, settings);

    await resend.emails.send({
      from: `${settings.business_name} <${fromEmail}>`,
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
    const settings = await SettingsService.getSettings()
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
      <h2 style="color: #06276C; margin-top: 0; font-size: 20px; font-weight: bold; border-bottom: 2px solid #D4AF37; padding-bottom: 8px;">New Booking Received</h2>
      <p>A new consultation has been booked through the website. Here are the client's details:</p>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-size: 14px; width: 120px;"><strong>Client Name:</strong></td>
            <td style="padding: 10px 0; color: #06276C; font-size: 14px; font-weight: 600;">${name}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-size: 14px;"><strong>Email:</strong></td>
            <td style="padding: 10px 0; color: #06276C; font-size: 14px; font-weight: 600;"><a href="mailto:${email}" style="color: #06276C; text-decoration: none;">${email}</a></td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-size: 14px;"><strong>Phone:</strong></td>
            <td style="padding: 10px 0; color: #06276C; font-size: 14px; font-weight: 600;"><a href="tel:${phone}" style="color: #06276C; text-decoration: none;">${phone || 'N/A'}</a></td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-size: 14px;"><strong>Selected Plan:</strong></td>
            <td style="padding: 10px 0; color: #06276C; font-size: 14px; font-weight: 600;">${planName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-size: 14px;"><strong>Date:</strong></td>
            <td style="padding: 10px 0; color: #06276C; font-size: 14px; font-weight: 600;">${date}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-size: 14px;"><strong>Time:</strong></td>
            <td style="padding: 10px 0; color: #06276C; font-size: 14px; font-weight: 600;">${time}</td>
          </tr>
          ${videoLinkRow}
          <tr>
            <td style="padding: 10px 0; color: #64748b; font-size: 14px; vertical-align: top;"><strong>Notes:</strong></td>
            <td style="padding: 10px 0; color: #1e293b; font-size: 14px; white-space: pre-wrap; vertical-align: top;">${notes || 'None'}</td>
          </tr>
        </table>
      </div>
    `, settings);

    await resend.emails.send({
      from: `System Notification <${fromEmail}>`,
      to: adminRecipients,
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
    const settings = await SettingsService.getSettings()
    const htmlContent = wrapEmailTemplate(`
      <h2 style="color: #06276C; margin-top: 0; font-size: 20px; font-weight: bold; border-bottom: 2px solid #D4AF37; padding-bottom: 8px;">New Tool Lead Captured</h2>
      <p>A new lead has been captured from the migration tools section. Here are the client's details:</p>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-size: 14px; width: 120px;"><strong>Tool Used:</strong></td>
            <td style="padding: 10px 0; color: #06276C; font-size: 14px; font-weight: 600;">${escapeHtml(toolName)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-size: 14px;"><strong>Client Name:</strong></td>
            <td style="padding: 10px 0; color: #06276C; font-size: 14px; font-weight: 600;">${escapeHtml(name)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-size: 14px;"><strong>Email:</strong></td>
            <td style="padding: 10px 0; color: #06276C; font-size: 14px; font-weight: 600;"><a href="mailto:${encodeURIComponent(email)}" style="color: #06276C; text-decoration: none;">${escapeHtml(email)}</a></td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-size: 14px;"><strong>Phone:</strong></td>
            <td style="padding: 10px 0; color: #06276C; font-size: 14px; font-weight: 600;"><a href="tel:${encodeURIComponent(phone || '')}" style="color: #06276C; text-decoration: none;">${escapeHtml(phone || 'N/A')}</a></td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #64748b; font-size: 14px; vertical-align: top;"><strong>Results Summary:</strong></td>
            <td style="padding: 10px 0; color: #1e293b; font-size: 14px; vertical-align: top;"><div>${resultsSummary}</div></td>
          </tr>
        </table>
      </div>
    `, settings);

    await resend.emails.send({
      from: `System Notification <${fromEmail}>`,
      to: adminRecipients,
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
    const settings = await SettingsService.getSettings()
    const htmlContent = wrapEmailTemplate(`
      <h2 style="color: #06276C; margin-top: 0; font-size: 20px; font-weight: bold; border-bottom: 2px solid #D4AF37; padding-bottom: 8px;">Your Tool Results Are Ready</h2>
      <p>Hi <strong>${escapeHtml(name)}</strong>,</p>
      <p>Thank you for using our <strong>${escapeHtml(toolName)}</strong> at ${settings.business_name}.</p>

      <p>We have successfully received your assessment details. Below are the contact details you submitted for confirmation:</p>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 14px; width: 100px;"><strong>Email:</strong></td>
            <td style="padding: 6px 0; color: #06276C; font-size: 14px; font-weight: 600;">${escapeHtml(email)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 14px;"><strong>Phone:</strong></td>
            <td style="padding: 6px 0; color: #06276C; font-size: 14px; font-weight: 600;">${escapeHtml(phone || 'N/A')}</td>
          </tr>
        </table>
      </div>

      <p>Please note that the tool provides an initial estimate based on current migration guidelines. For a comprehensive legal assessment of your specific eligibility, visa pathways, and options, we highly recommend booking a formal consultation with one of our registered MARA agents.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${settings.website_url.replace(/\/$/, '')}/book-a-consultation/" style="background-color: #e40229; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 15px; box-shadow: 0 4px 6px rgba(228, 2, 41, 0.15);">Book a Consultation</a>
      </div>

      <p>Thank you,<br/><strong>${settings.business_name} Team</strong></p>
    `, settings);

    await resend.emails.send({
      from: `${settings.business_name} <${fromEmail}>`,
      to: email,
      subject: `Your ${toolName} Results - ${settings.business_name}`,
      html: htmlContent
    });
  } catch (error) {
    console.error('Failed to send tool client email:', error)
  }
}
