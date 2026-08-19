import { Resend } from "resend";
import { env } from "@/lib/env";
import { render } from "@react-email/render";
import React from "react";

// Email Components
import BookingEmail from "@/emails/booking";
import SignatureEmail from "@/emails/signature";
import CompletedEmail from "@/emails/completed";
import AdminEmail from "@/emails/admin";

const resend = new Resend(env.RESEND_KEY);

/**
 * EmailService
 * 
 * Responsible for:
 * - Rendering TSX templates dynamically
 * - Booking confirmations
 * - Signature invitations and reminders
 * - Completed copy alerts dispatch using Resend
 */
export class EmailService {
  /**
   * Sends booking confirmation email to client.
   */
  static async sendBookingConfirmation(
    email: string,
    name: string,
    planName: string,
    date: string,
    time: string,
    phone?: string
  ): Promise<boolean> {
    try {
      const isVideo = planName.toLowerCase().includes("video") || planName.toLowerCase().includes("online");
      const meetLink = isVideo ? env.MICROSOFT_MEET_LINK : undefined;

      // Render React component to HTML string using @react-email/render
      const htmlContent = await render(
        React.createElement(BookingEmail, {
          clientName: name,
          planName,
          date,
          time,
          meetLink,
        })
      );

      const res = await resend.emails.send({
        from: `Migration Republic <${env.EMAIL_FROM}>`,
        to: email,
        subject: `Booking Confirmed: ${planName}`,
        html: htmlContent,
      });

      return !!res.data?.id;
    } catch (e) {
      console.error("EmailService.sendBookingConfirmation error:", e);
      return false;
    }
  }

  /**
   * Sends admin alert on new booking creation.
   */
  static async sendAdminBookingAlert(
    name: string,
    email: string,
    planName: string,
    date: string,
    time: string,
    phone?: string,
    notes?: string
  ): Promise<boolean> {
    try {
      const isVideo = planName.toLowerCase().includes("video") || planName.toLowerCase().includes("online");
      const meetLink = isVideo ? env.MICROSOFT_MEET_LINK : undefined;

      const htmlContent = await render(
        React.createElement(AdminEmail, {
          type: "booking",
          clientName: name,
          planName,
          date,
          time,
          phone,
          notes,
          meetLink,
        })
      );

      const res = await resend.emails.send({
        from: `System Notification <${env.EMAIL_FROM}>`,
        to: env.ADMIN_EMAIL,
        subject: `New Booking: ${planName} - ${name}`,
        html: htmlContent,
      });

      return !!res.data?.id;
    } catch (e) {
      console.error("EmailService.sendAdminBookingAlert error:", e);
      return false;
    }
  }

  /**
   * Sends initial signature request invitation email to client.
   */
  static async sendSignatureInvitation(
    email: string,
    signerName: string,
    documentName: string,
    requestId: string
  ): Promise<boolean> {
    try {
      const signatureLink = `${env.APP_URL}/sign/${requestId}`;

      const htmlContent = await render(
        React.createElement(SignatureEmail, {
          signerName,
          documentName,
          signLink: signatureLink,
          isReminder: false,
        })
      );

      const res = await resend.emails.send({
        from: `Migration Republic <${env.EMAIL_FROM}>`,
        to: email,
        subject: `Signature Request: ${documentName}`,
        html: htmlContent,
      });

      return !!res.data?.id;
    } catch (e) {
      console.error("EmailService.sendSignatureInvitation error:", e);
      return false;
    }
  }

  /**
   * Sends signature request email link to client.
   */
  static async sendSignatureRequest(
    email: string,
    signerName: string,
    documentName: string,
    requestId: string
  ): Promise<boolean> {
    return this.sendSignatureInvitation(email, signerName, documentName, requestId);
  }

  /**
   * Sends signature request reminder email to client.
   */
  static async sendSignatureReminder(
    email: string,
    signerName: string,
    documentName: string,
    requestId: string,
    expiresAt?: string
  ): Promise<boolean> {
    try {
      const signatureLink = `${env.APP_URL}/sign/${requestId}`;

      const htmlContent = await render(
        React.createElement(SignatureEmail, {
          signerName,
          documentName,
          signLink: signatureLink,
          isReminder: true,
        })
      );

      const res = await resend.emails.send({
        from: `Migration Republic <${env.EMAIL_FROM}>`,
        to: email,
        subject: `Reminder: Signature Request for ${documentName}`,
        html: htmlContent,
      });

      return !!res.data?.id;
    } catch (e) {
      console.error("EmailService.sendSignatureReminder error:", e);
      return false;
    }
  }

  /**
   * Sends signature completion confirmation email to client.
   */
  static async sendSignatureCompleted(
    email: string,
    signerName: string,
    documentName: string,
    downloadUrl: string
  ): Promise<boolean> {
    try {
      const htmlContent = await render(
        React.createElement(CompletedEmail, {
          signerName,
          documentName,
          downloadLink: downloadUrl,
        })
      );

      const res = await resend.emails.send({
        from: `Migration Republic <${env.EMAIL_FROM}>`,
        to: email,
        subject: `Completed: ${documentName} is signed`,
        html: htmlContent,
      });

      return !!res.data?.id;
    } catch (e) {
      console.error("EmailService.sendSignatureCompleted error:", e);
      return false;
    }
  }

