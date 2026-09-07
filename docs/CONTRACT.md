# Contract

**Version 1.0.0**

This document is the prose companion to `src/contract/types.ts`. The types file is
the machine-readable truth. This file explains what the fields mean.

Neither developer changes the contract without messaging the other first. When it
changes, `CONTRACT_VERSION` changes with it and both status files are updated.

## The five-function API

`src/engine/index.ts` exports exactly these five functions and nothing else. The
interface imports from this module only, never from engine internals.

| Function | Returns | Purpose |
| --- | --- | --- |
| `defaultConfig()` | `PolicyConfig` | The baseline policy the app opens on |
| `presets()` | `Record<string, PolicyConfig>` | Named policies, currently `utilityTrap` and `localityTrap` |
| `runSimulation(config)` | `Outcome` | Two years of allocation under one policy |
| `runSensitivity(config)` | `SensitivityRow[]` | One lever moved at a time, ranked by impact |
| `runParetoSweep(config, points)` | `ParetoPoint[]` | A sweep across the weight space |

Functions still returning dummy data carry a `// STUB` comment as the first line
of their body. Anything so marked is not to be trusted for judging, only for
wiring.

## Determinism

The same `PolicyConfig` — including `sim.seed` — always produces a byte-identical
`Outcome`. This is what makes two scenarios comparable. If a run is not
reproducible, that is a bug in the engine, not a quirk of the model.

## Units

| Field | Unit |
| --- | --- |
| `medianWaitDays`, `p90WaitDays` | days |
| `lifeYearsGained` | years, summed across recipients |
| `maxColdIschemiaHours`, `meanColdIschemiaHours` | hours |
| `meanGraftQuality` | 0 to 1 |
| `regionGapPct`, `ratePct` | percentage points, 0 to 100 |
| `durationDays` | days |
| `donationRateMultiplier` | multiplier, 1.0 is baseline |
| `urgency`, `minUrgencyToList` | 0 to 10 |
| `transplants`, `waitlistDeaths`, `organsDiscarded` | counts, never negative |

## Slider ranges and defaults

| Control | Range | Default |
| --- | --- | --- |
| `weights.urgency` | 0 to 1 step 0.05 | 0.33 |
| `weights.lifeYears` | 0 to 1 step 0.05 | 0.33 |
| `weights.waitingTime` | 0 to 1 step 0.05 | 0.33 |
| `constraints.maxColdIschemiaHours` | 4 to 36 step 1 | 24 |
| `constraints.minUrgencyToList` | 0 to 10 step 1 | 2 |
| `constraints.maxAgeToList` | 50 to 90, or null | null |
| `constraints.retrievalHospitalKeeps` | 0, 1 or 2 | 1 |
| `resources.donationRateMultiplier` | 0.5 to 3.0 step 0.1 | 1.0 |
| `resources.transplantCentresPerZone` | 1 to 15 per zone | north 8, south 6, west 5 |

Other defaults not exposed as sliders: `mode` is `score`, `localFirst` is `off`,
`ageMatchingOn` is `false`, `rotaEnabled` is `false`, `urgentSupersedesRota` is
`true`, `seed` is 42, `durationDays` is 730, `initialWaitlistSize` is 2000 and
`newListingsPerDay` is 6.

## Weights do not need to sum to 1

The interface may leave the three weights at any values in range. The engine
normalises them internally before scoring. A user dragging every weight to 1.0 is
expressing an equal split, not an error.

## Breakdown shapes

`Breakdowns` carries four arrays and the interface should assume none of them is
empty: `byAgeBand` (at least four bands), `byZone` (exactly the three zones),
`byHospitalType` (government and private) and `discardReasons`. Every `ratePct` is
`transplanted / listed` as a percentage, already rounded by the engine.

`timeline` is a sampled series across `sim.durationDays`, not one point per day.
The interface plots it as given.

## Nullability

`constraints.maxAgeToList` is the only field that is legitimately `null`, meaning
no upper age limit on listing. Every other numeric field is always a finite
number. The smoke test enforces this.

## Changelog

<!-- One line per contract change: version, date, what moved, who agreed. -->
