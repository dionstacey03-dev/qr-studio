# Security Policy

## Supported versions

Security fixes are applied to the actively maintained default branch and current V2 development branch.

## Reporting a vulnerability

Please do not publish exploit details in a public issue. Contact the repository owner privately through GitHub's security reporting feature where available.

## QR safety boundaries

- Treat QR payloads, imported history, uploaded files and externally supplied URLs as untrusted input.
- URL-mode destinations should use HTTP or HTTPS. Other QR payload types (such as `mailto:`, `tel:` and Wi-Fi configuration strings) are separate explicit content types.
- Scanned URLs must be displayed for review and must never be opened automatically without a deliberate user action.
- Logo uploads are limited to PNG, JPEG and WebP raster formats with a strict size cap. SVG uploads are not accepted from users.
- Never inject imported SVG or user-controlled markup into the application DOM.
- Static QR generation is local-first. Dynamic redirect campaigns and scan analytics require a persistent backend; browser-local records are not authoritative cross-device analytics.
- Avoid collecting precise location, full IP addresses or unnecessary device identifiers in scan telemetry. Publish retention and privacy details before enabling server-side analytics.
