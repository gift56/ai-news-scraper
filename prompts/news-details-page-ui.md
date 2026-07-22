# DailyBit News Details Page Implementation

## Goal

Implement the DailyBit news details page to match the attached reference image `c:/Users/DELL/Downloads/03-news-details-page.png`.

The page should feel like a polished editorial article view with:

- a strong article hero column on the left
- a fixed-width analysis sidebar on the right
- a related stories grid near the bottom
- a newsletter subscribe strip above the footer
- the existing DailyBit header and dark footer preserved

This is a UI implementation pass only. Use stored/mock article data already in the app or a local article-detail data source as needed. Do not add scraping, analysis, or backend mutation logic.

## Skills read

- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/dynamic-routes.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/layout.md`
- `src/app/page.tsx`
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/components/layout/site-header.tsx`
- `src/components/layout/site-footer.tsx`
- `src/components/ui/news-card.tsx`
- `src/components/ui/bias-meter.tsx`
- `src/components/icons/index.tsx`
- `src/lib/home/mock-articles.ts`
- `src/lib/seo/json-ld.ts`

## Existing code inspected

| File | State |
|------|-------|
| `src/app/page.tsx` | Homepage renders mock DailyBit cards with `NewsCard` and JSON-LD helpers |
| `src/app/layout.tsx` | Root layout already mounts shared header/footer and metadata base |
| `src/app/globals.css` | DailyBit token set, layout container, and typography utilities are already defined |
| `src/components/layout/site-header.tsx` | Existing multi-row DailyBit header, close to the reference brand shell |
| `src/components/layout/site-footer.tsx` | Existing dark footer already matches the editorial site direction |
| `src/components/ui/news-card.tsx` | Reusable cards exist, but the detail page will likely need a separate related-story card treatment |
| `src/components/ui/bias-meter.tsx` | Reusable bias visualization exists for the left/center/right distribution blocks |
| `src/components/icons/index.tsx` | Contains the needed shared line icons and social icons |
| `src/lib/home/mock-articles.ts` | Mock article dataset with slug, title, image, metadata, and bias percentages |
| `src/lib/seo/json-ld.ts` | JSON-LD helper that can be reused or extended for article metadata |

## Decisions and assumptions

1. Implement the detail page as an App Router dynamic segment, most likely `src/app/news/[slug]/page.tsx`.
2. Keep the route as a Server Component and use `generateMetadata` for per-article title, description, and Open Graph data.
3. Reuse the existing DailyBit shell, colors, and typography tokens instead of introducing a new design system.
4. Use the existing mock article data as the content source for now if there is no server data layer in place for article details.
5. Treat the right sidebar as a visual analysis module only. It should display article analysis data but not compute it.
6. Preserve the screenshot’s editorial rhythm and hierarchy, but keep the implementation responsive and accessible.
7. Prefer reusable, small UI helpers over a single large page component if that keeps the page maintainable.

## Files likely to change

| File | Change |
|------|--------|
| `src/app/news/[slug]/page.tsx` | New dynamic article details page |
| `src/app/news/[slug]/not-found.tsx` | Optional route-level not-found state if the slug is invalid |
| `src/app/news/[slug]/loading.tsx` | Optional loading state if the route fetches article data asynchronously |
| `src/app/news/[slug]/page.tsx` | `generateMetadata` for article SEO and social metadata |
| `src/lib/home/mock-articles.ts` | Extend article mock data or add a detail-oriented article shape |
| `src/lib/seo/json-ld.ts` | Add article JSON-LD helper if useful for the details page |
| `src/components/ui/bias-meter.tsx` | Reuse as-is or lightly adjust if the sidebar bias block needs a different presentation |
| `src/components/ui/news-card.tsx` | May need a compact related-story variant or new shared card styling |
| `src/components/icons/index.tsx` | Add any missing icons for save/share/more/info actions if existing ones are insufficient |
| `src/app/globals.css` | Only if a few extra utility classes are needed for the article page spacing or sidebar blocks |

## Implementation requirements

### Route and data

1. Create a dynamic article details route that accepts a slug.
2. Resolve the slug from the existing mock article data or a new local article-detail dataset.
3. If the slug is invalid, render a proper not-found state rather than a broken page.
4. Use `generateMetadata` to set a page-specific title, description, canonical URL, and article-specific Open Graph data.
5. Keep the page server-rendered and do not move article data lookup into a client component.

### Visual interpretation

1. Match the reference’s editorial/news-site tone: light background, crisp black typography, white cards, soft borders, and restrained shadows.
2. Use a two-column layout on desktop with a wide reading column and a right sidebar that stays visually balanced with the main article.
3. On smaller screens, collapse into a single-column layout with the sidebar stacking below the article content.
4. Keep the article title large and bold, with a tight headline line-height.
5. Preserve the subtle utility spacing seen in the reference: generous top margin, measured inter-block spacing, and thin separators.
6. The hero image should be wide, rounded, and cropped consistently without awkward vertical stretching.
7. Use a calm serif-free editorial stack that stays aligned with the existing DailyBit typography tokens.

