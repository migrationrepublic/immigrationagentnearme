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
}
