# ApexLift - Mobile-First PWA Gym Workout Tracker

An installable, high-contrast Progressive Web Application (PWA) gym workout tracker built with **Next.js 15**, **TypeScript**, **Tailwind CSS**, **Supabase (PostgreSQL + Auth)**, **Recharts**, and **IndexedDB** for seamless offline logging and background cloud synchronization.

Designed specifically for the gym floor: thumb-reachable navigation, zero clutter during active workouts, rapid numeric logging with auto-filled previous weights, rest timer with sound chimes and system notifications, an Olympic barbell plate calculator, and a realistic 3-month progressive overload training dataset.

---

## ⚡ Core Features

### 1. Exercise Library (100+ Seeded + Custom)
- Over 100 seeded compound and isolation exercises across all muscle groups: Chest, Back, Shoulders, Quads, Hamstrings, Glutes, Calves, Biceps, Triceps, Forearms, Core, and Cardio.
- Filter by muscle group (pill carousel) and equipment (Barbell, Dumbbell, Cable, Machine, Bodyweight, Smith Machine, Kettlebell).
- Exercise detail modal with instructions, primary/secondary muscles, all-time Personal Records (PRs), and historical performance logs.
- Custom exercise creator with instant local and cloud storage.

### 2. Routine Builder & Template Splits
- Pre-configured routine templates:
  - **Push Day** (Chest, Shoulders, Triceps)
  - **Pull Day** (Back, Biceps, Rear Delts)
  - **Legs Day** (Quads, Hamstrings, Calves, Core)
  - **Upper Body Power**
- Interactive Routine Editor: add exercises, set target sets, target rep ranges (e.g. `8-12`), rest target in seconds, and exercise notes.
- One-tap instant workout launch from any template or quick-start empty session.

### 3. Active Workout Mode (Gym Floor Ergonomics)
- **High-Contrast Dark OLED Design**: `#09090b` background with emerald and cyan accents for maximum visibility under harsh gym lighting.
- **Auto-Fill Previous Performance**: When you add an exercise, previous working weights and reps from your last session are automatically displayed and pre-filled.
- **Fast Touch Set Logging**:
  - Set types: Normal, Warmup (W), Dropset (D), and Failure (F).
  - Quick adjustment inputs and step controls.
  - Large checkmark touch target to complete sets with haptic vibration feedback.
- **Rest Timer**:
  - Automatically triggers when a set is completed.
  - Floating countdown with +30s / -15s / Skip controls.
  - **Web Audio API sound chime** synthesized directly in the browser (zero missing asset issues).
  - **System notifications** when the rest countdown completes.
- **Olympic Barbell Plate Calculator**:
  - Instant modal for Barbells and Smith Machines.
  - Supports both **lbs** (45, 35, 25, 10, 5, 2.5) and **kg** (25, 20, 15, 10, 5, 2.5, 1.25).
  - Visual color-coded barbell plate stack showing exact plates per side.
- **Session State Persistence**: Real-time saving to IndexedDB ensures progress is never lost even if the browser is closed or phone locks.
- **Celebration Summary**: Confetti explosion, workout duration, total tonnage volume, completed sets, and newly minted PR badges.

### 4. Progress & Analytics
- **Estimated 1RM Progression Curve**: Recharts interactive line/area charts calculating 1RM using the Epley formula:
  $$\text{1RM} = \text{Weight} \times \left(1 + \frac{\text{Reps}}{30}\right)$$
- **Volume Load Over Time**: Track tonnage lifted per session ($Weight \times Reps$).
- **PR Trophy Showcase**: Badges for Max Weight, Max 1RM, and Max Volume across exercises.
- **Monthly Volume Heatmap**: GitHub-style activity grid visualizing training frequency and volume density over the last 16 weeks.
- **Bodyweight Tracker**: Daily weigh-in logger with date selection and trend chart.

### 5. Streaks & Weekly Summary Card (Shareable Image)
- Consecutive week training streak counter.
- Weekly goal progress bar (e.g. 4 workouts/week target).
- **Shareable Weekly Card**:
  - Visual summary card highlighting weekly volume, workouts count, duration, and completed sets.
  - **Canvas Image Export**: Generates a high-res 800x800 PNG graphic directly in the browser.
  - One-tap **Web Share API** integration on mobile (`navigator.share`) or direct PNG download.

### 6. History & Calendar View
- Interactive monthly calendar with workout indicator dots on training days.
- Filter workouts by selected date or view chronological feed.
- **Retroactive Workout Editor**: Adjust past weights, reps, add/delete sets, or change workout notes.
- Delete past workouts with confirmation.