### Article header section

1. Render a category/region breadcrumb line above the title.
2. Render the headline prominently.
3. Include byline metadata underneath, such as author, date, and read time.
4. Add action affordances for save, share, and more, matching the visual weight in the reference.
5. Keep these affordances presentational unless the app already has a real action implementation.

### Main article content

1. Show the article hero image first.
2. Include a short caption or image credit line below the hero image.
3. Render a bias distribution card below the image, with the same “Left / Center / Right” visual hierarchy as the screenshot.
4. Render the article body as readable multi-paragraph text with consistent spacing and line length.
5. Keep paragraph width comfortable for reading on large screens.

### Sidebar analysis cards

1. Build a `Bias Analysis` card in the right column with:
   - section title
   - overall bias label
   - bold bias summary line such as `Right 49%`
   - supporting text about the number of balanced sources
   - left / center / right breakdown rows with mini bars
   - a short disclaimer paragraph
   - a CTA button like `How We Analyze Bias`
2. Build an `AI Summary` card below it with:
   - title
   - generated date and read-time metadata
   - concise bullet summary points
   - disclaimer text and feedback button
3. Build a `Source Breakdown` card below that with:
   - total source count
   - left / center / right distribution
   - a ranked list of sources and bias labels
   - a bottom CTA button such as `View All Sources`
4. Make the sidebar visually match the reference card stack, spacing, and density.

### Related stories section

1. Add a `Related Stories` section below the main article body.
2. Render related articles in a compact 2-column grid on desktop and a stacked/one-column pattern on mobile.
3. Each related card should include image, category/region, headline, date, and read time.
4. Keep the cards small and editorial, not homepage-card sized.
5. Reuse existing article data where possible so the related section feels native to the rest of the site.

### Newsletter strip and footer

1. Add a newsletter subscribe strip above the footer.
2. Match the reference’s full-width bordered panel, left-aligned copy, email input, and subscribe button.
3. Keep the strip responsive so the input and button stack cleanly on narrow screens.
4. Leave the existing dark footer in place unless small spacing adjustments are required.

### Responsiveness and interaction

1. The page must remain readable on mobile, tablet, laptop, and wide desktop widths.
2. Do not let the sidebar become too narrow or overlap the main article content.
3. Titles and body copy should clamp or wrap gracefully without breaking the layout.
4. Use accessible button labels and semantic landmarks.
5. Keep hover states subtle and consistent with the current DailyBit look.

### Metadata and SEO

1. Provide article-specific metadata from `generateMetadata`.
2. Include title, description, canonical URL, Open Graph fields, and Twitter fields where practical.
3. Use the existing `metadataBase` behavior from the root layout rather than hardcoding full site URLs everywhere.
4. If JSON-LD is still useful on article pages, add an article schema helper in a way that matches the existing helper pattern.

## Security requirements

- Do not expose secrets or private env vars in the browser.
- Do not add Supabase, AI, Oxylabs, or Clerk calls in the UI layer.
- Do not mutate pipeline state from the page.
- Keep all data lookup server-side or local to the mock data layer for this pass.

## Acceptance criteria

- [ ] `/news/[slug]` renders a polished article details page matching the reference’s structure and mood
- [ ] The page is server-rendered and uses the dynamic slug
- [ ] Invalid slugs resolve to a proper not-found state
- [ ] The left reading column, right analysis sidebar, related stories, subscribe strip, and footer are present
- [ ] The page is responsive and does not break on mobile widths
- [ ] `generateMetadata` returns article-specific metadata
- [ ] Existing DailyBit header/footer and visual tokens are preserved
- [ ] No backend, scraping, or AI mutation logic is introduced
- [ ] `npm run lint` passes
- [ ] `npm run build` passes

## Checks to run

- `npm run lint`
- `npm run build`

## Manual test steps

1. Run `npm run dev`
2. Open the news details route for a valid slug, for example `/news/trump-iran-revised-peace-proposal`
3. Verify the page structure matches the reference: headline, hero image, bias distribution card, body copy, analysis sidebar, related stories, newsletter strip, and footer
4. Confirm the byline, date, read time, and action controls are present
5. Resize the browser down to tablet and mobile widths and verify the sidebar stacks cleanly below the article
6. Open a non-existent slug and confirm the route shows a not-found state
7. Inspect page metadata in the browser devtools and confirm the title and OG fields are article-specific
8. Watch the dev server terminal for build/runtime warnings while loading the page
