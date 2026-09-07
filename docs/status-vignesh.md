# Status — Vignesh (Engine)
Updated: 2026-09-07 16:10 IST / 485f5db
Building against contract version: 1.0.0

## Public surface I currently provide

| Export | State |
| --- | --- |
| `defaultConfig()` | working |
| `presets()` | working |
| `runSimulation(config)` | stubbed |
| `runSensitivity(config)` | stubbed |
| `runParetoSweep(config, points)` | stubbed |

## Done since last update

- Added `src/engine/compatibility.ts`: blood group matching, optional age
  matching, inter-zone transport hours, and `isEligible`. Same-zone transport is
  7 hours all in, the worst pair (south to west) is 13, so the default 24 hour
  cold ischemia ceiling excludes nobody. It starts biting below 13.
- Added `src/engine/model.ts`. Every biological and behavioural constant and
  formula now lives there as a named export, plus the `Patient` and `Organ`
  entity interfaces so compatibility, population and organ generation can each
  depend on one module rather than on each other.
- Corrected `utilityTrap`. It was setting `maxAgeToList: 65`, `ageMatchingOn:
  true` and `minUrgencyToList: 3`, which hard-coded the finding it is supposed
  to demonstrate. It is now weights only: urgency 0.05, lifeYears 0.90,
  waitingTime 0.05, everything else at default. The age cap is not coming back.

## In progress right now

- Task 002, the world model: constants and formulas, compatibility rules,
  synthetic patients, synthetic organ arrivals.

## Stubbed or fake, do not trust

- `runSimulation`, `runSensitivity`, `runParetoSweep`. Every number they return
  is invented. Only the shapes are real.
- `meta.runtimeMs` is the constant 12.

## I need from the other side

- Nothing blocking. Build against `src/engine/index.ts` and tell me the moment
  you want a number that is not on the `Outcome`.

## Warnings

- `presets().utilityTrap` changed shape of behaviour, not shape of data. If you
  cached its constraint values anywhere, re-read them.
- No contract fields added, renamed or removed. Nothing in the `Outcome` moved.
