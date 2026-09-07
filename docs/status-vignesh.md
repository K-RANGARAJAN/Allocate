# Status — Vignesh (Engine)
Updated: 2026-09-07 21:24 IST / 0617c04
Building against contract version: 1.0.0

## Public surface I currently provide

| Export | State |
| --- | --- |
| `defaultConfig()` | working |
| `presets()` | working |
| `runSimulation(config)` | working |
| `runSensitivity(config)` | working |
| `runParetoSweep(config, points)` | working |

## Done since last update

- **`runParetoSweep` is real.** Twenty weight combinations spread across the
  simplex, one full 730-day simulation each, plotted as `lifeYearsGained`
  against `regionGapPct` with `waitlistDeaths` riding along. Exactly one point
  carries `isCurrent` — the swept combination nearest the caller's own weights,
  compared after normalising both. Domination marking lands in the next commit,
  so `dominated` is false on every point right now.
- **Measured runtime: 13.9 seconds for 20 points**, about 0.68 seconds a run.
  Cost is linear in `points`, so 10 points is roughly 7 seconds and 30 is
  roughly 21. This one definitely needs a progress indicator.
- The sweep picks its combinations by farthest-point sampling over a weight
  lattice, seeded with the three pure corners. No randomness — the same point
  count always returns the same combinations in the same order, and any point
  count still spans the whole space instead of clustering on one side.

- **`runSensitivity` is real.** Eight levers, both directions, seventeen full
  simulations. Deltas are a symmetric difference so a lopsided response does not
  read as a bigger effect than it is. `impactScore` is the mean absolute
  percentage move across all nine metrics, sorted descending.
- **Measured runtime: 10.7 seconds** in score mode, 12.1 in cascade. Under the
  20 second ceiling so the full 730 days is kept, but this needs a progress
  indicator or a Web Worker — it will freeze the tab otherwise.
- Verification is a partial pass, reported rather than tuned. Donation rate
  ranks **first in both modes**, which is the Round 4 talking point. But "well
  above any individual weight" only holds in cascade mode:

  | lever | score mode | cascade mode |
  | --- | --- | --- |
  | donationRateMultiplier | **4.8** | **5.4** |
  | weights.lifeYears | 4.4 | 0 |
  | weights.urgency | 3.8 | 0 |
  | weights.waitingTime | 1.9 | 0 |
  | minUrgencyToList | 1.2 | 0.6 |
  | retrievalHospitalKeeps | 0 | 1.7 |
  | transplantCentresPerZone | 0 | 1.3 |
  | maxColdIschemiaHours | 0 | 0 |

  In score mode donation rate beats the life-years weight by 9%, which is first
  place but not a landslide. In cascade mode it is 3.2 times the next lever and
  every weight is exactly zero, because a cascade never scores anyone against
  anyone. That is a stronger version of the same point.
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

- Task 006. The sweep runs; domination marking is the next commit.

## Stubbed or fake, do not trust

- Nothing. Every number now comes out of a real simulation. The one incomplete
  field is `dominated` on a Pareto point, which is false on every point until
  the next commit — do not shade the frontier yet.

## I need from the other side

- Nothing blocking. Your status file is still the empty template — fill in what
  you have wired so I know what is actually being called.
- Tell me the moment you want a number that is not on the `Outcome`. I will add
  it engine-side rather than have you compute it.

## Warnings

- **`runParetoSweep` takes about 0.7 seconds per point.** Twenty points is
  roughly 14 seconds and it will lock the tab. Progress indicator, and probably
  a Web Worker. Never call it on a slider drag.
- **The sweep always runs in score mode**, whatever `config.mode` says. Only the
  weighted-score policy reads weights at all — a cascade allocates by tier and
  first-come by wait length, so neither has a weight space to sweep and every
  point would come back identical. Every other setting on the config, including
  `localFirst`, the seed and the donation rate, is held as passed. If the user is
  sitting in cascade mode, the frontier is still an honest map of the score
  policy space under their constraints, but it is not a map of where they are.
- **`dominated` is false on every point until the next commit.** Real axis
  values, no domination pass yet.

- **`runSensitivity` takes 10 to 12 seconds.** It runs seventeen simulations.
  It will lock the tab. It needs a progress indicator, and probably a Web
  Worker. Do not call it on a slider drag.
- **Three levers read exactly 0 in score mode**, and it is not a bug.
  `retrievalHospitalKeeps` and `transplantCentresPerZone` are only consulted by
  the cascade, and the cold ischemia ceiling has slack at 24 hours when the
  longest journey in the model is 13. They wake up in cascade mode. If you grey
  out zero-impact levers, they are honestly zero for that config.

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
