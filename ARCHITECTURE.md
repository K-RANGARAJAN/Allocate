# Architecture

## What this is

A decision-simulation and scenario-intelligence platform for kidney allocation
policy. The user sets an allocation policy — how organs get matched to waiting
patients — and the platform simulates two years of allocation decisions, then
shows what that policy cost.

The thesis is that there is no correct policy. Maximise total life-years and you
quietly stop transplanting anyone over 60. Prioritise local patients and regional
disparity explodes. The platform's job is making those trade-offs visible, not
naming a winner.

Domain grounding: India allocates through NOTTO nationally with state bodies
below it. Tamil Nadu (TRANSTAN) uses a cascade and a hospital rota rather than a
score — the retrieving hospital gets first claim, and organs rotate between
participating hospitals in turn. We model both that cascade and a weighted-score
policy, and compare them.

## Directory tree

```
docs/
  CONTRACT.md            prose contract, units, slider ranges
  status-vignesh.md      engine status
  status-ranga.md        interface status
scripts/
  smoke.ts               pre-commit sanity run over the engine
src/
  contract/types.ts      the shared contract, changed only by agreement
  engine/
    index.ts             the seam, exports exactly six functions
    rng.ts               seeded Mulberry32 generator
    population.ts        synthetic waitlist generation
    organs.ts            synthetic donor organ arrivals
    compatibility.ts     blood group, age and ischaemia matching
    simulate.ts          the day-by-day allocation loop
    metrics.ts           metrics and breakdown aggregation
    sensitivity.ts       one-lever-at-a-time sensitivity
    pareto.ts            weight-space sweep and domination
    presets.ts           named policy configurations
    policies/
      score.ts           weighted-score allocation
      cascade.ts         TRANSTAN-style cascade and hospital rota
      fcfs.ts            first come first served baseline
  ui/
    App.tsx              root component
    state/               scenario and config state
    components/          panels, tables, controls
    charts/              Recharts wrappers
  styles/                all CSS
  main.tsx               React entry point
index.html               Vite entry point
```

## Ownership

| Area | Owner | Notes |
| --- | --- | --- |
| `src/engine/`, `scripts/` | Vignesh (Engine) | Writes zero UI code |
| `src/ui/`, `src/main.tsx`, `index.html`, `src/styles/` | Ranga (Interface) | Writes zero simulation logic |
| `src/contract/types.ts`, `docs/CONTRACT.md` | Shared | Changed only by human agreement between both developers |
| `ARCHITECTURE.md`, `CONTRIBUTING.md`, `package.json`, `vite.config.ts` | Shared | Same rule |

## Data flow

1. The interface builds a `PolicyConfig` from its controls.
2. The interface calls `runSimulation(config)` and gets an `Outcome` back.
3. The interface renders fields off that `Outcome`. It renders. It does not derive.
4. `runSensitivity(config)` and `runParetoSweep(config, points)` follow the same shape.

Scenarios are held in memory and exported as JSON. There is no backend, no
database and no API layer. Everything runs in the browser.

## Engine purity rules

These are absolute.

- The same config plus the same seed always produces a byte-identical `Outcome`.
- No `Math.random()`. All randomness comes from `createRng` in `src/engine/rng.ts`.
- No `Date.now()`, no `fetch`, no `localStorage`, no file I/O.
- No DOM access, no React, no imports from `src/ui/`.
- `src/engine/index.ts` exports exactly six functions and nothing else.

## The interface never computes a metric

Not a percentage. Not a difference. Not a total. Every number the interface
displays comes straight off the `Outcome` object. If the interface needs a number
that is not in the `Outcome`, the engine adds it and the contract grows. This is
what keeps the two halves reviewable independently.

## Out of scope, deliberately

- Organs other than kidneys.
- Real registry data. All data is generated synthetically in code.
- User accounts, authentication, persistence.
- Anything server-side.

## Vignesh (Engine) must

- Keep the six exports in `src/engine/index.ts` stable and correctly typed.
- Keep every stub marked with a `// STUB` comment as the first line of its body.
- Keep `npm run smoke` passing before every commit.
- Add any metric the interface needs, rather than letting the interface derive it.
- Message Ranga before touching `src/contract/types.ts`.

## Vignesh (Engine) must not

- Write anything in `src/ui/`, `src/main.tsx`, `index.html` or `src/styles/`.
- Introduce impurity: randomness outside `rng.ts`, clocks, network, storage.
- Export anything from `src/engine/index.ts` beyond the six functions.

## Ranga (Interface) must

- Read every displayed number off the `Outcome`.
- Build against `src/engine/index.ts` only, never against engine internals.
- Ask for a new field when one is missing, rather than computing it.
- Message Vignesh before touching `src/contract/types.ts`.

## Ranga (Interface) must not

- Write anything in `src/engine/` or `scripts/`.
- Compute, derive or aggregate any metric, including percentages and differences.
- Import from `src/engine/simulate.ts`, `src/engine/metrics.ts` or any other
  engine module that is not `src/engine/index.ts`.
