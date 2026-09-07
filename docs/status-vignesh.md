# Status — Vignesh (Engine)
Updated: 2026-09-07 15:41 IST / f94cef8
Building against contract version: 1.0.0

## Public surface I currently provide

| Export | State |
| --- | --- |
| `defaultConfig()` | stubbed |
| `presets()` | stubbed |
| `runSimulation(config)` | stubbed |
| `runSensitivity(config)` | stubbed |
| `runParetoSweep(config, points)` | stubbed |

## Done since last update

- Repository scaffolded: Vite, React, TypeScript, Recharts, single tsconfig.
- `src/contract/types.ts` written at version 1.0.0.
- `src/engine/rng.ts` — seeded Mulberry32. Real, deterministic, verified.
- `src/engine/index.ts` — the five-function seam, all five stubbed.
- `scripts/smoke.ts` — validates the Outcome and prints the nine metrics.
- Minimal app shell proving the import path end to end.

## In progress right now

- Nothing yet. Next up is synthetic population and organ arrival generation.

## Stubbed or fake, do not trust

- All five exported functions. Every number they return is invented.
- `defaultConfig()` and `presets()` return real, valid configs, but they are
  still marked `// STUB` because the preset weightings are not yet tuned against
  a working simulation.
- `runSimulation` metrics are fixed dummies. Only `waitlistDeaths` and
  `lifeYearsGained` move, and they move crudely with `weights.urgency` so the
  interface can see a slider bite. Nothing else reacts to config yet.
- `runParetoSweep` domination is computed honestly over invented numbers.
- `meta.runtimeMs` is a constant.

## I need from the other side

- Nothing blocking. Build against `src/engine/index.ts` and tell me the moment
  you want a number that is not on the `Outcome`.

## Warnings

- `src/engine/rng.ts` is the only source of randomness in the engine. If you ever
  see `Math.random` in an engine file, that is a bug, tell me.
- The five exports are stable. I will not change their signatures without
  messaging you and bumping `CONTRACT_VERSION`.
