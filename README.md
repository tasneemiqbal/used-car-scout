# Used Car Scout

See what a used car will really cost before you buy it. Paste a Facebook Marketplace or Craigslist listing (or a screenshot) and get an honest report grounded in real NHTSA data, plus Scout, a car-savvy friend for first-time buyers who can't afford a mechanic.

Built for **SheBuilds by Lovable** (Oct 15–17, 2026).

- **Live app:** https://usedcarscout.lovable.app
- **Product spec:** [product-spec.md](product-spec.md) (scope, pages, Scout, data sources, AI instructions, security, build plan)
- **Design system (for Lovable):** [design/design-system.md](design/design-system.md), with screen images in [design/screens/](design/screens/) and [design/system/](design/system/)
- **Design source:** [Figma file](https://www.figma.com/design/YARHxc2pgKDcBJQlgVcl4V)
- **Brand assets:** [assets/](assets/)

## Hackathon rules

This repo holds the plans, design references and brand assets prepared before kickoff, plus the app built during the event. No app code was written before Oct 15. The app was built from scratch in a new Lovable project.

## What is in the repo

- `src/` the app: TanStack Start (React 19), Tailwind CSS v4, route files, the checker, the report and Scout chat
- `supabase/migrations/` database migrations applied to the Lovable Cloud backend
- `drizzle/migrations/` the same migration history kept with the project
- `judge-testing.md` how to test the app without an account
- `roadmap.md` the task list used during the build
- `AGENTS.md` build rules kept with the project

## Running the app

```bash
bun install
bun run dev
```

Tests: `bun run test`. Lint: `bun run lint`.

The app expects a Lovable Cloud backend and reads `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` and `VITE_SUPABASE_PROJECT_ID` from the environment.

## Stack

Lovable (React + Lovable Cloud + Lovable AI), NHTSA public APIs, fueleconomy.gov.

## Security

No secrets in this repo. API keys live only in Lovable Cloud backend secrets. See the "Security and privacy" section of the spec.
