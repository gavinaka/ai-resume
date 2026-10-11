# Public Content Review

Last updated: 2026-07-11

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
- Public images are checked for GPS, camera make/model, author, date, owner, serial number, software and user-comment EXIF fields.
- Text release is blocked by phone-number, email, local-path, credential, private-network, active-network API and browser-storage patterns.
- Final 2026-07-11 release passed syntax, evidence-reference, desktop/mobile interaction, overflow, console, third-party request and security-header checks.
- Approved public origin: `https://akagavin-evidence-noir.pages.dev/`.
