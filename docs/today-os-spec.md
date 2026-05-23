You are my pair‑programmer and product co‑designer. We’re building a personal “Today OS” web app using SvelteKit + Bun, with a Supabase backend and optional Google integrations. The goal is to both learn SvelteKit deeply and ship a genuinely useful personal tool that I can use every day.

High‑level product vision ￼

The app is like a focused, less‑overwhelming mix of Google Keep + habit logger + Todoist + Google Calendar “Today” view wrapped into one “Today” screen.

I want to open the app and immediately see:

- What I need to do today (todos).

- What I’ve logged today for my habits (water, calories, sleep, screen time, etc.).

- A today timeline of my Google Calendar (read‑only, just for context).

- A place to jot notes (LinkedIn drafts, scratch notes, shopping lists) without Notion‑level complexity.

This app is primarily for me, but should be built in a way that could support multiple users later.

Core concepts and UX ￼

1. Today page (the main/home view) ￼

The Today page is the heart of the app. For a given day (default: today), it shows:

1. Header

 ▫ Formatted date: “Today – Thu 23 Apr”.

 ▫ Light “Today OS” vibe with theme color from settings.

2. Google Calendar blocks (read‑only)

 ▫ If integrated:

 ⁃ Condensed list of events or a simple time‑block strip for the selected day.

 ⁃ Purely for context; no editing or writing back to Google Calendar in v1.

 ▫ If not integrated yet:

 ⁃ Placeholder or mock data during earlier phases.

3. Todos for Today

 ▫ A list of tasks that:

 ⁃ Are due today, or

 ⁃ Are overdue and incomplete (optional behaviour).

 ▫ Simple item structure:

 ⁃ Title, optional time, status (pending/done).

 ▫ Inline add form: “Add a todo…” (title + optional due time).

 ▫ Checkboxes to mark done.

4. Habits with ClickUp‑style logging

 ▫ Each habit appears as a card showing:

 ⁃ Name (e.g. “Water”).

 ⁃ A progress line like ‎`830 / 2000 ml` for today.

 ⁃ A bar whose color logic depends on goal type:

 ▪ ‎`min_goal`: bar fills up to goal, turns green once ≥ goal.

 ▪ ‎`max_goal`: bar fills up to goal, shows warning when > goal.

 ▪ ‎`info_only`: neutral color, just shows total.

 ▫ Clicking a habit card opens a Habit Log Drawer for that habit & day:

 ⁃ Header: “Water – Today”.

 ⁃ Subheader: ‎`Total: 830 / 2000 ml`.

 ⁃ List of individual logs (reverse chronological):

 ▪ Example: ‎`15:24 – 330 ml`, ‎`12:07 – 500 ml`.

 ▪ Each log has edit + delete buttons.

 ⁃ A prominent “+ Add log” button:

 ▪ Opens a mini form to enter a numeric amount (and optional note).

 ▪ On submit, a new entry is appended with the current timestamp.

 ⁃ Edit:

 ▪ Reopens the same mini form with value prefilled; save updates the log.

 ⁃ Delete:

 ▪ Removes the specific log.

 ⁃ The total for the day is always computed as ‎`sum(value)` of logs for that habit and date.

 ▫ Logging should feel lightweight and fast; similar to ClickUp time entries or manual Apple Health logs.

5. Quick notes / Inbox

 ▫ At the bottom or side of Today:

 ⁃ Textarea or input: “Write a quick note…”.

 ▫ On submit:

 ⁃ Creates a note associated with today’s date.

 ▫ This is for scratch notes, journaling bits, or quick LinkedIn ideas.

The Today page should be mobile‑friendly and feel like something I’d happily pin to my phone’s home screen as a PWA.

2. Habits management ￼

A separate Habits screen where I define and manage habits.

Each Habit Definition includes:

- ‎`name`: e.g. “Water”, “Calories”, “Screen time”, “Sleep”.

- ‎`unit`: e.g. ‎`ml`, ‎`kcal`, ‎`hours`, ‎`minutes`.

- ‎`type`: one of:

 ▫ ‎`min_goal`: I want at least this amount (e.g. water).

 ▫ ‎`max_goal`: I don’t want to exceed this amount (e.g. calories, screen time).

 ▫ ‎`info_only`: no strict goal, just tracking.

- ‎`daily_goal`: numeric goal (nullable).

