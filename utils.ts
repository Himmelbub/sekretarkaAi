import { EventSummary } from './types';
import { calendar_v3 } from 'googleapis';

export function getEventSummaries(
  events: calendar_v3.Schema$Event[],
): EventSummary[] {
  return events.map((event) => ({
    startDateTime: event.start?.dateTime || new Date().toISOString(),
    endDateTime: event.end?.dateTime || new Date().toISOString(),
    summary: event.summary || 'No summary provided',
  }));
}

export function extractJSON(input: string): { text: string; data: any } {
  if (input.includes('{') && input.includes('}')) {
    let startIndex = input.indexOf('{');
    let endIndex = input.lastIndexOf('}') + 1; // +1 to include the } in the substring

    let jsonString = input.substring(startIndex, endIndex);
    let jsonObject = JSON.parse(jsonString);

    let text = input.replace(jsonString, '').trim();

    return { text: text, data: jsonObject };
  } else {
    return { text: input, data: {} };
  }
}

export function getFormattedDate() {
  const days = [
    'Niedziela',
    'Poniedziałek',
    'Wtorek',
    'Środa',
    'Czwartek',
    'Piątek',
    'Sobota',
  ];
  const months = [
    'Stycznia',
    'Lutego',
    'Marca',
    'Kwietnia',
    'Maja',
    'Czerwca',
    'Lipca',
    'Sierpnia',
    'Września',
    'Października',
    'Listopada',
    'Grudnia',
  ];

  const today = new Date();
  const dayName = days[today.getDay()];
  const day = today.getDate();
  const monthName = months[today.getMonth()];
  const year = today.getFullYear();

  return `"${dayName}, ${day} ${monthName} ${year}"`;
}

export function formatEvents(events: calendar_v3.Schema$Event[]): string {
  return events
    .map((event) => {
      const startDateTime = new Date(
        event.start?.dateTime || '',
      ).toLocaleString('pl-PL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      const endDateTime = new Date(event.end?.dateTime || '').toLocaleString(
        'pl-PL',
        {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        },
      );
      const summary = event.summary || 'No summary provided';
      return `Event: ${summary}, Start: ${startDateTime}, End: ${endDateTime}`;
    })
    .join('\n');
}
