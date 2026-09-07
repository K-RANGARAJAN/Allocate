# Status — Vignesh (Engine)
Updated: 2026-09-07 21:14 IST / 4666cf6
Building against contract version: 1.0.0

## Public surface I currently provide

| Export | State |
| --- | --- |
| `defaultConfig()` | working |
| `presets()` | working |
| `runSimulation(config)` | working |
| `runSensitivity(config)` | stubbed |
| `runParetoSweep(config, points)` | stubbed |

## Done since last update

- Added the sensitivity perturbation harness: eight levers, each knowing how to
  move itself up and down. The three weights, the cold ischemia ceiling, minimum
  urgency to list, retrieval hospital keeps, donation rate and total transplant
  centres. Continuous levers move ±10%, discrete ones by one step. Scoring and
  ranking is the next commit, so `runSensitivity` is still a stub right now.
- **Gate B passed, all four checks.** `localFirst` was a dead lever — it only
  gated two cascade tiers the organ never reached, and `score` and `fcfs` never
  read it at all. It is now enforced in `isEligible`, so it binds every mode.
  A patient outside the organ's zone is simply not eligible when it is set to
  `zone`. This is the single biggest lever in the model.

  | mode | localFirst | transplants | regionGapPct | coldHrs | discards |
  | --- | --- | --- | --- | --- | --- |
  | score | off | 1132 | 1.5 | 10.5 | 38 |
  | score | zone | 1136 | **9.9** | 7.4 | 34 |
  | cascade | off | 1134 | 7.2 | 7.8 | 36 |
  | cascade | zone | 1135 | **10.2** | 7.3 | 35 |
  | fcfs | off | 1128 | 0.8 | 10.4 | 42 |
  | fcfs | zone | 1136 | **9.4** | 7.3 | 34 |

  Sealing organs inside their zone multiplies regional disparity roughly sixfold
  in score mode while cutting cold time and discards. Nobody is made worse off
  in aggregate, which is exactly why it is a trap.
- Task 004 complete: `fcfs` baseline, the TRANSTAN cascade with its six tiers,
  retrieval hospital priority, the hospital rota, and `config.mode` dispatch.
  All three modes run and produce different results.
- Task 003 complete and Gate A passed. Pure urgency transplants 23.2% of
  over-60s. Pure life-years transplants **0%** of them, across 730 days, with no
  age rule anywhere in the engine. It costs 1409 waitlist deaths against 1248.
- Task 002 complete: the world model, seeded synthetic patients and organs, and
  `scripts/distributions.ts`.

## In progress right now

- Task 005, sensitivity analysis. Harness done, scoring next.

## Stubbed or fake, do not trust

- `runSensitivity` and `runParetoSweep`. Every number they return is invented
  and none of it responds to config. Do not demo either of them.
- Everything else is real. `runSimulation` runs a genuine 730-day allocation
  loop and all nine metrics plus every breakdown come out of it.

## I need from the other side

- Nothing blocking. Your status file is still the empty template — fill in what
  you have wired so I know what is actually being called.
- Tell me the moment you want a number that is not on the `Outcome`. I will add
  it engine-side rather than have you compute it.

## Warnings

- **`runSimulation` takes about 0.65 seconds.** It is no longer instant. Debounce
  it if you are calling it on slider drag.
- **Age band strings changed** from the stub set. They were `18-34`, `35-49`,
  `50-64`, `65+`. They are now `18-39`, `40-59`, `60-69`, `70+`. These four are
  final and always all four are returned.
- **`discardReasons` has four rows now, not three.** The fourth is
  `graft quality too low`. All four are always returned, including at zero, so
  the table never changes shape between runs.
- **`localFirst` moved from cascade-only to a global constraint.** It now
  affects every mode. If you built the control assuming it only mattered in
  cascade mode, it matters everywhere.
- **`medianWaitDays` reads larger than the 730 day run** — 934 at default. That
  is correct. The initial 2000 patients are backdated up to 900 days, so their
  waits started before day zero.
- **Hospital type is no longer an independent 40/60 draw.** A patient inherits
  it from the transplant centre they are listed at, and about 40% of a zone's
  centres are government. The split stays near 40/60 but moves with
  `transplantCentresPerZone`.
- `meta.runtimeMs` is a real measurement and is the one documented exception to
  byte-identical determinism. Everything else is identical run to run at a given
  seed.
- Task 007 wants `localityTrap` to cut `organsDiscarded`. It now does — 38 down
  to 34 in score mode. That was not true before this change.