- ‎`color`: used in bars/charts.

- ‎`is_active`: to hide habits I’m not currently tracking.

From this screen, I can:

- Add a new habit.

- Edit existing habits.

- Deactivate or delete habits.

3. Todos ￼

Todos are not habits. They are discrete tasks like:

- “Get groceries.”

- “Finish assignment.”

- “Post LinkedIn draft.”

Each Todo:

- ‎`title`

- ‎`description` (optional)

- ‎`status`: ‎`pending` or ‎`done`

- ‎`due_date` (date, and optionally time)

- ‎`priority` (optional)

- ‎`note_id` (optional: link a todo to a note, e.g. LinkedIn draft)

- timestamps (‎`created_at`, ‎`completed_at`)

The UX inspirations are Todoist‑like, but scoped to what’s useful for a Today‑centric workflow.

4. Notes ￼

Notes are a simple, less‑intimidating alternative to Notion, closer to Google Keep but with mild formatting and some note types.

A Note has:

- ‎`title`

- ‎`content`:

 ▫ Represented internally as markdown for simplicity.

 ▫ Supports: bold, italics, underline (via markdown and CSS), bullet lists, checkboxes (‎`- [ ]`), etc.

- ‎`type` enum:

 ▫ ‎`note` (default scratch note / journal).

 ▫ ‎`draft` (e.g. LinkedIn posts).

 ▫ ‎`list` (shopping list, checklists).

- ‎`date` (optional):

 ▫ Used to associate a note with a day (for Today/Calendar views).

- ‎`created_at`, ‎`updated_at`.

Notes screen:

- ‎`/notes`: list/grid of notes with search/filter.

- Filter by type (e.g. show only drafts).

- Simple editor: markdown textarea + preview.

5. Calendar & history ￼

A Calendar or Days view lets me inspect other days:

- Month view (simple calendar).

- Selecting a date shows:

 ▫ Todos for that date.

 ▫ Habit bars for that date (summing logs).

 ▫ Notes with that date.

This view helps me see patterns: e.g. how my water intake or calories changed over the week.

6. Google Calendar integration ￼

Integration is read‑only to start:

- Use Google OAuth scopes to get access to my calendar.

- On the server, fetch events for the selected day (especially Today).

- Show them on Today and in the per‑day view as:

 ▫ Either a simple list of time blocks, or

 ▫ A visual “busy/free” bar.

No writing back to Google Calendar in v1; only reading events and showing them for context.

Data model (Supabase) ￼

Design a schema that can be implemented in Supabase and later migrated easily. Rough shape:

- ‎`users`

 ▫ ‎`id`

 ▫ ‎`email`

 ▫ ‎`display_name`

 ▫ ‎`preferences` (JSON with theme, etc.)

 ▫ timestamps

- ‎`notes`

 ▫ ‎`id`, ‎`user_id`

 ▫ ‎`title`

 ▫ ‎`content` (markdown or text)

 ▫ ‎`type` enum (‎`note`, ‎`draft`, ‎`list`)

 ▫ ‎`date` (nullable)

 ▫ timestamps

- ‎`todos`

 ▫ ‎`id`, ‎`user_id`

 ▫ ‎`title`

 ▫ ‎`description` (nullable)

 ▫ ‎`status` enum (‎`pending`, ‎`done`)

 ▫ ‎`due_date` (date/time)

 ▫ ‎`priority` (nullable)

 ▫ ‎`note_id` (nullable, FK to notes)

 ▫ ‎`created_at`, ‎`completed_at` (nullable)

- ‎`habit_definitions`

 ▫ ‎`id`, ‎`user_id`

 ▫ ‎`name`

 ▫ ‎`unit`

 ▫ ‎`type` enum (‎`min_goal`, ‎`max_goal`, ‎`info_only`)

 ▫ ‎`daily_goal` (numeric, nullable)

 ▫ ‎`color`

 ▫ ‎`is_active` boolean

 ▫ timestamps

- ‎`habit_logs`

 ▫ ‎`id`, ‎`user_id`

 ▫ ‎`habit_id` (FK to habit_definitions)

 ▫ ‎`date` (day bucket)

 ▫ ‎`value` (numeric)

 ▫ ‎`created_at` (timestamp of logging)

This schema supports the ClickUp‑style logging: many logs per habit per day, total is the sum.

