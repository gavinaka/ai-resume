# Public Content Review

Last updated: 2026-07-13

## Approved Public Layers

- Stable public identity and broad B2B SaaS operating context.
- Decision principles, capability definitions, method steps, failure modes, and trade-offs.
- Seven-Agent ownership, read-only boundaries, governance contracts, and public-safe architecture.
- De-identified engineering incidents, root causes, repairs, tests, and lessons.
- Static personal-site implementation and release verification.

## Redacted or Generalized

- Employer names are removed from the public evidence atlas.
- Exact tenure is expressed as long-term experience unless explicitly approved elsewhere.
- Specific activity cities are removed from public files; only a cross-region information perspective is retained.
- Trading rules are described as evidence and risk architecture, not as actionable thresholds.
- Test counts are not frozen into public copy because they change over time; the site describes the verification surface.
- Dates are retained only for public project evolution and engineering records.

## Never Publish

- Account values, balances, positions, PnL, returns, live entry levels, scores, or trade candidates.
- Family identity, ages, dates, health, income, or household structure.
- Psychological session content, issue tracking, safety judgments, or health state.
- Employer-sensitive operations, customer records, compensation, disputes, or contracts.
- Notion IDs, page IDs, API keys, tokens, webhook secrets, local paths, environment configuration, private URLs, or raw logs.
- Runtime health snapshots presented as timeless facts.

## Review Status

- `evidence-data.js`: public-safe by construction; contains no local paths or private numeric facts.
- `01_EVIDENCE_LEDGER.md`: internal only; excluded from the release package.
- `02_PUBLIC_CONTENT_REVIEW.md`: internal only; excluded from the release package.
- Release uses an explicit file allowlist; new files under `assets/` or `pages/` are not published automatically.
- `.wrangler/`, QA reports, archives, source photos, internal Markdown and scripts are explicitly excluded from `dist/`.
- Public images are checked for GPS, camera make/model, author, date, owner, serial number, software and user-comment EXIF fields.
- Text release is blocked by phone-number, email, local-path, credential, private-network, active-network API and browser-storage patterns.
- The V4 release validator scans both the evidence atlas and the public presentation layer, including all project protocols, for sensitive patterns.
- Final 2026-07-13 local release passed syntax, schema, 100 browser checks, mobile composition gates, desktop/mobile interaction, rapid navigation, drag/zoom/focus recovery, connection geometry, overflow, console and third-party request checks.
- Final local Lighthouse scores: homepage mobile `98/100/100/100` with LCP `2.36s`, TBT `50ms`, and CLS `0`; homepage desktop `99/100/100/100` with LCP `0.92s`, TBT `0ms`, and CLS `0`.
- Final canonical-origin Playwright verification passed `100/100` checks after deployment; public `index.html`, `styles.css`, and `script.js` hashes matched the local release byte-for-byte.
- The internal profile document returns `404` from the public origin; CSP, `nosniff`, same-origin framing, referrer and permissions headers are active.
- V5 removes Safari-sensitive `display: contents` ordering from the identity scene and uses physical DOM reading order plus explicit desktop Grid Areas.
- Release HTML now receives automatic 12-character SHA-256 fingerprints for every CSS/JS reference; HTML uses `no-store` and fingerprinted assets use immutable caching.
- V5 local Chromium and WebKit suites each passed `111/111` checks. Mobile Lighthouse scored `99/100/100/100` with LCP `2.1s`, TBT `51ms`, and CLS `0`.
- V5 canonical-origin Chromium and WebKit suites each passed `113/113` checks. Public HTML references the local release fingerprint, the remote stylesheet hash matches the release byte-for-byte, and the cache headers are active.
- Approved public origin: `https://akagavin-evidence-noir.pages.dev/`.
