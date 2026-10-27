# Changelog

All notable changes to Recipe Scaler are listed here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/).

## [1.1.0] - 2026-10-27

### Added
- Hands-free voice control in cook mode: say "next", "back", "repeat", "start timer", "pause timer", or "exit". Uses the browser's built-in Web Speech API, so there is no API key or cost, and the site never stores what you say.
- Steps are read aloud when you move between them or say "repeat".
- Live "Heard" feedback while you speak, and clear messages when the microphone is blocked, missing, silent, or offline.

### Fixed
- Voice commands no longer get ignored in Chrome, which can leave its "still speaking" flag stuck on.
- The service worker test now passes when the site is built under a base path, as on GitHub Pages.
- A timing race in the voice end-to-end tests on slower CI machines.

### Quality
- 135 unit and component tests and 17 end-to-end tests, including spoken commands through a simulated microphone and an accessibility scan of voice mode in light and dark themes.

## [1.0.0] - 2026-10-26

### Added
- Recipe pages with serving-size scaling that keeps amounts readable (1.5 cups shows as 1½ cups).
- US and metric units, with flour, sugar, and butter shown by weight in metric.
- Step-by-step cook mode with timers that keeps the screen awake.
- "Out of it?" ingredient substitutions for common ingredients.
- Shopping list that combines ingredients across recipes, with check-off and copy.
- Saved recipes page and a print-friendly recipe view.
- Offline support: installable on a phone, and opened recipes work without internet.
- Optional Google Analytics 4 events and an A/B test of the cook-mode button, respecting Do Not Track and Global Privacy Control.
- Search by name, cuisine, tag, or ingredient.
- SEO: pre-rendered pages, recipe structured data, canonical URLs, sitemap, and robots.txt.

### Quality
- 92 unit and component tests (Vitest, React Testing Library) and 15 end-to-end tests (Playwright).
- axe-core accessibility checks on every page; Lighthouse CI budgets on every pull request.
- Automatic deploys to GitHub Pages from `main`.

[1.1.0]: https://github.com/Abhirup-code/Recipe_Scaler/releases/tag/v1.1.0
[1.0.0]: https://github.com/Abhirup-code/Recipe_Scaler/releases/tag/v1.0.0
