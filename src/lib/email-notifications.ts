/* eslint-disable @typescript-eslint/no-explicit-any */
// Install Resend: npm install resend
import { Resend } from 'resend';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

interface MeetingDetails {
  expertName: string;
  expertEmail: string;
  applicantName: string;
  applicantEmail: string;
  meetingDate: string;
  startTime: string;
  endTime: string;
  googleMeetLink: string;
  title: string;
  description: string;
}

// Function to send meeting confirmation emails
async function sendMeetingInvitations(meetingDetails: MeetingDetails): Promise<void> {
  try {
    // Format date and time for display
    const formattedDate = new Date(meetingDetails.meetingDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const formattedTime = `${meetingDetails.startTime.substring(0, 5)} - ${meetingDetails.endTime.substring(0, 5)} UTC`;

    // Email template for expert
    const expertEmailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New CV Review Meeting</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">New CV Review Meeting Scheduled</h2>
          <p>Dear ${meetingDetails.expertName},</p>
          
          <p>You have a new CV review meeting scheduled:</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <h3 style="margin-top: 0; color: #1e40af;">${meetingDetails.title}</h3>
            <p><strong>📅 Date:</strong> ${formattedDate}</p>
            <p><strong>⏰ Time:</strong> ${formattedTime}</p>
            <p><strong>👤 Applicant:</strong> ${meetingDetails.applicantName} (${meetingDetails.applicantEmail})</p>
            <p><strong>📋 Description:</strong> ${meetingDetails.description}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${meetingDetails.googleMeetLink}" style="background-color: #4285f4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">🎥 Join Meeting</a>
          </div>
          
          <p>Please be prepared to review the applicant's CV and provide constructive feedback.</p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            Best regards,<br>
            CV Review Platform Team
          </p>
        </div>
      </body>
      </html>
    `;

    // Email template for applicant
    const applicantEmailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>CV Review Meeting Confirmed</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #059669;">CV Review Meeting Confirmed</h2>
          <p>Dear ${meetingDetails.applicantName},</p>
          
          <p>Your CV review meeting has been successfully scheduled:</p>
          
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
            <h3 style="margin-top: 0; color: #047857;">${meetingDetails.title}</h3>
            <p><strong>📅 Date:</strong> ${formattedDate}</p>
            <p><strong>⏰ Time:</strong> ${formattedTime}</p>
            <p><strong>👨‍💼 Expert:</strong> ${meetingDetails.expertName} (${meetingDetails.expertEmail})</p>
            <p><strong>📋 Description:</strong> ${meetingDetails.description}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${meetingDetails.googleMeetLink}" style="background-color: #4285f4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">🎥 Join Meeting</a>
          </div>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #92400e;">📝 Preparation Tips:</h4>
            <ul style="color: #92400e;">
              <li>Have your CV ready to share</li>
              <li>Prepare specific questions about your industry</li>
              <li>Think about your career goals</li>
              <li>Test your camera and microphone beforehand</li>
            </ul>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            Best regards,<br>
            CV Review Platform Team
          </p>
        </div>
      </body>
      </html>
    `;

    console.log('Sending meeting invitation emails...');
    
    // Send to expert (don't throw error if it fails)
    try {
      const expertResult = await sendEmail({
        to: meetingDetails.expertEmail,
        subject: `New CV Review Meeting - ${formattedDate}`,
        html: expertEmailContent
      });
      
      if (expertResult.success) {
        console.log('Expert email sent successfully');
      } else if (expertResult.restricted) {
        console.log('Expert email restricted by Resend testing limits');
      } else {
        console.log('Expert email failed:', expertResult.error);
      }
    } catch (error) {
      console.error('Failed to send email to expert:', error);
    }
    
    // Send to applicant (don't throw error if it fails)
    try {
      const applicantResult = await sendEmail({
        to: meetingDetails.applicantEmail,
        subject: `CV Review Meeting Confirmed - ${formattedDate}`,
        html: applicantEmailContent
      });
      
      if (applicantResult.success) {
        console.log('Applicant email sent successfully');
      } else if (applicantResult.restricted) {
        console.log('Applicant email restricted by Resend testing limits');
      } else {
        console.log('Applicant email failed:', applicantResult.error);
      }
    } catch (error) {
      console.error('Failed to send email to applicant:', error);
    }
    
    console.log('Meeting invitation process completed');
    
  } catch (error) {
    console.error('Failed to send meeting invitation emails:', error);
    // Don't throw error - meeting should still be created even if emails fail
  }
}

// Email function using Resend with development restrictions handling
async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  try {
    console.log(`Attempting to send email to: ${to}`);
    console.log(`Subject: ${subject}`);
    
    if (!process.env.RESEND_API_KEY) {
      console.log('RESEND_API_KEY not found, simulating email send');
      return { success: true, simulated: true };
    }
    
    // Check if we're in development and trying to send to a non-verified email
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const verifiedEmail = process.env.RESEND_VERIFIED_EMAIL || 'uromandrew@gmail.com'; // Your verified email
    
    // In development, if trying to send to non-verified email, log instead of sending
    if (isDevelopment && to !== verifiedEmail) {
      console.log(`📧 [DEV MODE] Would send email to: ${to}`);
      console.log(`📧 [DEV MODE] Subject: ${subject}`);
      console.log(`📧 [DEV MODE] Due to Resend restrictions, actual email sent to verified address: ${verifiedEmail}`);
      
      // Send to verified email with modified subject indicating the original recipient
      const devSubject = `[FOR: ${to}] ${subject}`;
      const devHtml = `
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
          <h4 style="margin: 0; color: #92400e;">🚧 Development Mode</h4>
          <p style="margin: 5px 0; color: #92400e;">This email was originally intended for: <strong>${to}</strong></p>
          <p style="margin: 5px 0; color: #92400e;">In production, it will be sent to the actual recipient.</p>
        </div>
        ${html}
      `;
      
      const { data, error } = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: [verifiedEmail],
        subject: devSubject,
        html: devHtml,
      });

      if (error) {
        console.error('Resend email error (dev mode):', error);
        // Don't throw error in dev mode, just log it
        return { success: false, error: error.message, devMode: true };
      }

      console.log('Email sent successfully via Resend (dev mode):', data?.id);
      return { ...data, devMode: true };
    }
    
    // Production mode or sending to verified email
    const fromEmail = isDevelopment 
      ? 'onboarding@resend.dev'
      : (process.env.RESEND_FROM_EMAIL || 'noreply@resumexpert.info');
    
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error('Resend email error:', error);
      
      // Special handling for testing restriction error
      if (error.message?.includes('You can only send testing emails to your own email address')) {
        console.log('📧 Resend testing restriction detected - email not sent but meeting will continue');
        return { success: false, error: 'Testing restriction', restricted: true };
      }
      
      // Don't throw error - just return failure info
      return { success: false, error: error.message };
    }

    console.log('Email sent successfully via Resend:', data?.id);
    return { ...data, success: true };
    
  } catch (error: any) {
    console.error('Error sending email:', error);
    // Don't throw error - return failure info instead
    return { success: false, error: error.message };
  }
}

