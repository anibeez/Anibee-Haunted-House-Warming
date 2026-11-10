# Z-Sibs Secret Santa

A static, single-page Christmas site for six siblings. Open `index.html` directly or preview with `python3 -m http.server`. No build step, backend, database, login, or package installation is required.

## Update wishlists

Open `wishlists.js`. For each sibling, paste a public URL between the quotes after `amazon:` or `other:`. Example: `amazon: "https://www.amazon.com/hz/wishlist/ls/…"`. Leave unavailable URLs as empty strings. Gift ideas can be added to `gifts` as `{ name: "Gift idea", url: "https://…", note: "Size medium" }`. Add optional text in `notes`. The cards and working buttons are generated from this one file; empty URLs never produce dead buttons.

The countdown targets midnight at the start of December 26, 2026 in America/New_York. The static site stores no private Secret Santa assignments.

## Hosting

This remains a plain static site and needs only the existing host to serve the repository files. No AWS configuration is required by the site. The repository contains no AWS deployment workflow or hosting configuration to validate; the external deployment arrangement was not changed.
