# Evidence Noir Director's Cut V4 QA

Date: 2026-07-13

## Scope

- Mobile second-scene composition and portrait sizing.
- Scene-cut alignment without previous-scene residue.
- Mobile horizontal principle and capability reels.
- Auto-hiding mobile chapter rail.
- Desktop proof-count clearance from the fixed chapter rail.
- Existing project dossier and Evidence Room interaction contracts.

## Results

- Evidence validation: PASS (`42` records, `24` capabilities, `12` principles, `11` projects, `53` protocol steps).
- Release build: PASS (`25` files, approximately `1.13 MiB`).
- Playwright browser QA: `100/100` checks passed.
- Canonical public-origin Playwright QA after final deployment: `100/100` checks passed.
- Public `index.html`, `styles.css`, and `script.js` matched the local release by SHA-256.
- Internal profile route returned `404`; required security headers were present.
- Lighthouse mobile: Performance `98`, Accessibility `100`, Best Practices `100`, SEO `100`; LCP `2.36s`, TBT `50ms`, CLS `0`.
- Lighthouse desktop: Performance `99`, Accessibility `100`, Best Practices `100`, SEO `100`; LCP `0.92s`, TBT `0ms`, CLS `0`.

The first mobile Lighthouse process produced a valid JSON report but returned a Windows temporary-directory cleanup `EPERM`; the final desktop process exited normally. Report validity and scores were verified by parsing the generated JSON with Node.js.
