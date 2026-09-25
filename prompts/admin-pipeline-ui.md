# DailyBit admin pipeline UI

## Goal

Add a dedicated admin page that runs the full DailyBit pipeline from the browser without requiring repeated curl commands:

- scrape active sources
- then analyze pending articles
- show progress as the request runs
- redirect to the home page when the run completes
- keep Gemini usage conservative because the project is on a free tier and the app should avoid bursty over-analysis

## Skills read

- `AGENTS.md` sections 8, 14, 15, 16, 17, 19, 21, 22
- `.agents/skills/ai-sdk/SKILL.md`
- `.agents/skills/supabase/SKILL.md`

## Existing code inspected

- `src/app/api/scrape/route.ts` — POST route with admin-secret verification and default source handling
- `src/app/api/analyze/route.ts` — POST route with admin-secret verification and analysis options
- `src/lib/pipeline/scrape.ts` — scrape pipeline, logging, and summary
- `src/lib/pipeline/analyze.ts` — analysis pipeline, batching, and rate-limit-conscious delays
- `src/components/ui/button.tsx` — shared button component
- `src/app/page.tsx` — main homepage

## Decisions and assumptions

1. The admin page should be lightweight and browser-driven, not a separate backend service.
2. The page should prompt for the admin secret once, then call the existing server routes with the same headers the curl commands use.
3. To keep free-tier Gemini usage controllable, the admin page defaults to a very small cap for analysis runs and exposes a user-controlled limit.
4. Progress should be UI-only feedback; it should not replace the console logs already emitted by the route handlers.
5. After a successful run, the page redirects to the home page so the newly scraped article can be previewed immediately.

## Files likely to change

- `src/app/admin/page.tsx` — new admin page

## Implementation requirements

- Provide a route at `/admin`.
- Use a client component with a button to start both data-processing actions in sequence.
- Send `x-DailyBit-admin-secret` as a header for both requests.
- Use a simple, readable progress bar and step list.
- Accept a user-configurable analysis limit bounded to a safe range, e.g. 1–10.
- Keep the default analysis cap intentionally low to protect a free Gemini quota.
- When the run fails, surface the server error in the UI.
- On success, redirect to `/` after a short completion delay.

## Security requirements

- Never place the admin secret in the URL.
- Keep the value in local component state only while the page is open.
- Do not expose any secret to the browser beyond user input in the page itself.
- Continue relying on the server-side admin-secret verification already implemented in the API routes.

## Acceptance criteria

- [ ] A dedicated `/admin` page exists
- [ ] The page triggers the scrape route and then the analysis route
- [ ] The page shows visible progress feedback
- [ ] The default behavior is rate-limit-aware and conservative
- [ ] Success redirects to the home page so new content can be previewed
- [ ] Requests still require the correct admin secret header and return 401 on invalid input

## Checks to run

- `npm run typecheck`
- `npm run lint`
- `npm run build`

## Manual test steps

1. Start the dev server: `npm run dev`
2. Open `http://localhost:3000/admin`
3. Paste the `DailyBit_ADMIN_SECRET` value into the admin secret field
4. Click `Start scrape + analysis`
5. Watch the progress bar and terminal logs while the scraper runs
6. Confirm the app redirects to `/` when the pipeline completes
7. Verify the new article appears on the home page and can be opened
