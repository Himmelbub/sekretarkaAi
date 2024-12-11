import * as fs from 'fs/promises';
import { google } from 'googleapis';
import { authenticate } from '@google-cloud/local-auth';
import * as path from 'node:path';
import { getEventSummaries } from './utils';

type OAuth2Client = typeof google.prototype.auth.OAuth2.prototype;
type Credentials = typeof google.auth.OAuth2.prototype.credentials;

// If modifying these scopes, delete token.json.
// const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content.toString());
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file compatible with GoogleAuth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client: {
  credentials: { refresh_token: any };
}) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content.toString());
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  try {
    let client: OAuth2Client = await loadSavedCredentialsIfExist();
    if (client) {
      return client;
    }
    client = await authenticate({
      scopes: SCOPES,
      keyfilePath: CREDENTIALS_PATH,
    });
    if (client.credentials) {
      await saveCredentials(client);
    }
    return client;
  } catch (error) {
    console.error('Failed to authorize:', error);
    throw error;
  }
}

/**
 * Lists the next 10 events on the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 * @param maxResults
 */
async function listEvents(auth: any, maxResults: number) {
  const calendar = google.calendar({ version: 'v3', auth });
  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: 'startTime',
  });
  const events = res.data.items;
  if (!events || events.length === 0) {
    console.log('No upcoming events found.');
    return;
  }
  console.log('Upcoming ' + maxResults + ' events:');
  return events;
  // events.map((event: { start: { dateTime: any; date: any; }; summary: any; }) => {
  //   const start = event.start.dateTime || event.start.date;
  //   console.log(`${start} - ${event.summary}`);
  // });
}

/**
 * Lists all calendars on the user's calendar list.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function listAllCalendars(auth: any) {
  const calendar = google.calendar({ version: 'v3', auth });
  const res = await calendar.calendarList.list();
  const calendars = res.data.items;
  if (!calendars || calendars.length === 0) {
    console.log('No calendars found.');
    return;
  }
  console.log('All calendars:');
  return calendars;
}

/**
 * Adds an event to the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 * @param {any} event The event to add.
 */
async function addEvent(auth: any, event: any) {
  const calendar = google.calendar({ version: 'v3', auth });
  const res = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: event,
  });
  return res.data.htmlLink;
}

export function createEvent(event: any) {
  return authorize()
    .then((auth) => addEvent(auth, event))
    .catch(console.error);
}

export function getAllCalendars() {
  return authorize()
    .then((auth) => listAllCalendars(auth))
    .catch(console.error);
}

export async function getEvents(maxResults = 5) {
  try {
    const auth = await authorize();
    return await listEvents(auth, maxResults);
  } catch (error) {
    console.error('Failed to get events:', error);
    throw error;
  }
}

export async function fetchEvents() {
  try {
    const events = await getEvents(20);
    if (!events) {
      throw new Error('Niestety nie udało mi się pobrać danych z kalendarza');
    }
    return JSON.stringify(getEventSummaries(events));
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error('Unexpected error', error);
    }
    process.exit(1);
  }
}
