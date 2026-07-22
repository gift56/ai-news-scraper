# DailyBit Clerk Authentication Implementation

## Goal

Add Clerk authentication to the DailyBit App Router app with the smallest production-ready surface:

- wrap the app with `ClerkProvider`
- add sign-in and sign-up routes
- update the header to show auth-aware actions
- protect the news details page so signed-in users can view it
- keep the homepage public
- keep the existing DailyBit editorial layout intact

Do not add billing, organizations, or user profile management beyond the basic auth entry points unless required by Clerk setup.

## Skills read

- `.agents/skills/clerk/SKILL.md`
- `node_modules/next/dist/docs/01-app/02-guides/authentication.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/layout.md`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/globals.css`
- `src/components/layout/site-header.tsx`
- `src/components/layout/site-footer.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/news-card.tsx`

## Existing code inspected

| File | State |
|------|-------|
| `package.json` | Next.js 16.2.11, React 19.2.4, no Clerk dependency yet, no `typecheck` script yet |
| `src/app/layout.tsx` | Root layout renders shared header/footer and global metadata |
| `src/app/page.tsx` | Homepage is server-rendered and renders mock news cards |
| `src/app/globals.css` | Custom DailyBit tokens and layout utilities already exist |
| `src/components/layout/site-header.tsx` | Header currently contains placeholder `Subscribe` and `Login` links |
| `src/components/layout/site-footer.tsx` | Existing footer can remain unchanged |
| `src/components/ui/button.tsx` | Shared button primitive already exists |
| `src/components/ui/news-card.tsx` | News cards are unrelated to auth but confirm the app is already componentized |

## Decisions and assumptions

1. Use the current Clerk Next.js package and App Router patterns, not a legacy Pages Router setup.
2. Use Clerk prebuilt UI components for the first pass instead of building custom sign-in forms.
3. Keep auth entry points lightweight and editorial in tone so they match the existing DailyBit shell.
4. Use the Next.js 16 `proxy.ts` file convention instead of `middleware.ts`.
5. Protect auth-sensitive routes only as needed for the current app, but ensure Clerk session state is available globally.
6. Preserve the existing homepage and article presentation; this task is only about auth wiring and auth UI.

## Files likely to change

| File | Change |
|------|--------|
| `package.json` | Add Clerk dependency and, if useful, a `typecheck` script |
| `src/app/layout.tsx` | Wrap the app in `ClerkProvider` and keep root metadata intact |
| `src/components/layout/site-header.tsx` | Replace placeholder login controls with Clerk-aware auth actions |
| `src/app/sign-in/[[...sign-in]]/page.tsx` | Add Clerk sign-in route |
| `src/app/sign-up/[[...sign-up]]/page.tsx` | Add Clerk sign-up route |
| `src/app/news/[slug]/page.tsx` | Protect the article details page and redirect unauthenticated users |
| `src/proxy.ts` | Add Clerk session proxy/matching if required for App Router session handling |
| `.env.example` | Add Clerk environment variables and keep server/client exposure clear |
| `src/app/globals.css` | Only if small styling adjustments are needed for Clerk pages or auth buttons |

## Implementation requirements

### Clerk setup

1. Install the Clerk Next.js package that matches the current Clerk docs for App Router.
2. Add the required public and server environment variables to `.env.example`.
3. Keep the Clerk secret server-only.
4. Use the root layout to provide Clerk context to the app.
5. Keep existing DailyBit metadata, header, and footer behavior unless auth needs a small adjustment.

### Auth routes

1. Add a sign-in route using Clerk's App Router route conventions.
2. Add a sign-up route using Clerk's App Router route conventions.
3. Ensure both routes render a clean DailyBit-aligned auth experience.
4. Route buttons from the header to these pages.
5. Make sign-out return to the homepage or another clear public landing state.

### Header behavior

1. Replace the placeholder `Login` link with auth-aware controls.
2. When signed out, show clear `Sign in` and `Sign up` actions.
3. When signed in, show the Clerk user menu or user button instead of duplicate auth links.
4. Keep the header layout balanced on desktop and readable on mobile.
5. Do not break the current utility bar, nav row, or topic chips.

### Route protection and session handling

1. Add the Clerk proxy/session integration required for App Router.
2. Use the Next.js 16 `proxy.ts` convention rather than a deprecated `middleware.ts` file.
3. Keep the matcher scoped correctly so static assets and public pages are not blocked.
4. Protect `/news/[slug]` so unauthenticated users are redirected to sign in.
5. Leave `/` public and accessible without authentication.
6. Do not rely only on UI state for security if any route protection is added.

### Visual interpretation

1. Preserve the existing DailyBit brand styling: light editorial shell, dark footer, restrained borders, and neutral typography.
2. Auth pages should feel like a clean publisher login surface, not a generic SaaS dashboard.
3. Prefer centered card-like auth panels with enough spacing for mobile and desktop.
4. Buttons should use the existing button language or Clerk styling overrides that stay visually consistent.
5. Avoid adding heavy gradients, extra panels, or unrelated marketing sections.

### Security requirements

- Do not expose `CLERK_SECRET_KEY` to browser code.
- Keep `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` as the only Clerk value exposed to the client.
- Do not add any scraping, AI, Supabase, or backend mutation logic in this task.
- Do not add auth tokens to local storage or custom cookie handling.
- Keep any route protection server-side through Clerk and Next.js conventions.

## Acceptance criteria

- [ ] Clerk dependency is installed and wired into the app
- [ ] Root layout provides Clerk context
- [ ] `/sign-in` and `/sign-up` routes work
- [ ] Header shows signed-out and signed-in states correctly
- [ ] `/news/[slug]` redirects unauthenticated users to sign in
- [ ] `/` remains publicly accessible
- [ ] Sign-out returns the user to a public page
- [ ] App still renders the DailyBit homepage and footer correctly
- [ ] Environment variables are documented in `.env.example`
- [ ] Any protected route behavior uses server-side Clerk handling
- [ ] `npm run lint` passes
- [ ] `npm run build` passes

## Checks to run

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`

## Manual test steps

1. Run `npm run dev`
2. Open `http://localhost:3000`
3. Confirm the homepage loads without requiring authentication
4. Confirm the header shows Clerk auth actions when signed out
5. Open `/news/<slug>` for any valid article slug and verify unauthenticated users are redirected to sign in
6. Open `/sign-in` and verify the Clerk sign-in UI renders
7. Open `/sign-up` and verify the Clerk sign-up UI renders
8. Sign in and confirm the header switches to the signed-in state with the user button/menu
9. Re-open `/news/<slug>` and confirm the details page renders for signed-in users
10. Sign out and confirm `/news/<slug>` redirects again while `/` stays public
11. Refresh the page and confirm the session persists correctly
12. Verify the homepage cards and footer still render normally after auth is added
13. Watch the dev server terminal for auth or proxy errors while testing
