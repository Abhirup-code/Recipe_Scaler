# Recipe Scaler

[![CI](https://github.com/Abhirup-code/Recipe_Scaler/actions/workflows/ci.yml/badge.svg)](https://github.com/Abhirup-code/Recipe_Scaler/actions/workflows/ci.yml)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

**Live demo: https://abhirup-code.github.io/Recipe_Scaler/**

A mobile-first recipe site that makes home cooking easier: scale any recipe to the number of people you are feeding, switch between US and metric, follow along in a step-by-step cook mode that keeps your screen on, find a substitute when you are out of an ingredient, and turn several recipes into one shopping list.

Built with **Next.js, React, and TypeScript**, tested with **Vitest and React Testing Library**, and checked by **Lighthouse** on every pull request.

<p>
  <img src="docs/screenshots/home.png" width="190" alt="Home page with recipe search">
  <img src="docs/screenshots/scaling.png" width="190" alt="Ingredients scaled to 6 servings with substitutes for buttermilk">
  <img src="docs/screenshots/metric.png" width="190" alt="Ingredients in metric, with flour shown in grams">
  <img src="docs/screenshots/cook-mode.png" width="190" alt="Cook mode showing one step with a 5 minute timer">
  <img src="docs/screenshots/shopping-list.png" width="190" alt="Combined shopping list with items checked off">
</p>

## Features

| Feature | How it works |
|---|---|
| **Serving-size scaling** | Every amount updates as you change servings and stays readable: 1.5 cups shows as "1½ cups", and 3 tsp rolls up into "1 tbsp". |
| **US and metric** | One tap converts the whole recipe. Flour, sugar, and butter switch to grams (using each ingredient's density), not just millilitres. Your choice is remembered. |
| **Cook mode** | One large step at a time with big Back and Next buttons (or arrow keys), built-in timers on timed steps, and the [Screen Wake Lock API](https://developer.mozilla.org/docs/Web/API/Screen_Wake_Lock_API) so the phone does not go dark mid-recipe. |
| **"Out of it?" substitutions** | Suggested swaps for common ingredients (buttermilk, eggs, butter, soy sauce, ...), with notes on what changes in the dish. |
| **Shopping list** | Add recipes at any serving size. Matching ingredients are combined even when recipes use different units (2 tbsp + 1 cup of milk), and you can check items off or copy the list. |
| **Search** | Filter by name, cuisine, tag, or ingredient ("lentils", "vegan quick"). |
| **SEO** | Every recipe page is pre-rendered HTML with [schema.org Recipe](https://developers.google.com/search/docs/appearance/structured-data/recipe) structured data, canonical URLs, Open Graph tags, a sitemap, and robots.txt. |

## Quality

| Check | Result |
|---|---|
| Lighthouse (home page, mobile) | Performance 100, Accessibility 100, Best Practices 100, SEO 100 |
| Lighthouse (recipe page, mobile) | Performance 99, Accessibility 100, Best Practices 100, SEO 100 |
| Core Web Vitals (lab) | LCP 1.2 to 1.7 s, CLS 0 |
| Tests | 74 tests (unit and component), 99% line coverage, 90% coverage gate in CI |

CI fails a pull request if Lighthouse drops below 90 for performance or 95 for accessibility, best practices, or SEO, or if layout shift goes above 0.1.

## Design decisions

- **Static site, no server.** Every page is generated at build time (`output: "export"`), so the site is fast, cheap to host on GitHub Pages, and fully readable by search engines.
- **Pure, tested logic.** Unit conversion, fraction formatting, scaling, list merging, and structured data are plain TypeScript functions in `src/lib` with their own tests; components stay thin.
- **Saved preferences without hydration bugs.** The unit choice and shopping list live in `localStorage` behind a small store used with React's `useSyncExternalStore`. Server and first render agree, saved values appear right after, and open tabs stay in sync.
- **Safe structured data.** JSON-LD is serialized with `<` escaped, so recipe text can never close the script tag and inject code.
- **Ready for AI substitutions.** Substitutions come from a `SubstitutionProvider` interface. Today it reads a curated list; an LLM-backed provider (behind a server route that keeps the API key secret) can be added without changing the UI.
- **Accessible by default.** Semantic HTML, labelled controls, 44 px tap targets, visible focus, a skip link, screen-reader announcements for results and timers, dark mode, and reduced-motion support.

## Tech stack

Next.js 16 (App Router, static export), React 19, TypeScript (strict), CSS with custom properties, Vitest, React Testing Library, ESLint, Lighthouse CI, GitHub Actions, GitHub Pages, Dependabot.

## Run locally

Requires Node.js 22.

```bash
npm ci
npm run dev            # http://localhost:3000
npm test               # unit and component tests
npm run lint && npm run typecheck
npm run build          # static site in ./out
```

## Project structure

```
src/
  app/          pages: home, recipe pages, shopping list, sitemap, robots
  components/   interactive pieces: scaling panel, cook mode, timers, shopping list
  data/         the recipes
  lib/          tested logic: units, formatting, scaling, shopping list, schema, storage
tests/          unit and component tests
```


## License

[Apache License 2.0](LICENSE). Recipes and illustrations are original to this project.
