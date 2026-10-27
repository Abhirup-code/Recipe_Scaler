# Security policy

## Reporting a vulnerability

Please report security issues privately through GitHub's
[private vulnerability reporting](https://github.com/Abhirup-code/Recipe_Scaler/security/advisories/new)
rather than a public issue. I aim to reply within a week and will credit you in the fix unless you prefer otherwise.

## Supported versions

Only the latest release, deployed at https://abhirup-code.github.io/Recipe_Scaler/, receives fixes.

## How the project is protected

- **No server and no accounts.** The site is static HTML on GitHub Pages. Saved recipes, the pantry, imported
  recipes, and the shopping list are kept in your browser's local storage and never leave your device.
- **Untrusted input is validated.** Pasted recipes are length-capped and parsed as plain text; React escapes
  everything it renders. Data read back from local storage and from shared links is checked before use, and
  anything malformed or out of range is ignored. Recipe structured data is escaped against script injection.
- **Voice.** Hands-free mode uses the browser's built-in speech recognition. The site never records or stores
  audio or transcripts.
- **Privacy-respecting analytics.** Optional, off unless configured, and never on for visitors with Do Not Track or
  Global Privacy Control.
- **Supply chain.** Dependencies are locked in `package-lock.json` and checked by Dependabot, `npm audit`, and
  `npm audit signatures`. Every GitHub Action is pinned to a full commit hash, and workflows default to read-only
  permissions.
- **Automated scanning** on every push and pull request: CodeQL (TypeScript and workflow code), gitleaks (the full
  git history), and OpenSSF Scorecard.
