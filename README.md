# ApexLift - Mobile-First PWA Gym Workout Tracker

An installable, high-contrast Progressive Web Application (PWA) gym workout tracker built with **Next.js 15**, **TypeScript**, **Tailwind CSS**, **Supabase (PostgreSQL + Auth)**, **Recharts**, and **IndexedDB** for seamless offline logging and background cloud synchronization.

Designed specifically for the gym floor: thumb-reachable navigation, zero clutter during active workouts, rapid numeric logging with auto-filled previous weights, swipe-to-complete sets, a drift-free rest timer with sound chimes and system notifications, an Olympic barbell plate calculator, JSON backup/restore, and a realistic 3-month progressive overload training dataset.

---

## Core Features

### 1. Exercise Library (100+ Seeded + Custom)
- Over 100 seeded compound and isolation exercises across all muscle groups: Chest, Back, Shoulders, Quads, Hamstrings, Glutes, Calves, Biceps, Triceps, Forearms, Core, Cardio, and Full Body.
- Filter by muscle group and equipment (Barbell, Dumbbell, Cable, Machine, Bodyweight, Smith Machine, Kettlebell, Bands, Cardio Machine).
- Exercise detail modal with instructions, all-time Personal Records (PRs), historical performance logs, and custom exercise deletion.
- Custom exercise creator with instant local persistence and queued cloud sync.

### 2. Routine Builder & Template Splits
- Pre-configured routine templates: **Push Day**, **Pull Day**, **Legs & Core Day**, and **Upper Body Power**.
- Interactive Routine Editor: add and reorder exercises, configure target sets, target rep ranges (e.g. `8-12`), and rest targets.
- One-tap workout launch from any template or quick-start empty session.

### 3. Active Workout Mode (Gym Floor Ergonomics)
- **High-Contrast Dark OLED Design**: `#09090b` background with emerald and cyan accents.
- **Auto-Fill Previous Performance**: Automatically pre-fills working weights and reps from your last completed session.
- **Fast Touch Set Logging**:
  - Set types: Normal, Warmup (`W`), Dropset (`D`), and Failure (`F`).
  - Swipe right on any set row or tap the large checkmark target to complete sets with haptic feedback.
  - Inline workout title, session notes, pause/resume session timer, and exercise reordering.
- **Drift-Free Rest Timer**:
  - Wall-clock timestamp countdown so mobile screen locks or background tabs stay accurate.
  - Floating countdown with `+30s` / `-15s` / Skip / Minimize controls, Web Audio API chime, and system notifications.
- **Olympic Barbell Plate Calculator**:
  - Instant modal for Barbells and Smith Machines supporting both **lbs** and **kg**.
- **Celebration Summary**: Confetti animation, workout duration, total tonnage volume, completed sets, and newly achieved PR count.

### 4. Progress, Analytics & Shareable Weekly Card
- **Estimated 1RM Progression Curve** (Epley formula), session volume, and max weight charts via Recharts.
- **PR Trophy Cabinet** and **16-Week Volume Heatmap** using local calendar dates.
- **Bodyweight Tracker**: Log weigh-ins and monitor trends.
- **Shareable Weekly Card**: Generates an 800×800 PNG via HTML5 Canvas with Web Share API and direct download.

### 5. History Calendar & Retroactive Editor
- Monthly calendar with training-day markers and today indicator.
- Retroactive Workout Editor: edit workout name, date, notes, weights, reps, add/remove sets, or delete past workouts.

### 6. Offline-First IndexedDB Storage, JSON Backups & Supabase Sync
- **Local IndexedDB (`idb`)**: Stores exercises, routines, active session state, workouts, bodyweight logs, preferences, and queued sync mutations.
- **Coalesced Sync Queue**: Offline edits are queued and automatically pushed once online and authenticated with Supabase.
- **JSON Backup Export & Import**: Export/restore your entire local dataset in **Settings**.

---

## Getting Started

### 1. Install Locked Dependencies

```bash
npm ci
```

### 2. Run Development Server

```bash
npm run dev
```

Open `http://localhost:3000` in your browser. On first load, ApexLift automatically seeds 100+ exercises, 4 routine templates, and 3 months of realistic workout & bodyweight history into IndexedDB.

### 3. Verify Typecheck, Lint, Tests, and Static Export

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

### 4. (Optional) Connect Supabase Cloud Sync

1. Create a project at [supabase.com](https://supabase.com).
2. Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL Editor (idempotent script with strict RLS scoping all user-owned records to `auth.uid() = user_id`).
3. Create `.env.local` (never committed to Git):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```
4. Restart `npm run dev`, open **Settings**, and sign in with your Supabase account to sync queued offline changes and pull cloud records.

---

## Deployment (GitHub Pages)

GitHub Actions (`.github/workflows/deploy.yml`) automatically runs typecheck, lint, unit tests, and builds the static export (`out/`) served under `/workout` on every push to `main`.

---

## Project Structure

```text
WorkoutTracker/
├── .github/workflows/deploy.yml # CI checks & GitHub Pages static export deploy
├── public/
│   ├── icons/                   # SVG PWA icons (192x192, 512x512)
│   ├── manifest.json            # Web App Manifest
│   └── sw.js                    # Service Worker (network-first nav + SWR static cache)
├── src/
│   ├── app/                     # Next.js 15 App Router pages
│   ├── components/
│   │   ├── exercises/           # Exercise library, detail modal, custom creator
│   │   ├── history/             # Calendar view & retroactive workout editor
│   │   ├── layout/              # Header, BottomNav, PwaRegister
│   │   ├── progress/            # Recharts analytics, volume heatmap, share card
│   │   ├── routines/            # Routine list & routine template editor
│   │   ├── shared/              # Shared ExercisePickerModal
│   │   └── workout/             # Active workout, rest timer, plate calculator
│   └── lib/
│       ├── audio.ts             # Web Audio API chime, haptics & notifications
│       ├── constants.ts         # Shared constants, basePath & local date helpers
│       ├── db.ts                # IndexedDB persistence, reactive events & backups
│       ├── plate-calculator.ts  # Barbell plate breakdown logic
│       ├── seed-data.ts         # 100+ exercises & 3-month realistic demo dataset
│       ├── supabase.ts          # Browser Supabase anon client
│       ├── sync.ts              # Offline sync queue processor & remote pull
│       ├── types.ts             # TypeScript domain models
│       └── workout-utils.ts     # Pure workout stats, 1RM, PR & streak calculations
├── supabase/
│   ├── schema.sql               # PostgreSQL schema with strict RLS policies
│   └── seed.sql                 # Optional catalog seed SQL
└── tests/
    └── workout-core.test.ts     # Unit tests for domain math, dates, plates & seed data
```
