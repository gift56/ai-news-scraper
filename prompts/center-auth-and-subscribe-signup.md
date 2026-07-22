# Center Auth Screens and Route Subscribe to Sign Up

## Goal

Center the sign-in experience reached from protected news detail pages and center the Clerk UI within both auth screens. Remove the separate header Sign up button, and make the header Subscribe button navigate to `/sign-up`.

## Skills read

- `AGENTS.md`
- `.agents/skills/clerk/SKILL.md`

## Existing code inspected

- `src/app/news/[slug]/page.tsx`: unauthenticated detail readers are redirected through Clerk's sign-in flow.
- `src/app/sign-in/[[...sign-in]]/page.tsx`: renders Clerk `SignIn` inside a centered DailyBit card.
- `src/app/sign-up/[[...sign-up]]/page.tsx`: renders Clerk `SignUp` inside a centered DailyBit card.
- `src/components/layout/site-header.tsx`: renders the Subscribe action and shared auth actions.
- `src/components/layout/auth-actions.tsx`: renders signed-out Sign in and Sign up links.
- `src/app/globals.css`: existing DailyBit layout and utility styles.

## Decisions and assumptions

1. Preserve the existing auth routes and Clerk redirect behavior.
2. Center Clerk's rendered content using a local wrapper/class rather than changing global styles or Clerk behavior.
3. Keep the Sign in action in the header; remove only the separate Sign up action.
4. Use `Link href="/sign-up"` for Subscribe so the navigation is server-rendered and works without client state.
5. Treat the newsletter Subscribe button on the news detail page as unrelated because the request refers to the header Subscribe action next to auth controls.

## Files likely to change

- `src/app/sign-in/[[...sign-in]]/page.tsx`
- `src/app/sign-up/[[...sign-up]]/page.tsx`
- `src/components/layout/site-header.tsx`
- `src/components/layout/auth-actions.tsx`

## Implementation requirements

1. Add centering styles to the auth screen's Clerk wrapper so the sign-in and sign-up controls are centered within their card on desktop and mobile.
2. Keep the outer card and existing responsive sizing intact.
3. Change the header Subscribe link destination from `#` to `/sign-up`.
4. Remove the signed-out Sign up link from `AuthActions` while retaining Sign in and signed-in `UserButton` behavior.
5. Avoid unrelated layout, typography, or authentication changes.

## Security requirements

- Do not expose secrets or add client-side authentication logic.
- Continue using Clerk's existing route components and server/client boundaries.
- Do not change protected article access behavior.

## Acceptance criteria

- [ ] The sign-in Clerk UI is visually centered within the sign-in screen card.
- [ ] The sign-up Clerk UI is visually centered within the sign-up screen card.
- [ ] The header no longer displays a separate Sign up button.
- [ ] Clicking header Subscribe navigates to `/sign-up`.
- [ ] Header Sign in and signed-in user controls still render as before.
- [ ] `npm run typecheck` passes.
- [ ] `npm run lint` passes.

## Checks to run

1. `npm run typecheck`
2. `npm run lint`

## Exact manual test steps

1. Run `npm run dev`.
2. Open `/sign-in` and confirm the Clerk sign-in control is centered inside the DailyBit card.
3. Open `/sign-up` and confirm the Clerk sign-up control is centered inside the DailyBit card.
4. From any page, click header Subscribe and confirm the browser navigates to `/sign-up`.
5. Confirm the header shows Sign in but no separate Sign up button while signed out.
6. Open a protected `/news/<slug>` route while signed out and confirm the sign-in experience is centered.