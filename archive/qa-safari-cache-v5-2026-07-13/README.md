# Evidence Noir V5 Safari and Cache QA

Date: 2026-07-13

## Root Cause

- The iPhone screenshot matched the old intrinsic `1200px` portrait height and portrait-first DOM rendering.
- Public CSS previously used the unchanged `styles.css` URL with a one-hour cache lifetime.
- The mobile layout also depended on `display: contents` and cross-level `order`, leaving a Safari compatibility risk.

## Fix

- Physical mobile reading order: intro, portrait, identity facts.
- Explicit desktop Grid Areas preserve the left-image/right-copy composition.
- Release builds inject a 12-character SHA-256 query fingerprint into every CSS/JS reference.
- HTML is non-persistent; fingerprinted CSS/JS is immutable.

## Verification

- Release validation: PASS (`42` evidence records, `24` capabilities, `12` principles, `11` projects, `53` protocol steps).
- Chromium local Playwright: `111/111`.
- WebKit 26.5 local Playwright: `111/111`.
- Chromium canonical-origin Playwright: `113/113`.
- WebKit 26.5 canonical-origin Playwright: `113/113`.
- Mobile Lighthouse: Performance `99`, Accessibility `100`, Best Practices `100`, SEO `100`; LCP `2.1s`, TBT `51ms`, CLS `0`.
- Public HTML cache: `no-store, no-cache, must-revalidate, max-age=0`.
- Public fingerprinted CSS cache: `public, max-age=31536000, immutable`.
- Public stylesheet reference and SHA-256 content match the local release.

The Lighthouse report was valid and parsed successfully. Its process returned the known Windows temporary-directory cleanup exit after report generation.
