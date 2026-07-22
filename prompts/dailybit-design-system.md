# DailyBit Design System Implementation

## Goal

Implement the DailyBit app design system from the attached UI reference as reusable Tailwind v4 tokens and shadcn-style UI primitives. Brand name is **DailyBit** (not Biasly). Tagline: **Balanced news coverage, powered by AI.**

This pass establishes the visual foundation only — no Supabase data wiring, scraping, or auth UI beyond layout shell.

## Skills read

- `node_modules/next/dist/docs/` (Next.js app layout, fonts, CSS)
- Existing project patterns (Tailwind v4 `@theme inline`, Biome)

## Existing code inspected

- `src/app/layout.tsx` — Geist fonts, placeholder metadata
- `src/app/globals.css` — minimal Tailwind v4 setup with dark-mode defaults (to be replaced with light-only DailyBit tokens)
- `src/app/page.tsx` — empty placeholder
- No `components/` directory yet
- Tailwind v4 via `@import "tailwindcss"` and `@theme inline`

## Decisions and assumptions

1. **Light theme only** for v1 — the reference is light; remove `prefers-color-scheme: dark` overrides.
2. **Poppins** via `next/font/google` replaces Geist as the primary sans font.
3. **Design tokens** live in `globals.css` as CSS custom properties mapped into Tailwind `@theme inline` so components use semantic classes (`text-primary`, `bg-surface`, `text-bias-left`, etc.).
4. **Component library** under `src/components/ui/` with typed React components matching the reference:
   - `Button` — primary, secondary, text variants + hover/disabled states
   - `Chip` — category pill with optional `+` affordance
   - `BiasMeter` — horizontal segmented bar (left/center/right percentages)
   - `NewsCard` — horizontal card layout from reference (image left, content right)
5. **Layout shell** — `SiteHeader` and `SiteFooter` with DailyBit branding; container max-width 1280px, 24px horizontal padding.
6. **Showcase home page** — temporary design-system preview on `/` demonstrating typography scale, buttons, chips, bias meter, and a sample news card using mock data (UI displays stored data only in production; mock is acceptable for design-system verification).
7. **Icons** — inline SVG components with 2px stroke, rounded caps (lucide-style minimal set: clock, bookmark, menu, search as needed by card/header).
8. **No shadcn CLI install** — hand-roll minimal components to avoid scope creep; match reference styling directly.

## Files likely to change

| File | Change |
|------|--------|
| `src/app/globals.css` | Full design token system |
| `src/app/layout.tsx` | Poppins font, DailyBit metadata, base body classes |
| `src/app/page.tsx` | Design system showcase / sample home layout |
| `src/components/ui/button.tsx` | New |
| `src/components/ui/chip.tsx` | New |
| `src/components/ui/bias-meter.tsx` | New |
| `src/components/ui/news-card.tsx` | New |
| `src/components/layout/site-header.tsx` | New |
| `src/components/layout/site-footer.tsx` | New |
| `src/components/icons/index.tsx` | New shared SVG icons |
| `src/lib/utils.ts` | New `cn()` helper for class merging |

## Design tokens (from reference)

### Colors

| Token | Hex |
|-------|-----|
| text-primary | `#0D0D0F` |
| text-secondary | `#6B7280` |
| surface | `#F6F6F6` |
| bias-left | `#B42318` |
| bias-center | `#E5E7EB` |
| bias-right | `#1D4ED8` |
| bg-primary | `#FFFFFF` |
| bg-secondary | `#F0F0F0` |
| border | `#E5E7EB` |
| divider | `#E5E7EB` |

### Typography (Poppins)

| Style | Size | Weight | Line height |
|-------|------|--------|-------------|
| H1 | 32px | 700 | 1.2 |
| H2 | 24px | 600 | 1.3 |
| H3 | 20px | 600 | 1.3 |
| H4 | 16px | 500 | 1.4 |
| Body Large | 16px | 400 | 1.6 |
| Body Medium | 14px | 400 | 1.6 |
| Body Small | 13px | 400 | 1.6 |
| Caption | 11px | 400 | 1.4 |

### Spacing (4px base)

4, 8, 16, 24, 32, 40, 64

### Layout

- Container: 1280px max-width
- Grid: 12 columns, 24px gutter, 24px margin

### Shadows

- sm: `0 1px 2px rgba(0,0,0,0.05)`
- md: `0 4px 12px rgba(0,0,0,0.08)`
- lg: `0 12px 24px rgba(0,0,0,0.12)`

### Border radius

- sm: 4px, md: 8px, lg: 12px, full: 9999px

## Implementation requirements

1. Map all tokens into `@theme inline` for Tailwind utility usage.
2. Add typography utility classes or component-level styles matching the scale exactly.
3. `BiasMeter` accepts `leftPercentage`, `centerPercentage`, `rightPercentage` (0–100, must sum to 100) and optional compact mode for cards.
4. `NewsCard` matches reference layout: rounded image, caption meta line, H3 title, body small summary, compact bias meter, footer row with time/bookmark/read time.
5. Buttons match reference: primary (black bg, white text), secondary (white bg, border), text variant.
6. Header shows **DailyBit** wordmark and tagline; footer shows branding + "Design System v1.0" style minimal footer line.
7. Responsive: cards stack vertically on small screens; container padding preserved.

## Security requirements

- No secrets or env changes.
- Mock data only on showcase page; no API calls.

## Acceptance criteria

- [ ] App uses Poppins and DailyBit branding everywhere (no Biasly, no Geist)
- [ ] CSS tokens match reference hex values
- [ ] Typography scale visible on home page
- [ ] Button, Chip, BiasMeter, NewsCard components render per reference
- [ ] Container width 1280px with correct spacing
- [ ] `npm run lint` passes

## Checks to run

- `npm run lint`
- `npm run build` (layout/fonts/components changed)

## Manual test steps

1. Run `npm run dev`
2. Open `http://localhost:3000`
3. Confirm header reads **DailyBit** with tagline
4. Verify color swatches / typography / buttons / chips / bias meter / sample news card match the UI reference
5. Resize to mobile width — card and layout remain readable
