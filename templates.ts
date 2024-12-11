import { CalendarEvent } from './types';

export const event: CalendarEvent = {
  summary: 'Wizyta: ',
  location: 'Lublin, Poland',
  start: {
    dateTime: '2024-05-07T17:00:00+02:00',
    timeZone: 'Europe/Warsaw',
  },
  end: {
    dateTime: '2024-05-07T18:30:00+02:00',
    timeZone: 'Europe/Warsaw',
  },
  recurrence: ['RRULE:FREQ=DAILY;COUNT=2'],
  attendees: [
    { email: 'yourEmail@gmail.com' },
    { email: 'sample-email@wp.pl' },
  ],
  reminders: {
    useDefault: false,
    overrides: [
      { method: 'email', minutes: 24 * 60 },
      { method: 'popup', minutes: 10 },
    ],
  },
};

export const eventTemplate: CalendarEvent = {
  summary: 'Spoktanie: ',
  location: 'Lublin, Poland',
  start: {
    dateTime: '',
    timeZone: 'Europe/Warsaw',
  },
  end: {
    dateTime: '',
    timeZone: 'Europe/Warsaw',
  },
  attendees: [{ email: 'yourEmail@gmail.com' }],
  reminders: {
    useDefault: true,
  },
};
