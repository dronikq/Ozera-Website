# Ozera Traffic Optimization

- Date: 2026-05-24
- Commit: `fdddc59`
- Scenario: production-like crawl of home, catalog, lake detail pages, map interactions, SEO pages, plus gallery thumb clicks and scheme-viewer interaction on detail pages.

## Baseline

The baseline audit file used an older guessed byte model, so it is useful as a historical reference but not as a strict transfer-vs-resource comparison.

- Cold: transfer `3.62 MB`, resource `62.63 MB`
- Cold images: transfer `2.15 MB`, resource `44.97 MB`
- Cold Supabase Storage: resource `28.02 MB`
- Warm: transfer `0.68 MB`, resource `46.58 MB`
- Warm images: transfer `0.00 MB`

Variant counts at the P0 checkpoint:

- `original`: `0`
- `medium`: cold `103`, warm `104`
- `thumb`: cold `214`, warm `212`
- `legacy`: `0`
- `placeholders`: `6`

## After P0

P0 fixed the image-variant regression. The remaining waste was dominated by the local hero asset, raw external scheme images, and a long tail of Supabase medium/detail/gallery images.

Known P0 checkpoint numbers from the audit summary:

- Cold transfer: `3.62 MB`
- Cold resource: `62.63 MB`
- Cold images transfer/resource: `2.15 MB` / `44.97 MB`
- Cold Supabase Storage resource: `28.02 MB`
- Warm transfer: `0.68 MB`
- Warm images transfer: `0.00 MB`

## After Stage 3

Current snapshot: [`tmp/traffic-audit-after-stage3.json`](/Users/qa/Desktop/Projects/Ozera-Website/tmp/traffic-audit-after-stage3.json)

- Cold transfer: `0.97 MB`
- Cold resource: `34.45 MB`
- Cold images transfer/resource: `0.39 MB` / `22.46 MB`
- Cold Supabase Storage resource: `17.85 MB`
- Warm transfer: `0.21 MB`
- Warm resource: `34.72 MB`
- Warm images transfer/resource: `0.00 MB` / `22.71 MB`
- Warm Supabase Storage resource: `17.80 MB`

Variant counts after Stage 3:

- `original`: `0`
- `medium`: cold `37`, warm `37`
- `thumb`: cold `213`, warm `212`
- `legacy`: `0`
- `placeholders`: `6`

## After Stage 4

Current snapshot: [`tmp/traffic-audit-after-stage4.json`](/Users/qa/Desktop/Projects/Ozera-Website/tmp/traffic-audit-after-stage4.json)

- Cold transfer: `0.75 MB`
- Cold resource: `29.42 MB`
- Cold images transfer/resource: `0.39 MB` / `19.59 MB`
- Cold Supabase Storage resource: `15.98 MB`
- Warm transfer: `0.02 MB`
- Warm resource: `2.95 MB`
- Warm images transfer/resource: `0.00 MB` / `2.26 MB`
- Warm Supabase Storage resource: `1.88 MB`

Variant counts after Stage 4:

- `original`: `0`
- `medium`: cold `37`, warm `0`
- `thumb`: cold `180`, warm `34`
- `legacy`: `0`
- `placeholders`: `6`

## Stage 4 Changes

- Map popups now start as placeholder cards and inject the preview image only on `popupopen`, so initial map load no longer emits lake photo requests.
- Map bottom cards now stay placeholder-only until the lake is explicitly selected.
- Scheme viewer now renders a lightweight button first and mounts the external scheme image only after the user clicks it.
- The audit threshold for initial map images was tightened to `<= 2`, which now passes with `0`.

## Stage 5A Plan

- Keep the existing `public.lakes.scheme_image_url` field for the MVP instead of introducing a new schema variant.
- Replace external PNG/JPG scheme URLs with optimized Supabase Storage WebP objects, using immutable hashed paths.
- Use a dry-run-first migration script so the current savings and regressions are visible before any write is allowed.
- Leave all source URLs intact; this pass only changes the destination URL stored in the database.

## What Changed

- Replaced the local hero background reference with an optimized WebP asset at [`public/fishing-hero.webp`](/Users/qa/Desktop/Projects/Ozera-Website/public/fishing-hero.webp), and removed the production UI reference to the 1.76 MB PNG.
- Deferred lake scheme image loading until the user explicitly opens the scheme viewer, instead of loading the raw external PNG on page render.
- Kept gallery rendering to a single active medium image while thumbnails continue to use thumb-sized sources.
- Extended the traffic audit with route-group and phase breakdowns, plus top-20 views by resource, transfer, Supabase medium, external images, and local assets.
- Added a bundle-analysis entry point via `npm run analyze` using the Next 16 Turbopack analyzer, so route-level bundle graphs can be inspected without changing production behavior.

## What Remained

- The largest remaining offenders are still external scheme/source PNGs on third-party hosts:
  - `vovkoveozero.com.ua` plan PNG at about `1.02 MB`
  - `ozero-korolek.kiev.ua` PNG at about `0.80 MB`
- Supabase medium images remain the main remaining internal image cost, but the medium count is now down to `37` cold / `0` warm in this audit shape.
- The cold audit no longer flags the map view for loading too many images initially.

## Stage 5A Commands

- Dry run: `SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run scheme:audit`
- Apply after approval: `SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run scheme:migrate`

## Stage 5A Expected Savings

- Current audit still shows roughly `1.02 MB` + `0.80 MB` of external scheme offenders, so the MVP should recover about `1.82 MB` before accounting for any WebP compression gains on the destination objects.
- The migration reuses `scheme_image_url`, so the rendering path stays unchanged while the storage backend becomes optimized.

## Top Offenders Removed

- The local `/fishing-hero.jpg.png` no longer appears as a top offender in the Stage 3 audit.
- `original` and `legacy` image variants remain at `0`.
- Gallery cards remain thumb-only in the audit snapshot.
- Map initial image requests dropped from `16` flagged requests in Stage 3 to `0` in Stage 4.
- Scheme images no longer load during the initial detail render; they only mount after the user opens the scheme viewer.

## Measurement Notes

- The baseline audit used an older guessed byte model, so direct baseline-to-Stage-3 transfer comparisons are intentionally treated as approximate.
- The later audits separate transfer bytes and resource bytes.
- Cross-origin `PerformanceResourceTiming.transferSize` is often unavailable, so transfer deltas for remote resources are incomplete by design.
- The warm scenario in Stage 4 does not visit detail pages, so its low image totals are expected and should be read as a map/catalog/home/SEO warm pass, not a detail-page warm replay.

## Acceptance Checklist

- [x] `original` remains `0`
- [x] `legacy` remains `0`
- [x] `thumb` remains `> 0`
- [x] Cards remain thumb-only
- [x] Local hero PNG is no longer a production UI dependency
- [x] Scheme images do not load on initial detail-page render
- [x] Gallery does not preload all medium images
- [x] Warm image transfer remains near `0`
- [x] Build passes

## Artifacts

- Stage 3 audit: [`tmp/traffic-audit-after-stage3.json`](/Users/qa/Desktop/Projects/Ozera-Website/tmp/traffic-audit-after-stage3.json)
- Stage 3 compare (baseline vs Stage 3): [`tmp/traffic-optimization-report-stage3.json`](/Users/qa/Desktop/Projects/Ozera-Website/tmp/traffic-optimization-report-stage3.json)
- Stage 3 compare (after P0 vs Stage 3): [`tmp/traffic-optimization-report-after-vs-stage3.json`](/Users/qa/Desktop/Projects/Ozera-Website/tmp/traffic-optimization-report-after-vs-stage3.json)
