# Prompt: Fresh migration to MacBook Air M4 — continue from here

**Use this after pulling the latest code on your Mac. Copy everything below the line into Cursor.**

---

I'm on a new MacBook Air M4 (macOS) and need to set up this project from scratch so I can continue development. The repo has just been pushed with the latest changes.

**Repo:** Clone from my GitHub (use the same URL I use on Windows). The project is a Next.js app (teluguvibes) with TypeScript, Supabase, and scripts run via `npx tsx`.

**What to do:**

1. **Prerequisites**
   - Node.js LTS 20+ (e.g. `brew install node` or from nodejs.org).
   - Git (usually pre-installed; else `xcode-select --install` or `brew install git`).

2. **Clone and install**
   - Create a folder (e.g. `~/Projects`), then:  
     `git clone <my-repo-url> teluguvibes && cd teluguvibes`
   - Run: `npm install`  
   - Confirm no errors.

3. **Environment**
   - Create `.env.local` in the project root with at least:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `NEXTAUTH_URL=http://localhost:3000`
     - `AUTH_SECRET` (e.g. `openssl rand -base64 32`)
     - Optional: `TMDB_API_KEY`, `GROQ_API_KEY` or `OPENAI_API_KEY` (for Planner/Antigravity), `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `ADMIN_EMAILS`
   - Do not commit `.env.local`. Tell me when the file is ready so I can paste my values.

4. **Verify**
   - Run: `npm run dev`
   - Confirm the app runs and I can open http://localhost:3000 in the browser. If there are errors, help fix them (often env vars).

5. **Optional checks**
   - Run a quick Supabase check, e.g.:  
     `npx tsx scripts/audit-movie-schema-multicast.ts`  
     (expects Supabase env vars; just confirm it connects.)
   - If I use Planner/Antigravity: `npm run planner -- --help` and `npm run antigravity -- --help`.

**Latest changes on main (so I can continue from here):**
- Multi-hero support: `heroes` / `heroines` arrays in types, cast-parser, profile API, movie page. Backfill SQL: `migrations/backfill-heroes-heroines.sql` (run in Supabase if not already).
- Validate-and-fix orchestrator: `npm run movies:validate-and-fix:audit` or `movies:validate-and-fix:execute`. See `docs/VALIDATE_AND_FIX_ALL_MOVIES.md`.
- Database integrity audit: runs for all movies (paginated). Timeline validator is optimized (no per-actor DB storm). Example:  
  `npx tsx scripts/audit-database-integrity.ts --validators=duplicates,suspicious,attribution,timeline --output-dir=reports`
- Planner, Antigravity, handoff execution: see `docs/HANDOFF_EXECUTION_FLOW.md` and `docs/MULTI_HERO_THREE_AGENT_GUIDE.md`.

**Tech stack:** Next.js, React 19, TypeScript, Supabase. Scripts: `npx tsx`. No local DB.

Please do the steps in order, run the commands where possible, and tell me what to do on my side (e.g. paste env values, open browser).
