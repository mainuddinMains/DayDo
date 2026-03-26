# DayDo

A modern task management dashboard built with React, TypeScript, and Vite. DayDo aggregates your tasks from multiple sources — Google Tasks, Slack, Notion, and Jira — into a single, focused view.

---

## Features

- **Task List** — View, complete, and delete tasks with animated checkboxes and priority tags
- **Filter Chips** — Filter by All, High Priority, Pending, or Slack
- **Weekly Calendar Strip** — Click any day to filter tasks by due date
- **Stats Row** — Live metrics: completed tasks, due today, meetings, and focus streak
- **Add Task Modal** — Create tasks with name, source, priority, due time, and tags
- **Upcoming Events** — Right-rail panel showing grouped calendar events
- **Connected Apps** — Google Tasks and Slack OAuth2 integrations with live sync status
- **Toast Notifications** — Auto-dismissing alerts for actions and errors
- **Dark Theme** — Custom design system with gold accent (#c9a96e) and DM Serif Display / DM Sans fonts

---

## Tech Stack

| Layer       | Library                                 |
|-------------|-----------------------------------------|
| Framework   | React 19 + TypeScript 5.8               |
| Build       | Vite 6                                  |
| Styling     | Tailwind CSS v4 + CSS custom properties |
| State       | Zustand                                 |
| Routing     | React Router v6                         |
| Icons       | lucide-react                            |
| Animation   | motion                                  |

---

## Getting Started

### 1. Install dependencies

```bash
cd ~/Documents/DayDo
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Fill in your credentials in .env:

```
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173

VITE_SLACK_CLIENT_ID=your_slack_client_id
VITE_SLACK_CLIENT_SECRET=your_slack_client_secret
VITE_SLACK_REDIRECT_URI=http://localhost:5173
```

The app runs without these — integrations just show a Connect button.

### 3. Run the dev server

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

---

## Setting Up Integrations

### Google Tasks

1. Go to Google Cloud Console > APIs & Services > Credentials
2. Create an OAuth 2.0 Client ID — application type: Web application
3. Add http://localhost:5173 to Authorised redirect URIs
4. Enable the Tasks API in APIs & Services > Library
5. Copy the Client ID into VITE_GOOGLE_CLIENT_ID

### Slack

1. Go to api.slack.com/apps and create a new app
2. Under OAuth & Permissions, add http://localhost:5173 as a redirect URL
3. Add User Token Scopes: search:read, stars:read
4. Copy the Client ID and Client Secret into your .env

---

## Project Structure

```
src/
├── components/
│   ├── AppShell.tsx        # Layout wrapper, runs integration hooks
│   ├── Navbar.tsx          # Fixed top bar with date and avatar
│   ├── Sidebar.tsx         # Navigation sidebar
│   ├── TaskList.tsx        # Task list with filter chips
│   ├── StatsRow.tsx        # 4 metric cards
│   ├── WeekStrip.tsx       # Mon-Sun calendar strip
│   ├── AddTaskModal.tsx    # Add task portal modal
│   ├── ConnectedApps.tsx   # Integration status panel
│   ├── UpcomingEvents.tsx  # Right-rail events panel
│   └── Toaster.tsx         # Toast notification system
├── hooks/
│   ├── useGoogleTasks.ts   # Google OAuth2 + task sync
│   ├── useSlack.ts         # Slack OAuth2 + task sync
│   ├── useSidebar.ts       # Responsive sidebar state
│   └── useTasks.ts         # Zustand selector hooks
├── lib/
│   ├── googleAuth.ts       # PKCE OAuth2 utilities
│   ├── googleTasksApi.ts   # Google Tasks REST client
│   └── slackApi.ts         # Slack Web API client
├── store/
│   ├── taskStore.ts        # Tasks + integration status
│   ├── modalStore.ts       # Add task modal state
│   ├── calendarStore.ts    # Selected date state
│   └── toastStore.ts       # Toast queue state
├── types/
│   └── index.ts            # Task, Priority, Source types
├── data/
│   └── events.ts           # Mock calendar events
└── pages/
    └── Home.tsx            # Main dashboard page
```

---

## Scripts

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # TypeScript type check
```

---

## Design Tokens

| Token             | Value            |
|-------------------|------------------|
| --color-bg        | #0e0e10          |
| --color-surface   | #151517          |
| --color-accent    | #c9a96e          |
| Heading font      | DM Serif Display |
| Body font         | DM Sans          |
