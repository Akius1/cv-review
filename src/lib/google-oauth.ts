/* eslint-disable @typescript-eslint/no-explicit-any */
// OAuth2 Google Calendar implementation for personal Google accounts
import { google } from 'googleapis';

// Step 1: Set up OAuth2 credentials in Google Cloud Console
// 1. Go to Google Cloud Console > APIs & Services > Credentials
// 2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
// 3. Application type: "Web application"
// 4. Add authorized redirect URIs: http://localhost:3000/api/auth/google/callback
// 5. Copy Client ID and Client Secret

// OAuth2 client setup
const getOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    process.env.GOOGLE_OAUTH_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
  );
};

// Generate OAuth2 authorization URL
function getGoogleAuthUrl(): string {
  const oauth2Client = getOAuth2Client();
  
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Get refresh token
    scope: scopes,
    prompt: 'consent' // Force consent screen to get refresh token
  });

  return authUrl;
}

// Exchange authorization code for tokens
async function getTokensFromCode(authCode: string): Promise<any> {
  const oauth2Client = getOAuth2Client();
  
  try {
    const { tokens } = await oauth2Client.getToken(authCode);
    return tokens;
  } catch (error) {
    console.error('Error getting tokens:', error);
    throw new Error('Failed to exchange authorization code for tokens');
  }
}

// Create Google Calendar service with user tokens
const getGoogleCalendarServiceWithTokens = (accessToken: string, refreshToken?: string) => {
  const oauth2Client = getOAuth2Client();
  
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
};

// Main function to create calendar event with real Google Meet link
async function createGoogleMeetEvent(
  accessToken: string,
  refreshToken: string,
  expertEmail: string,
  applicantEmail: string,
  expertName: string,
  applicantName: string,
  meetingDate: string,
  startTime: string,
  endTime: string,
  title: string,
  description: string
): Promise<{ googleMeetLink: string; eventId: string }> {
  try {
    const calendar = getGoogleCalendarServiceWithTokens(accessToken, refreshToken);

    const cleanStartTime = startTime.substring(0, 5);
    const cleanEndTime = endTime.substring(0, 5);
    
    const startDateTime = `${meetingDate}T${cleanStartTime}:00`;
    const endDateTime = `${meetingDate}T${cleanEndTime}:00`;

    const event = {
      summary: title,
      description: `${description}\n\nExpert: ${expertName} (${expertEmail})\nApplicant: ${applicantName} (${applicantEmail})`,
      start: {
        dateTime: startDateTime,
        timeZone: 'UTC',
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'UTC',
      },
      attendees: [
        { email: expertEmail, displayName: expertName },
        { email: applicantEmail, displayName: applicantName }
      ],
      conferenceData: {
        createRequest: {
          requestId: `oauth-meet-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 },
        ],
      }
    };

    console.log('Creating Google Calendar event with OAuth2 authentication...');

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      conferenceDataVersion: 1,
      sendUpdates: 'all'
    });

    const createdEvent = response.data;
    const googleMeetLink = createdEvent.conferenceData?.entryPoints?.find(
      (entry: any) => entry.entryPointType === 'video'
    )?.uri;

    if (!googleMeetLink) {
      throw new Error('Failed to generate Google Meet link');
    }

    console.log('Real Google Meet event created successfully:', {
      eventId: createdEvent.id,
      meetLink: googleMeetLink
    });

    return {
      googleMeetLink,
      eventId: createdEvent.id!
    };

  } catch (error: any) {
    console.error('Error creating OAuth2 Google Meet event:', error);
    throw new Error(`Failed to create Google Meet event: ${error.message}`);
  }
}

export {
  getGoogleAuthUrl,
  getTokensFromCode,
  createGoogleMeetEvent
};