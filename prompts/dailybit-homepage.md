# DailyBit Homepage Implementation

## Goal

Replace the current design-system showcase on `/` with the DailyBit homepage shown in `c:/Users/DELL/Downloads/02-homepage.png`.

Match the reference structure and visual hierarchy:

- top utility bar
- main navigation bar
- horizontal topic chips row
- `Top News` card grid
- dark footer

Use the existing DailyBit brand, not Biasly. Keep the homepage mock-data driven for now so the UI can later be swapped to real Supabase data without redesigning the page.

## Skills read

- `node_modules/next/dist/docs/01-app/index.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/02-components/link.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md`
- `src/components/*` and `src/lib/*` files in this repo

## Existing code inspected

| File | State |
|------|-------|
| `src/app/page.tsx` | Design-system showcase using two sample cards, not the production homepage |
| `src/app/layout.tsx` | Minimal metadata, global header/footer, Poppins font |
| `src/app/globals.css` | DailyBit design tokens, typography utilities, container |
| `src/components/layout/site-header.tsx` | Simple brand header with menu/search only |
| `src/components/layout/site-footer.tsx` | Minimal footer |
| `src/components/ui/news-card.tsx` | Supports list and grid variants, grid already close to homepage card shape |
| `src/components/ui/bias-meter.tsx` | Supports compact and labeled bias display |
| `src/components/icons/index.tsx` | Core icons only, missing several header/footer icons |
| `src/lib/home/mock-articles.ts` | 12 mock homepage articles shaped for future data wiring |
| `src/lib/seo/json-ld.ts` | Homepage JSON-LD helpers |

## Decisions and assumptions

1. Keep the homepage mock-data driven in this pass. No Supabase, Clerk, scraping, or AI calls.
2. Reuse existing `NewsCard` and `BiasMeter` components where possible instead of building parallel one-off UI.
3. Build the page as a server-rendered App Router page with semantic sections and a single `h1`.
4. Use static placeholder links for most nav items and chips. Only the homepage root needs to be fully functional.
5. Use the screenshot as the visual reference for spacing, density, and hierarchy, but keep the app's existing token system and typography scale.
6. Ensure the layout is responsive and does not collapse awkwardly on mobile.

## Files likely to change

| File | Change |
|------|--------|
| `src/app/page.tsx` | Replace showcase with DailyBit homepage |
| `src/app/layout.tsx` | Update root metadata, `metadataBase`, OG defaults |
| `src/components/layout/site-header.tsx` | Build the 3-tier header |
| `src/components/layout/site-footer.tsx` | Build the dark multi-column footer |
| `src/components/icons/index.tsx` | Add icons for location, chevrons, and social links |
| `src/components/ui/news-card.tsx` | Adjust grid card styling if needed to match the reference more closely |
| `src/components/ui/bias-meter.tsx` | Keep labeled bias output compact and readable in cards |
| `src/lib/home/mock-articles.ts` | Use or refine the 12 mock homepage entries |
| `src/lib/seo/json-ld.ts` | Keep or refine homepage JSON-LD helpers |
| `src/app/globals.css` | Add small utility tweaks if needed for page shell styling |
| `next.config.ts` | Add remote image host patterns only if new image hosts are introduced |

## Implementation requirements

### Page structure

1. Replace the current `/` showcase with a homepage that visually matches the reference.
2. Render a utility bar at the top with:
   - `Browser Extension`
   - `Theme:` control with `Light`, `Dark`, `Auto`
   - current date text
   - `Set Location`
   - `International Edition`
3. Render a main nav row with:
   - hamburger icon
   - DailyBit logo/wordmark
   - center nav links: `Home`, `For You`, `Local`, `Blindspot`
   - right-side actions: `Subscribe`, `Login`
4. Render a horizontally scrollable topic chip row with the same style and density as the reference image.
5. Render a `Top News` section with a 3-column grid on desktop, 2-column on tablet, 1-column on mobile.
6. Render a dark footer with brand block, Company links, Help links, and social icons.

### Visual and interaction requirements

1. Match the screenshot's overall look: neutral light background, white cards, subtle borders, restrained shadows, and a dark footer.
2. Keep the page airy but dense enough to feel like a news homepage.
3. Card images should be top-aligned and cropped with a consistent 16:10 feel.
4. Card titles should be bold and clamp to avoid layout breakage.
5. The labeled bias meter should show left/center/right percentages inside the colored segments.
6. Use accessible `aria-label`s for the bias meter and icon buttons.
7. Keep the utility bar, nav, and chips visually separated with borders and background shifts similar to the reference.
8. On mobile, collapse the nav appropriately and preserve usability rather than forcing the desktop arrangement.

### Metadata and SEO

1. Set root metadata in `src/app/layout.tsx`.
2. Include:
   - title template or absolute homepage title
   - description
   - keywords
   - open graph data
   - Twitter card data
   - canonical URL for `/`
   - `metadataBase` from `NEXT_PUBLIC_SITE_URL` with a fallback of `https://dailybit.com`
3. Add JSON-LD helpers from `src/lib/seo/json-ld.ts` to the homepage if needed.
4. Use semantic landmarks: `header`, `nav`, `main`, `section`, `article`, `footer`.
5. Keep `next/image` usage valid for remote URLs and set `sizes` carefully for responsive grids.

### Data shape

1. Keep article data in a reusable mock structure so it can later be replaced by Supabase rows without changing the presentation layer.
2. Each article card should have:
   - id
   - slug
   - title
   - image URL
   - image alt
   - category
   - region
   - left, center, right percentages
   - source name
   - published date
3. The homepage should render 12 cards.
4. The data should remain static in this pass.

### Component behavior

1. Preserve the existing reusable `NewsCard` and `BiasMeter` components if they already match the design well enough.
2. Only change them if necessary to get the homepage layout to match the reference image.
3. Keep interactive affordances presentational only for now. Do not wire navigation or filters to live data.
4. Do not introduce new backend routes or mutations.

## Security requirements

- Do not expose any secrets in client code.
- Do not add browser-side scraping, AI, or Supabase logic.
- Do not require new environment variables beyond optional `NEXT_PUBLIC_SITE_URL`.

## Acceptance criteria

- [ ] `/` no longer shows the design-system showcase
- [ ] The page matches the provided reference structure and feel
- [ ] Brand reads `DailyBit` everywhere
- [ ] Utility bar, nav, topic chips, top news cards, and footer are present
- [ ] `Top News` renders 12 mock cards
- [ ] Cards display image, meta, title, source, and labeled bias meter
- [ ] The page is responsive at mobile, tablet, and desktop widths
- [ ] Metadata includes title, description, open graph, Twitter, and canonical URL
- [ ] `next/image` and `next/link` are used appropriately
- [ ] `npm run lint` passes
- [ ] `npm run build` passes

## Checks to run

- `npm run lint`
- `npm run build`

## Manual test steps

1. Run `npm run dev`
2. Open `http://localhost:3000`
3. Verify the top utility bar, main nav, topic chips, `Top News` section, and dark footer
4. Verify there are 12 cards in the grid
5. Verify the cards use the grid variant with image on top and labeled bias bars
6. Resize the viewport to mobile width and confirm the layout stays readable and scrollable
7. Check page source for metadata tags and canonical URL
8. Confirm no console or build errors appear in the dev server terminal