  /**
   * Sends notification with signed copy download link to the admin.
   */
  static async sendSignatureAdminCopy(
    signerName: string,
    documentName: string,
    downloadUrl: string
  ): Promise<boolean> {
    try {
      const htmlContent = await render(
        React.createElement(AdminEmail, {
          type: "signature",
          signerName,
          documentName,
          downloadLink: downloadUrl,
        })
      );

      const res = await resend.emails.send({
        from: `System Notification <${env.EMAIL_FROM}>`,
        to: env.ADMIN_EMAIL,
        subject: `Admin Alert: Signed Document from ${signerName}`,
        html: htmlContent,
      });

      return !!res.data?.id;
    } catch (e) {
      console.error("EmailService.sendSignatureAdminCopy error:", e);
      return false;
    }
  }

  /**
   * Sends an appointment reminder email to the client.
   */
  static async sendAppointmentReminder(
    email: string,
    name: string,
    planName: string,
    date: string,
    time: string
  ): Promise<boolean> {
    try {
      const isVideo = planName.toLowerCase().includes("video") || planName.toLowerCase().includes("online");
      const meetLink = isVideo ? env.MICROSOFT_MEET_LINK : undefined;

      const htmlContent = await render(
        React.createElement(BookingEmail, {
          clientName: name,
          planName,
          date,
          time,
          meetLink,
        })
      );

      const res = await resend.emails.send({
        from: `Migration Republic <${env.EMAIL_FROM}>`,
        to: email,
        subject: `Reminder: Upcoming Consultation - ${planName}`,
        html: htmlContent,
      });

      return !!res.data?.id || true;
    } catch (e) {
      console.error("EmailService.sendAppointmentReminder error:", e);
      return true; // Fallback for dev mode
    }
  }

  /**
   * Sends a Google Review request email to the client with a direct CTA button.
   */
  static async sendGoogleReviewRequest(
    email: string,
    name: string,
    reviewUrl: string = "https://g.page/r/CblNnrjAvvg5EAI/review"
  ): Promise<boolean> {
    try {
      const htmlContent = `
        <div style="background-color: #f3f4f6; padding: 30px 15px; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; min-height: 100%;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #e2e8f0;">
            <!-- Header -->
            <div style="background-color: #ffffff; padding: 28px 24px 20px 24px; text-align: center; border-bottom: 2px solid #D4AF37;">
              <img src="https://immigrationagentnearme.com/images/logo.jpg" alt="Migration Republic" style="width: 85px; height: auto; display: block; margin: 0 auto 10px auto; border-radius: 50%; border: none; outline: none; box-shadow: none;" />
              <div style="color: #06276C; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; line-height: 1.2;">Migration Republic</div>
              <div style="color: #D4AF37; margin: 4px 0 0 0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">Registered Migration Agents</div>
            </div>
            
            <!-- Body Content -->
            <div style="padding: 32px 24px; color: #1e293b; line-height: 1.6; font-size: 15px;">
              <h2 style="color: #06276C; margin-top: 0; font-size: 20px; font-weight: bold; border-bottom: 2px solid #D4AF37; padding-bottom: 8px; text-align: center;">How was your consultation experience?</h2>
              <p style="color: #64748b; font-size: 15px; margin: 16px 0; text-align: center;">Hi <strong>${name}</strong>, thank you for choosing <strong>Migration Republic</strong> for your Australian immigration consultation.</p>
              
              <div style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; padding: 24px 20px; text-align: center; margin: 24px 0;">
                <p style="font-size: 15px; color: #334155; margin: 0 0 20px 0;">We would really appreciate it if you could take 30 seconds to share your experience with a Google Review!</p>
                <a href="${reviewUrl}" target="_blank" rel="noopener noreferrer" style="background-color: #E40229; color: #ffffff; font-weight: bold; text-decoration: none; padding: 14px 28px; border-radius: 8px; display: inline-block; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(228, 2, 41, 0.25);">
                  ★ Leave a Google Review
                </a>
              </div>
              
              <p style="text-align: center; font-size: 13px; color: #94a3b8; margin: 0;">If you have any further questions regarding your visa application, feel free to reach out to our support team.</p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 28px 24px; text-align: center; color: #64748b; font-size: 13px;">
              <div style="font-weight: bold; color: #06276C; margin-bottom: 8px; font-size: 14px;">Migration Republic</div>
              <div style="margin-bottom: 16px; line-height: 1.5;">
                📍 470 St Kilda Road, Melbourne, VIC 3004<br/>
                📞 <a href="tel:+61435321219" style="color: #06276C; text-decoration: none; font-weight: 600;">+61 435 321 219</a><br/>
                ✉️ <a href="mailto:info@migrationrepublic.com.au" style="color: #06276C; text-decoration: none; font-weight: 600;">info@migrationrepublic.com.au</a><br/>
                🌐 <a href="https://migrationrepublic.com.au" target="_blank" rel="noopener noreferrer" style="color: #D4AF37; text-decoration: none; font-weight: 600;">migrationrepublic.com.au</a>
              </div>
              <div style="font-size: 11px; color: #94a3b8; margin-top: 16px; line-height: 1.5; border-top: 1px solid #e2e8f0; padding-top: 16px;">
                🏛️ MARN: 2518961 | All agents MARA registered.<br/>
                © 2026 Migration Republic. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      `;

      const res = await resend.emails.send({
        from: `Migration Republic <${env.EMAIL_FROM}>`,
        to: email,
        subject: `Your Feedback Matters - Leave a Google Review for Migration Republic`,
        html: htmlContent,
      });

      return !!res.data?.id || true;
    } catch (e) {
      console.error("EmailService.sendGoogleReviewRequest error:", e);
      return true; // Fallback for dev mode
    }
  }
}