Tech stack & architecture ￼

- Runtime / tooling: Bun.

 ▫ ‎`bun create svelte@latest` to scaffold.

 ▫ ‎`bun run dev` etc.

- Framework: SvelteKit with TypeScript.

- Styling: Tailwind CSS or another modern utility‑first approach.

- Backend: Supabase (Postgres, auth, storage).

 ▫ Use Supabase auth with Google sign‑in.

 ▫ Use Row Level Security so each user only sees their own data.

- SvelteKit features to exercise:

 ▫ File‑based routing and nested layouts:

 ⁃ ‎`/today`, ‎`/notes`, ‎`/habits`, ‎`/calendar`, ‎`/settings`.

 ▫ ‎`+page.server.ts` and ‎`+layout.server.ts` for SSR data loading.

 ▫ ‎`actions` for handling form posts (todos, notes, habit logs).

 ▫ ‎`hooks.server.ts` for auth/session handling.

 ▫ Svelte stores for session, theme, and maybe in‑memory prototyping.

 ▫ Animations/transitions for adding/removing todos, notes, logs.

- PWA:

 ▫ Configure manifest and service worker (e.g. ‎`@vite-pwa/sveltekit`) so I can install this on my phone and use it like a native app.

- Google Calendar integration:

 ▫ Google OAuth scopes for calendar read‑only.

 ▫ Server‑side SvelteKit route for fetching day events.

 ▫ Handle tokens securely.

Development approach: phases ￼

Design the work in phases that each result in something usable, while maximising SvelteKit learning.

1. Phase 1: Local‑only prototype

 ▫ No auth, no DB, no external APIs.

 ▫ In‑memory stores for notes, todos, habits, and logs.

 ▫ Implement:

 ⁃ ‎`/today` with todos, habit cards, and Habit Log Drawer.

 ⁃ ‎`/habits` for managing habit definitions (in memory).

 ⁃ ‎`/notes` for simple markdown notes.

 ⁃ Basic layout and navigation.

 ▫ Everything resets on reload; this is strictly for UX and Svelte fluency.

2. Phase 2: Supabase + auth

 ▫ Add Supabase and define schema as above.

 ▫ Implement Google sign‑in; each user sees only their own data.

 ▫ Replace in‑memory stores with real DB access via ‎`+page.server.ts` and ‎`actions`.

 ▫ Make ‎`/settings` where I can:

 ⁃ Adjust theme/colors.

 ⁃ Manage habit definitions more robustly.

3. Phase 3: Calendar & history

 ▫ Add ‎`/calendar` or ‎`/days`.

 ▫ Show month view and per‑day breakdown (todos, habits, notes).

 ▫ Optional simple charts (bar/line) per habit for last 7/30 days.

4. Phase 4: Google Calendar (read‑only)

 ▫ Add Google Calendar integration.

 ▫ Show today’s events/time blocks on ‎`/today` and inside per‑day views.

How I want you (Claude) to help ￼

As Claude, please:

- Treat this metaprompt as the product spec.

- Help me incrementally build this using SvelteKit + Bun, with strong, production‑quality code but a relaxed “vibe coding” flow.

- For each step/phase:

 ▫ Propose a short numbered plan (max 5 steps).

 ▫ Then write the actual code (files, components, routes) with:

 ⁃ Complete examples.

 ⁃ Necessary imports.

 ⁃ Clear, descriptive names.

 ⁃ Comments where helpful.

- Assume I’m comfortable with TypeScript/React/Node and Supabase, but still new to SvelteKit’s exact conventions.

- Optimise for:

 ▫ Clean architecture.

 ▫ Easy iteration.

 ▫ Clear separation of concerns (routes, components, lib functions).

- Avoid placeholders like ‎`// TODO`; give concrete, runnable code where possible.

Start by scaffolding Phase 1:

- Project structure under ‎`src/routes` (‎`/today`, ‎`/habits`, ‎`/notes`, ‎`/settings`).

- ‎`src/lib/stores` with in‑memory data structures for habits, logs, todos, notes.

- A first pass at ‎`/today` with:

 ▫ Dummy data for habits and logs.

 ▫ Clickable habit cards opening a log drawer.

 ▫ Simple todos list and quick add form.

 ▫ Quick note input.

Then we’ll iterate, refine UX, and only after Phase 1 feels right move on to Supabase and auth