// Function to send meeting cancellation emails
async function sendCancellationEmails(meetingDetails: Partial<MeetingDetails>, cancelledBy: string, reason?: string): Promise<void> {
  try {
    console.log('Sending meeting cancellation emails...');
    
    const formattedDate = meetingDetails.meetingDate ? 
      new Date(meetingDetails.meetingDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : 'TBD';
    
    const cancellationMessage = reason ? 
      `<strong>Reason:</strong> ${reason}` : 
      '<strong>Reason:</strong> No specific reason provided.';
    
    const emailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Meeting Cancelled</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #dc2626;">❌ Meeting Cancelled</h2>
          <p>The following meeting has been cancelled by ${cancelledBy}:</p>
          
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h3 style="margin-top: 0; color: #b91c1c;">${meetingDetails.title || 'CV Review Meeting'}</h3>
            <p><strong>📅 Date:</strong> ${formattedDate}</p>
            <p><strong>⏰ Time:</strong> ${meetingDetails.startTime?.substring(0, 5)} - ${meetingDetails.endTime?.substring(0, 5)} UTC</p>
            <p>${cancellationMessage}</p>
          </div>
          
          <div style="background-color: #f0f9ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #0369a1;">
              💡 You can book a new meeting at your convenience through the platform.
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            Best regards,<br>
            CV Review Platform Team
          </p>
        </div>
      </body>
      </html>
    `;
    
    // Send to both parties (don't fail if emails don't work)
    if (meetingDetails.expertEmail) {
      try {
        await sendEmail({
          to: meetingDetails.expertEmail,
          subject: `Meeting Cancelled - ${formattedDate}`,
          html: emailContent
        });
      } catch (error) {
        console.error('Failed to send cancellation email to expert:', error);
      }
    }
    
    if (meetingDetails.applicantEmail) {
      try {
        await sendEmail({
          to: meetingDetails.applicantEmail,
          subject: `Meeting Cancelled - ${formattedDate}`,
          html: emailContent
        });
      } catch (error) {
        console.error('Failed to send cancellation email to applicant:', error);
      }
    }
    
    console.log('Cancellation email process completed');
    
  } catch (error) {
    console.error('Failed to send cancellation emails:', error);
  }
}

export {
  sendMeetingInvitations,
  sendCancellationEmails,
  sendEmail,
  type MeetingDetails
}