# WorkoutTracker

- Install the locked dependencies with `npm ci`. Use `npm run dev` for local development and `npm run build` to check the static export. GitHub Pages deploys from `main` and serves the export under `/workout`.
- Preserve offline workout logging, IndexedDB persistence, and queued Supabase sync. For relevant changes, verify workout logging and reload while offline, then test reconnection with a test account.
- Keep workout history, bodyweight, training notes, and credentials out of the public repository. Use demo or synthetic data for screenshots and testing. Keep local configuration in `.env.local`.
- Review `supabase/schema.sql` when changing cloud data access. Verify user-owned records are scoped by row-level security and keep privileged Supabase credentials out of the browser bundle.
