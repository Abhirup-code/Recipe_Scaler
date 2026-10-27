# Changelog

All notable changes to Recipe Scaler are listed here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/).

## [1.2.0] - 2026-10-27

### Added
- Scale to what you have: pick an ingredient, enter how much you have (in any matching unit, or by weight for ingredients measured in cups), and the whole recipe rescales around it, showing about how many servings it makes.
- What can I cook? A new Pantry page where you tick what is in your kitchen. Recipes you can make right now come first, then the closest ones, each showing exactly what is missing with a one-tap add to the shopping list.
- The shopping list moves things already in your pantry into an "Already in your kitchen" section, left out when you copy the list.
- Pantry link in the header and on the home page; the pantry page is in the sitemap and works offline.

### Changed
- The servings stepper shows fractional servings (about 6¼) after scaling to an ingredient, and steps to whole numbers.

### Fixed
- Form fields on the scaling form have clean labels for screen readers, and every button's spoken name includes its visible text.

### Quality
- 166 unit and component tests and 22 end-to-end tests, with accessibility scans of the scaling form and a filled pantry in light and dark themes.

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

[1.2.0]: https://github.com/Abhirup-code/Recipe_Scaler/releases/tag/v1.2.0
[1.1.0]: https://github.com/Abhirup-code/Recipe_Scaler/releases/tag/v1.1.0
[1.0.0]: https://github.com/Abhirup-code/Recipe_Scaler/releases/tag/v1.0.0