### 7. Offline-First Architecture & Supabase Sync
- **Local IndexedDB Database (`idb`)**: Complete client-side storage for exercises, routines, workouts, bodyweight logs, and preferences.
- **Sync Queue Engine**: Every action is saved locally and enqueued into `sync_queue`. When online and Supabase is configured, operations are automatically synchronized to PostgreSQL.
- **Visual Sync Status**: Real-time indicator in the top header ("Synced", "Syncing...", "Offline - X pending", or "Local DB").

### 8. 3-Month Realistic Demo Dataset
- Pre-seeded with 12 weeks (~42 workouts) of realistic progressive overload (e.g. Bench Press: 185 $\to$ 225 lbs, Squat: 225 $\to$ 285 lbs, Deadlift: 275 $\to$ 345 lbs) and bodyweight progression.
- Can be refreshed or reloaded at any time in **Settings > Demo Data & Storage > Reload 3 Months Demo Data**.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 15 (App Router)](https://nextjs.org/) |
| **Language** | TypeScript 5+ |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Charts** | [Recharts](https://recharts.org/) |
| **Client Database** | [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) via [idb](https://github.com/jakearchibald/idb) |
| **Cloud Database / Auth** | [Supabase](https://supabase.com/) (PostgreSQL + RLS) |
| **Audio Alert** | HTML5 Web Audio API (Synthesizer Chimes) |
| **PWA** | Web App Manifest + Service Worker (`sw.js`) |

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The app runs immediately with 100+ seeded exercises and 3 months of realistic workout history stored in IndexedDB!

### 3. (Optional) Connect Supabase Cloud Sync

To synchronize your workouts across multiple devices with Supabase:

1. Create a project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in Supabase and run the schema script located at:
   ```
   supabase/schema.sql
   ```
3. Optionally run the seed data script:
   ```
   supabase/seed.sql
   ```
4. Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```
5. Restart your dev server. ApexLift will now automatically synchronize local IndexedDB records with your Supabase cloud tables.

---

## 📱 Installing the PWA on Your Phone

1. **iOS (Safari)**:
   - Navigate to the app in Safari.
   - Tap the **Share** icon (square with upward arrow) at the bottom.
   - Scroll down and tap **"Add to Home Screen"**.
2. **Android (Chrome)**:
   - Navigate to the app in Chrome.
   - Tap the three-dot menu icon in the top right corner.
   - Tap **"Install app"** or **"Add to Home screen"**.

---

## 📁 Project Structure

```
WorkoutTracker/
├── public/
│   ├── icons/           # SVG PWA icons (192x192, 512x512)
│   ├── manifest.json    # Web App Manifest
│   └── sw.js            # Service Worker for offline caching
├── src/
│   ├── app/
│   │   ├── layout.tsx   # Root layout with mobile viewports & safe areas
│   │   ├── page.tsx     # Dashboard (streaks, goal, quick start)
│   │   ├── workout/     # Active workout logging engine
│   │   ├── routines/    # Routine template builder
│   │   ├── exercises/   # Exercise library & PR records
│   │   ├── progress/    # 1RM curves, volume heatmap, weekly card
│   │   ├── history/     # Calendar view & past workout editor
│   │   └── settings/    # Unit toggles, audio, demo reload, Supabase
│   ├── components/
│   │   ├── layout/      # Header with sync pill & BottomNav
│   │   ├── workout/     # Active workout, plate calculator, rest timer
│   │   ├── exercises/   # Library, detail modal, custom exercise modal
│   │   ├── routines/    # Routine list & routine editor
│   │   ├── progress/    # Recharts 1RM, volume heatmap, weekly share card
│   │   └── history/     # Calendar view & retroactive workout editor
│   └── lib/
│       ├── types.ts     # TypeScript interfaces
│       ├── db.ts        # IndexedDB wrapper & analytics calculations
│       ├── seed-data.ts # 100+ exercises & 3 months realistic history
│       ├── supabase.ts  # Supabase client & connection check
│       ├── sync.ts      # Offline sync queue manager
│       ├── audio.ts     # Web Audio API chime & notifications
│       └── plate-calculator.ts # Barbell plate breakdown logic
└── supabase/
    ├── schema.sql       # PostgreSQL schema with RLS policies
    └── seed.sql         # Seed data SQL
```

---

## 🔒 Security & Privacy

ApexLift is **offline-first and privacy-focused**. When used without Supabase credentials, 100% of your training data resides exclusively on your local device. When connected to Supabase, PostgreSQL Row-Level Security (RLS) ensures each user can strictly access only their own workout sessions and custom exercises.
