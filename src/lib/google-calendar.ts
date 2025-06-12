/* eslint-disable @typescript-eslint/no-explicit-any */
// First, install the required packages:
// npm install googleapis

import { google } from 'googleapis'

// Google Calendar service setup
const getGoogleCalendarService = () => {
  try {
    // Check if credentials exist
    const credentialsString = process.env.GOOGLE_CALENDAR_CREDENTIALS
    
    if (!credentialsString) {
      console.error('GOOGLE_CALENDAR_CREDENTIALS environment variable not found')
      throw new Error('Google Calendar credentials not configured')
    }
    
    // Parse the JSON credentials from environment variable
    const credentials = JSON.parse(credentialsString)
    
    // Validate required fields
    if (!credentials.client_email || !credentials.private_key) {
      throw new Error('Invalid Google Calendar credentials: missing required fields')
    }
    
    console.log('Google Calendar credentials loaded for:', credentials.client_email)
    
    const auth = new google.auth.GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/calendar']
    })

    return google.calendar({ version: 'v3', auth })
  } catch (error: any) {
    console.error('Failed to initialize Google Calendar service:', error.message)
    throw new Error(`Google Calendar setup failed: ${error.message}`)
  }
}

// Enhanced function to create Google Calendar event (without Meet link creation)
async function createGoogleCalendarEvent(
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
    const calendar = getGoogleCalendarService()

    // Fix the datetime format - remove seconds if present and format correctly
    const cleanStartTime = startTime.substring(0, 5) // Get HH:MM only
    const cleanEndTime = endTime.substring(0, 5)     // Get HH:MM only
    
    // Create proper ISO datetime strings
    const startDateTime = `${meetingDate}T${cleanStartTime}:00`
    const endDateTime = `${meetingDate}T${cleanEndTime}:00`

    console.log('Creating calendar event with datetime:', {
      startDateTime,
      endDateTime,
      originalStartTime: startTime,
      originalEndTime: endTime
    })

    // Generate a properly formatted Google Meet link
    // Google Meet codes follow the pattern: xxx-yyyy-zzz (3-4-3 characters with hyphens)
    const generateMeetCode:any = () => {
      const chars = 'abcdefghijklmnopqrstuvwxyz';
      const part1 = Array.from({length: 3}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      const part2 = Array.from({length: 4}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      const part3 = Array.from({length: 3}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      return `${part1}-${part2}-${part3}`;
    };
    
    const meetingCode = generateMeetCode();
    const googleMeetLink = `https://meet.google.com/${meetingCode}`;

    const event = {
      summary: title,
      description: `${description}\n\nExpert: ${expertName} (${expertEmail})\nApplicant: ${applicantName} (${applicantEmail})\n\nGoogle Meet Link: ${googleMeetLink}\n\nThis meeting was created automatically. Please use the Google Meet link above to join.`,
      start: {
        dateTime: startDateTime,
        timeZone: 'UTC',
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'UTC',
      },
      location: googleMeetLink
    }

    console.log('Creating Google Calendar event:', {
      summary: event.summary,
      start: event.start,
      end: event.end,
      location: event.location
    })

    const response = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      requestBody: event,
      sendUpdates: 'none' // Don't send invitations (service account limitation)
    })

    const createdEvent = response.data

    console.log('Google Calendar event created successfully:', {
      eventId: createdEvent.id,
      meetLink: googleMeetLink,
      htmlLink: createdEvent.htmlLink
    })

    return {
      googleMeetLink,
      eventId: createdEvent.id!
    }

  } catch (error: any) {
    console.error('Error creating Google Calendar event:', error)
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      code: error.code,
      errors: error.errors
    })
    
    if (error.code === 403) {
      throw new Error('Google Calendar API access forbidden. Check service account permissions and calendar sharing.')
    } else if (error.code === 401) {
      throw new Error('Google Calendar API authentication failed. Check credentials.')
    } else if (error.code === 400) {
      throw new Error(`Google Calendar API bad request: ${error.message}. Check datetime format and calendar permissions.`)
    } else {
      throw new Error(`Failed to create calendar event: ${error.message}`)
    }
  }
}

// Function to delete/cancel Google Calendar event
async function cancelGoogleCalendarEvent(eventId: string): Promise<void> {
  try {
    const calendar = getGoogleCalendarService()
    
    await calendar.events.delete({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      eventId: eventId,
      sendUpdates: 'all' // Notify all attendees
    })

    console.log('Google Calendar event cancelled:', eventId)
  } catch (error: any) {
    console.error('Error cancelling Google Calendar event:', error)
    // Don't throw error here - we still want to cancel the booking in our DB
  }
}

export {
  createGoogleCalendarEvent,
  cancelGoogleCalendarEvent
}