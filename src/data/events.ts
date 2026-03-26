/**
 * Mock upcoming events.
 * TODO: Replace with real API call — Google Calendar, Outlook, or CalDAV.
 *       Suggested shape matches the Google Calendar Events resource:
 *       https://developers.google.com/calendar/api/v3/reference/events
 */

export interface CalendarEvent {
  id:          string
  title:       string
  date:        string   // ISO 'YYYY-MM-DD'
  startTime:   string   // display, e.g. '09:00 AM'
  endTime:     string   // display, e.g. '10:00 AM'
  color:       string   // hex — drives the left border
  source:      string   // calendar name shown in the UI
  sourceColor: string   // hex — drives the source label dot
  location?:  string
  isAllDay?:  boolean
}

// Relative to today (2026-03-25). Swap these for Date arithmetic if you
// move to a live feed.
const T  = '2026-03-25'   // today
const T1 = '2026-03-26'   // tomorrow
const T2 = '2026-03-27'
const T3 = '2026-03-28'
const T4 = '2026-03-31'   // next Monday

export const MOCK_EVENTS: CalendarEvent[] = [
  // ── Today ─────────────────────────────────────────────────────────────────
  {
    id:          'evt-1',
    title:       'Standup — Engineering',
    date:        T,
    startTime:   '09:30 AM',
    endTime:     '09:45 AM',
    color:       '#4285f4',
    source:      'Google Calendar',
    sourceColor: '#4285f4',
  },
  {
    id:          'evt-2',
    title:       'Product Review — Q2 Roadmap',
    date:        T,
    startTime:   '11:00 AM',
    endTime:     '12:00 PM',
    color:       '#c9a96e',
    source:      'Google Calendar',
    sourceColor: '#4285f4',
    location:    'Conf Room B',
  },
  {
    id:          'evt-3',
    title:       'Lunch with design team',
    date:        T,
    startTime:   '12:30 PM',
    endTime:     '01:30 PM',
    color:       '#4caf7d',
    source:      'Google Calendar',
    sourceColor: '#4285f4',
    location:    "Rosario's Kitchen",
  },
  {
    id:          'evt-4',
    title:       'Focus block — deep work',
    date:        T,
    startTime:   '02:00 PM',
    endTime:     '04:00 PM',
    color:       '#9b59b6',
    source:      'DayDo',
    sourceColor: '#c9a96e',
  },
  {
    id:          'evt-5',
    title:       '1:1 with Manager',
    date:        T,
    startTime:   '04:30 PM',
    endTime:     '05:00 PM',
    color:       '#e01e5a',
    source:      'Outlook',
    sourceColor: '#0078d4',
  },

  // ── Tomorrow ───────────────────────────────────────────────────────────────
  {
    id:          'evt-6',
    title:       'Sprint Planning',
    date:        T1,
    startTime:   '10:00 AM',
    endTime:     '11:30 AM',
    color:       '#4285f4',
    source:      'Google Calendar',
    sourceColor: '#4285f4',
  },
  {
    id:          'evt-7',
    title:       'Figma design review',
    date:        T1,
    startTime:   '02:00 PM',
    endTime:     '03:00 PM',
    color:       '#e01e5a',
    source:      'Notion Calendar',
    sourceColor: '#ffffff',
  },

  // ── Day after tomorrow ─────────────────────────────────────────────────────
  {
    id:          'evt-8',
    title:       'Backend architecture sync',
    date:        T2,
    startTime:   '11:00 AM',
    endTime:     '12:00 PM',
    color:       '#0052cc',
    source:      'Jira',
    sourceColor: '#0052cc',
  },
  {
    id:          'evt-9',
    title:       'Team retro',
    date:        T2,
    startTime:   '03:30 PM',
    endTime:     '04:30 PM',
    color:       '#4caf7d',
    source:      'Google Calendar',
    sourceColor: '#4285f4',
  },

  // ── Later ──────────────────────────────────────────────────────────────────
  {
    id:          'evt-10',
    title:       'Quarterly all-hands',
    date:        T3,
    startTime:   '10:00 AM',
    endTime:     '11:00 AM',
    color:       '#c9a96e',
    source:      'Outlook',
    sourceColor: '#0078d4',
    location:    'Main Auditorium',
  },
  {
    id:          'evt-11',
    title:       'Performance review prep',
    date:        T4,
    startTime:   '09:00 AM',
    endTime:     '10:00 AM',
    color:       '#e0a94a',
    source:      'Google Calendar',
    sourceColor: '#4285f4',
  },
  {
    id:          'evt-12',
    title:       'Cross-team integration call',
    date:        T4,
    startTime:   '02:00 PM',
    endTime:     '03:00 PM',
    color:       '#4285f4',
    source:      'Slack Huddle',
    sourceColor: '#e01e5a',
  },
]
