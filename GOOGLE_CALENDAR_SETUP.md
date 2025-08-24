# Google Calendar Integration Setup Guide

## Overview
Your Firebase Functions now automatically create Google Calendar events when users book appointments. Here's how to set it up:

## 🔧 Setup Steps

### 1. Create Google Cloud Project & Enable Calendar API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select your existing Firebase project
3. Enable the **Google Calendar API**:
   - Go to APIs & Services > Library
   - Search for "Google Calendar API"
   - Click "Enable"

### 2. Create Service Account

1. Go to APIs & Services > Credentials
2. Click "Create Credentials" > "Service Account"
3. Fill in details:
   - **Name**: `calendar-service`
   - **Description**: `Service account for calendar integration`
4. Click "Create and Continue"
5. Skip role assignment (click "Continue")
6. Click "Done"

### 3. Generate Service Account Key

1. Click on your newly created service account
2. Go to "Keys" tab
3. Click "Add Key" > "Create New Key"
4. Select "JSON" format
5. Download the JSON file - **KEEP THIS SECURE!**

### 4. Share Calendar with Service Account

1. Open [Google Calendar](https://calendar.google.com/)
2. Find the calendar you want to use for appointments
3. Click the three dots next to calendar name > "Settings and sharing"
4. Under "Share with specific people":
   - Add the service account email (from the JSON file)
   - Set permission to "Make changes to events"
5. Copy the **Calendar ID** (found in calendar settings)

### 5. Update Firebase Functions Configuration

Open `/functions/index.js` and replace these placeholders:

```javascript
// Replace this entire object with your service account JSON content
const GOOGLE_CALENDAR_CREDENTIALS = {
  type: "service_account",
  project_id: "your-actual-project-id",
  private_key_id: "your-actual-private-key-id", 
  private_key: "-----BEGIN PRIVATE KEY-----\nYOUR_ACTUAL_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n",
  client_email: "calendar-service@your-project-id.iam.gserviceaccount.com",
  client_id: "your-actual-client-id",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/calendar-service%40your-project-id.iam.gserviceaccount.com"
};

// Replace with your admin's calendar ID
const ADMIN_CALENDAR_ID = 'your-admin-email@gmail.com'; // or calendar-specific ID
```

## 🎯 What This Does

### When a User Books an Appointment:
- ✅ Creates a Google Calendar event in admin's calendar
- ✅ Sets 2-hour duration (configurable)
- ✅ Includes all appointment details (client, service, location, price)
- ✅ Adds client as attendee
- ✅ Sets reminders (24hr email, 2hr popup, 30min popup)
- ✅ Stores calendar event ID in Firebase

### When Appointment Status Changes:
- ✅ **Approved/Confirmed**: Updates event title to show status
- ✅ **Cancelled/Rejected**: Deletes the calendar event
- ✅ Keeps calendar in sync with app status

## 🔒 Security Best Practices

1. **Never commit credentials to git**
2. Consider using Firebase Functions config for credentials:
   ```bash
   firebase functions:config:set google.calendar='{"private_key":"...","client_email":"..."}'
   ```
3. Restrict service account permissions to only Calendar API
4. Use a dedicated calendar for business appointments

## 🧪 Testing

1. Deploy your functions: `firebase deploy --only functions`
2. Book a test appointment through your app
3. Check your admin calendar for the new event
4. Test status changes (approve/reject) to see calendar updates

## 🎨 Customization Options

### Adjust Event Duration
In `createCalendarEvent()` function, change this line:
```javascript
// Current: 2-hour duration
const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000);

// For 1.5 hours:
const endDateTime = new Date(startDateTime.getTime() + 1.5 * 60 * 60 * 1000);
```

### Modify Event Details
Edit the `event` object in `createCalendarEvent()` to customize:
- Event title format
- Description content
- Reminder timing
- Color coding

### Add More Attendees
Add team members to events:
```javascript
attendees: [
  { email: appointment.userEmail, displayName: appointment.userName },
  { email: 'team@povedaautocare.com', displayName: 'Poveda Team' }
],
```

## 📱 Mobile Integration
Calendar events will appear in:
- Google Calendar app
- iOS Calendar (if admin uses Google Calendar)
- Any calendar app synced with Google Calendar

## 🚀 Ready to Deploy!
Once configured, your admin will automatically get calendar events for every appointment booking!
