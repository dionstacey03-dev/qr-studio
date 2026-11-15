# QR Studio V2 — Technical Audit & Upgrade Plan

Audit baseline: `main` at `b33aca68a98da86ce837df80e5b2b0e7042630a5`.

## Confirmed findings

### High priority
- Analytics state is seeded with three example campaigns and 60 synthetic click events. This makes the dashboard appear to report real scans when it is showing fabricated demo data.
- Dynamic redirect handling reads tracked links from browser localStorage. A QR code scanned by another browser/device cannot resolve that browser-local record.
- Unknown redirect IDs currently fall back to `https://apple.com`, an unrelated destination. V2 removes this fallback and treats unresolved IDs as unavailable.
- Click tracking is client-side only. It cannot provide trustworthy cross-device analytics, unique visitors, or server-side event integrity.

### Security and data integrity
- QR URL payloads need strict URL parsing and explicit HTTP(S) rules before creating tracked redirects or offering external navigation.
- Logo uploads accept broad image MIME types, including SVG. V2 should validate file signatures/type, cap file size and dimensions, and sanitize SVG before embedding it.
- SVG export interpolates the logo data URL into SVG markup. Keep generated attributes constrained and never inject arbitrary SVG markup into the DOM.
- History import accepts loosely shaped objects. Add schema validation, bounded entry counts, field-length limits, and safe data URL handling.
- Storage reads should validate parsed shapes, not only catch JSON parse errors; browser storage writes should handle quota errors.

### Product and maintainability
- Package metadata is still `react-example` / `0.0.0`.
- README lists JavaScript/CSS while the repository is TypeScript with Tailwind CSS.
- The project has substantial features already (generator, templates, scanner, bulk export, history and a local analytics screen); V2 should strengthen the architecture instead of rebuilding them unnecessarily.
- Verify actual usage of Gemini, Express and dotenv; remove unused runtime dependencies and do not expose server-only secrets in a Vite client bundle.

## V2 architecture decisions

1. Preserve static QR generation as a local, privacy-first feature.
2. Keep bulk generation and ZIP export client-side, with input/file limits and progress feedback.
3. Separate static QR history from dynamic redirect campaigns.
4. Implement dynamic links only after a persistent redirect API and database are configured. Never label local simulations as live analytics.
5. Build analytics from server-recorded redirect events, with privacy-conscious aggregation and retention.
6. Provide robust QR safety: destination preview, HTTP(S) validation for URL mode, explicit user action before opening scanned URLs, and SVG/logo sanitization.
7. Maintain responsive Apple-inspired visual design, reduced-motion support, keyboard accessibility, and clear empty/loading/error states.

## Delivery checklist

- [x] Create isolated `upgrade/qr-studio-v2` branch.
- [x] Remove fabricated analytics seed data.
- [x] Remove synthetic device-chart values and manual test-scan inflation.
- [x] Label browser-local campaign analytics accurately as a prototype.
- [x] Remove unrelated fallback redirect and validate redirect protocol.
- [x] Correct package identity/version.
- [ ] Complete component-by-component security and performance review.
- [x] Add GitHub Actions CI for frozen Bun install, TypeScript check and production build (first run pending).
- [ ] Add automated unit/component tests and verify a passing production build.
- [x] Restrict uploaded logos to bounded PNG/JPEG/WebP files and reject SVG uploads.
- [x] Restrict scanner uploads to PNG/JPEG/WebP with file-size and pixel-count limits.
- [x] Bound and schema-check imported QR history; discard unsafe imported logo/preview data URLs.
- [ ] Harden remaining QR URL handling and export lifecycle.
- [ ] Implement persistent dynamic links and analytics backend (awaiting provider choice).
- [x] Lazy-load workspace modules; reduce initial JS entry chunk from 1,051.93 kB to 285.07 kB (Vercel build output).
- [ ] Refine dashboard, generator, scanner, bulk tools and mobile interactions.
- [ ] Refresh README, screenshots, accessibility notes and deployment instructions.
- [x] Deploy Vercel preview and verify TypeScript check + production build.
- [ ] Perform browser/device QA, then promote to production after approval.
