// FILE: /lib/email.ts
// Email notification service
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function sendInterviewConfirmationEmails(
  expertName: string,
  expertEmail: string,
  applicantName: string,
  applicantEmail: string,
  startTime: Date,
  endTime: Date,
  googleMeetLink: string
) {
  // Format date and time for email
  const dateOptions: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  const timeOptions: Intl.DateTimeFormatOptions = { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: true 
  };
  
  const formattedDate = startTime.toLocaleDateString('en-US', dateOptions);
  const formattedStartTime = startTime.toLocaleTimeString('en-US', timeOptions);
  const formattedEndTime = endTime.toLocaleTimeString('en-US', timeOptions);
  
  // Email to expert
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: expertEmail,
    subject: `Interview Scheduled with ${applicantName}`,
    html: `
      <h1>Interview Confirmed</h1>
      <p>Dear ${expertName},</p>
      <p>An interview has been scheduled with applicant ${applicantName} on ${formattedDate} from ${formattedStartTime} to ${formattedEndTime}.</p>
      <p>Please join the interview using this Google Meet link: <a href="${googleMeetLink}">${googleMeetLink}</a></p>
      <p>Thank you for your participation.</p>
    `,
  });
  
  // Email to applicant
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: applicantEmail,
    subject: `Your Interview with ${expertName} is Confirmed`,
    html: `
      <h1>Interview Confirmed</h1>
      <p>Dear ${applicantName},</p>
      <p>Your interview has been scheduled with ${expertName} on ${formattedDate} from ${formattedStartTime} to ${formattedEndTime}.</p>
      <p>Please join the interview using this Google Meet link: <a href="${googleMeetLink}">${googleMeetLink}</a></p>
      <p>We wish you the best of luck with your interview!</p>
    `,
  });
}