# Status — Vignesh (Engine)
Updated: 2026-09-08 09:10 IST
Building against contract version: 1.6.0

## Public surface I currently provide

| Export | State |
| --- | --- |
| `defaultConfig()` | working |
| `presets()` | working |
| `runSimulation(config)` | working |
| `runSensitivity(config)` | working |
| `runParetoSweep(config, points)` | working |
| `compareOutcomes(a, b, labelA?, labelB?)` | working |
| `runRobustness(config, seeds?)` | working |
| `runCounterfactual(baseline, scenario, labelA?, labelB?)` | working |
| `runConstrainedFrontier(config, points, constraint, objective?)` | working |

## Contract 1.6.0 — nine exports, and what is new on the Outcome

Read `docs/CONTRACT.md` for the field-level detail. The short version:

- **`metrics.zoneGiniPct`** — a Gini over the three zones' transplant rates.
  `regionGapPct` reads only the widest pair and throws the third zone away; this
  reads all three. Both are returned on purpose.
- **`outcome.equity`** — three rows, `zone` / `ageBand` / `hospitalType`, each
  with a Gini, a spread, and the best and worst group by name.
- **`outcome.steadyState`** — one row per metric comparing the last 180 days
  against the 180 before. `windowable` is false for the three rate metrics and
  those rows must not be shown as numbers.
- **`runRobustness`** — every metric as mean/min/max across twenty seeds, with
  `unanimous` set when every seed agreed.
- **`runCounterfactual`** — the individual patients transplanted under one policy
  and dead under the other, same seed so the same people.
- **`runConstrainedFrontier`** — the user sets a floor, this prices it.
- **`ParetoPoint.metrics`** — the full metric set on every swept point.

## Handover — what to call and where every number lives

Everything below is real and none of it needs anything from me first. Import
only from `src/engine/index.ts`.

### The five calls

| call | returns | cost | call it when |
| --- | --- | --- | --- |
| `defaultConfig()` | `PolicyConfig` | instant | on mount, to seed your controls |
| `presets()` | `{ utilityTrap, localityTrap }` | instant | preset buttons |
| `runSimulation(config)` | `Outcome` | ~0.65s | on config change, debounced |
| `runSensitivity(config)` | `SensitivityRow[]` | 10-12s | on demand only, never on a drag |
| `runParetoSweep(config, points)` | `ParetoPoint[]` | ~0.7s per point | on demand only |
| `compareOutcomes(a, b, labelA?, labelB?)` | `ScenarioComparison` | instant | any panel showing a difference |

`presets()` returns whole `PolicyConfig` objects. Set one as your live config and
every control should read back the preset's values.

### Outcome

- `metrics` — ten numbers. The nine headline ones — `transplants`,
  `lifeYearsGained`, `waitlistDeaths`, `medianWaitDays`, `p90WaitDays`,
  `organsDiscarded`, `meanColdIschemiaHours`, `meanGraftQuality`, `regionGapPct`
  — plus `overSixtyRatePct`, new in contract 1.1.0. All rounded already, all
  always present, never null.
- `breakdowns.byAgeBand` — four rows, always all four, always in this order:
  `18-39`, `40-59`, `60-69`, `70+`. Each row is `{ band, listed, transplanted,
  ratePct }`.
- `breakdowns.byZone` — three rows, `north` / `south` / `west`, same shape with
  `zone` instead of `band`. `regionGapPct` is the widest `ratePct` gap between
  any two of these rows, so this table is the evidence for that metric.
- `breakdowns.byHospitalType` — two rows, `government` / `private`.
- `breakdowns.discardReasons` — four rows, always all four even at zero, so the
  table never changes shape: `no eligible recipient`, `declined by all centres`,
  `exceeded ischemia limit`, `graft quality too low`.
- `timeline` — 26 points at the default duration, one per 30 days plus a closing
  point. Each is `{ day, waitlistSize, cumulativeTransplants, cumulativeDeaths }`.
- `meta` — `runtimeMs`, `organsArrived`, `allocationDecisions`. `organsArrived`
  is the denominator if you want a discard rate.
- `config` — the config that produced this Outcome, echoed back. Use it to label
  a scenario rather than trusting your own state to still match.

### SensitivityRow

`{ lever, label, deltaPct, impactScore }`, already sorted by `impactScore`
descending, so row zero is the headline. `label` is display-ready. `deltaPct` is
a partial map keyed by metric name — a signed percentage move for a one-step
increase in that lever. Eight rows.

### ParetoPoint

`{ label, weights, lifeYearsGained, regionGapPct, waitlistDeaths, dominated,
isCurrent }`. Plot `lifeYearsGained` on x and `regionGapPct` on y. Exactly one
point has `isCurrent`. Scale the gap axis to the data — it spans about two
points at the default config, and a 0-to-100 axis will make a real effect look
flat.

### Which field proves which Round 4 claim

1. **Over-60 collapse** — `metrics.overSixtyRatePct` under
   `presets().utilityTrap` against `defaultConfig()`. 10.2% to 0%. The
   `breakdowns.byAgeBand` table is the evidence underneath it.
2. **Locality trap** — `metrics.regionGapPct` and `metrics.organsDiscarded`
   under `presets().localityTrap` against `defaultConfig()`.
3. **A dominated current point** — `runParetoSweep(defaultConfig(), 20)`. At the
   default config the current point is already dominated by two others.
4. **Donation rate outranks every weight** — `runSensitivity(...)`, row zero.

### Contract 1.1.0 — one field added

`metrics.overSixtyRatePct`. The share of listed patients aged 60 or over who
were transplanted, as a percentage. It is the headline number of the utilityTrap
demo and it spans the `60-69` and `70+` bands, so without it the interface would
have to sum two breakdown rows and weight them by `listed` — the UI computing a
metric, which R4 forbids. Additive only: nothing renamed, nothing removed,
nothing reordered, so anything already written against 1.0.0 still compiles.
`scripts/demo-check.ts` cross-checks it against the two age band rows on every
run and fails if they ever disagree.

Ranga — this went in on Vignesh's approval because you had not started yet and
the field is purely additive. Say if you would rather it came back out.

## Done since last update

- **Contract 1.6.0. Three new exports and two new Outcome fields, all additive.**
  Nothing renamed, nothing removed, nothing reordered. Every number that was on
  screen before is unchanged — smoke still prints 1132 / 10775.4 / 1304 / 934 /
  1135 / 38 / 10.5 / 0.86 / 1.5 / 10.2.
- **`runSimulation` still costs what it did.** `equity` and `steadyState` are
  aggregation over the log it already produces. No extra simulation runs.
- **Two findings fell out of the new measures immediately.**

  **Age inequality is more than ten times the regional inequality.** At the
  default config the zone Gini is 1.9 and the age-band Gini is **22.3** — the
  70+ band transplants at 9.5% against 26% for 18-39. This project has been
  telling a regional-disparity story while the far larger disparity sat in the
  age breakdown unmeasured. The locality trap is real, but it is the smaller of
  the two inequalities in the model.

  **The utility trap costs 373 people their transplant and gives 159 back — and
  every one of the 159 is under 60.** From `runCounterfactual(default,
  utilityTrap)`: 373 lost, 159 gained. By band, lost/gained: 18-39 70/140,
  40-59 230/19, 60-69 **56/0**, 70+ **17/0**. Not one patient over 60 gains
  anything under the utility preset. The longest-waiting person it drops had
  been on the list 1516 days.

- **The steady-state check says two metrics have not settled.** Comparing days
  550-730 against 370-550 at the default config: transplants drift 0.7%, deaths
  -0.5%, median wait -3.4%, cold ischemia and graft quality 0% — all settled.
  But life-years gained drifts **+12%** and organs discarded **-50%**, both
  outside the 10% tolerance. Reported, not tuned. It means a two-year window is
  long enough for the headline counts and not quite long enough for those two.
- **Constrained frontier, first real number: insisting the over-60 transplant
  rate stays at or above 12% costs 5,103 life-years.** Best feasible point is
  10,268 life-years at a 13% over-60 rate; the unconstrained best is 15,371 at
  0%. 7 of 12 swept points are feasible. The platform names no winner — the user
  sets the floor and this prices it.
- **Corrected the weight slider step, 0.05 to 0.01.** 0.33 is not reachable on a
  0.05 step, so the browser sanitised the input to 0.35 while the label printed
  0.33 off the config. The thumb sat a notch right of its own label and the first
  drag of any weight jumped. Contract error, not an interface one. Ranga changes
  one number in his `Slider` call and it is gone.


- **Every finding re-run on 20 seeds. Both headline claims hold on all 20.**
  `npx tsx scripts/robustness.ts`, about 40 seconds. This exists to answer the
  one question that could sink the demo — *is that just your seed?*

  | | default | preset |
  | --- | --- | --- |
  | over-60 rate | 8.7 to 12.2, mean 10.2 | **exactly 0 on every seed** |
  | regional gap | 0.2 to 2.7, mean 1.4 | 8.4 to 13.9, mean 10.9 |
  | organs discarded | 21 to 56, mean 34.1 | 18 to 50, mean 29.9 |

  The over-60 collapse is not a near-miss on any seed — it is total on all
  twenty. The two gap distributions do not overlap at all: the worst localityTrap
  seed is still three times the best default seed. Discards fall in 18 of 20 and
  are **worse in none** — the other two are exact ties, which is a better line
  than "18 of 20" and is now reported that way.


- **Contract 1.2.0: a sixth export, `compareOutcomes`.** Ranga was right that
  the comparison panel was blocked — R4 forbids the interface subtracting two
  numbers and nothing on the contract returned a difference, which left the
  preset demos with no legitimate route to the screen. It takes two finished
  `Outcome`s and returns one `MetricDelta` row per metric with `before`, `after`,
  `delta`, `deltaPct` and `betterDirection`, in display order. It re-runs
  nothing, so it is instant and safe on every render. The five existing
  signatures are untouched. `ARCHITECTURE.md` now says six, not five.
- **`betterDirection` is `"neutral"` for `overSixtyRatePct`**, on purpose.
  Whether transplanting more or fewer older patients is an improvement is the
  argument this whole platform refuses to settle, so it must not be coloured
  like a score. Every other metric has an honest direction.
- **The comparison surfaced a finding I had not looked at.** Under `utilityTrap`
  the median wait falls from 934 days to **208** — a 78% drop. It looks like the
  policy is making everyone wait less. It is not. It has stopped transplanting
  the long-waiting older patients entirely, so they leave the median instead of
  being served by it. That is the trap arriving disguised as an improvement, and
  it is probably the strongest single line in the demo.
- **Pareto chart wording agreed with Ranga.** The sweep always runs in score
  mode. He reads `config.mode` from his own state — that is not computing a
  metric — and shows: *"You're in cascade mode, which allocates by tier rather
  than by weights, so there's no weight space to sweep for it. This maps the
  score-policy space under your current constraints. The marked point is the
  nearest weighting, not where you are."*


- **Contract bumped to 1.1.0: `metrics.overSixtyRatePct` added.** The utility
  trap's headline number is now on the contract instead of being something the
  interface has to derive. Purely additive. `docs/CONTRACT.md` carries the
  changelog line. `demo-check.ts` gained a check 0 that fails if the metric and
  the age band rows ever disagree.
- **`impactScore` is still the mean across the original nine metrics**, not ten.
  The roadmap defines it that way and adding a tenth would silently move every
  number in the Task 005 table above.
- Added the handover reference below — every call, every field, and which one
  proves which Round 4 claim.


- **Gate C passed, all three checks.** `npx tsx scripts/demo-check.ts` runs both
  presets against the default config and prints what moved.

  | | default | preset | move |
  | --- | --- | --- | --- |
  | utilityTrap — over-60 transplant rate | 10.2% | **0%** | gone entirely |
  | utilityTrap — lifeYearsGained | 10775 | 15375 | +42.7% |
  | utilityTrap — waitlistDeaths | 1304 | 1412 | +108 |
  | localityTrap — regionGapPct | 1.5 | **10.4** | +593% |
  | localityTrap — organsDiscarded | 38 | 34 | -10.5% |
  | localityTrap — meanColdIschemiaHours | 10.5 | 7.3 | -30.5% |

  Both findings come out of weights and permitted constraints only. Nothing in
  the engine knows what a preset is.
- **`localityTrap` had a real bug: `localFirst` was `"state"`.** In this model
  every zone is in one state, so `"state"` restricts nothing — the preset was
  named after a constraint it never applied. It is `"zone"` now, which is the
  tightened setting the trap is actually about. That single change is the whole
  tune; the weights, rota and retrieval-hospital settings were already right and
  I checked the alternatives (keeps 0/1/2, rota on/off) — the existing pair is
  the strongest of them.
- **`utilityTrap` needed no tuning at all.** 0.05 / 0.90 / 0.05 already takes the
  over-60 rate to nothing.
- **The discard finding is smaller than the roadmap expected, and the reason is
  worth having ready.** At the default 24 hour cold ischemia ceiling nothing ever
  hits it — the longest journey in the model is 13 hours — so every discard is a
  graft that decayed below the viability floor in transit, and local-first can
  only take that from 38 to 34. Tighten the ceiling to 12 hours and the same
  lever moves discards from **109 to 36**. `demo-check.ts` prints that pair under
  a Context heading. The honest version of the claim is that the ceiling decides
  what geography costs, not the allocation rule.

- **Task 006 complete, all four checks pass.** At the default config, 20 points:
  15 dominated, 5 on the frontier, exactly one current — and **the current point
  is itself dominated, by two others**. That is Round 4 requirement 3 satisfied
  out of the box, without anyone having to hunt for a config that shows it.
  Pearson r between the two axes is 0.34, so the frontier is a genuine curve
  rather than a line. Two sweeps at the same seed are byte-identical.
- **The two axes are much less coupled than expected, and that is the finding.**
  Across the whole weight space, `lifeYearsGained` moves 8409 to 15371 — nearly
  double — while `regionGapPct` moves only 0.2 to 2.4. Turn `localFirst` to
  `zone` and the gap axis jumps to a 8.9-to-10.6 band and still barely moves
  with the weights. Weights buy life-years. Geography sets regional disparity.
  Choosing a different scoring rule does almost nothing about the regional gap,
  which is a sharper version of the localityTrap point than the frontier's shape
  alone. Reported, not tuned.
- **`runParetoSweep` is real.** Weight combinations spread across the simplex,
  one full 730-day simulation each, plotted as `lifeYearsGained` against
  `regionGapPct` with `waitlistDeaths` riding along. Exactly one point carries
  `isCurrent` — the swept combination nearest the caller's own weights, compared
  after normalising both. A point is `dominated` when another beats it on both
  plotted axes; deaths are deliberately not part of that test, so a point inside
  the visible frontier always reads as inside it.
- **Measured runtime: 14.2 seconds for 20 points**, about 0.7 seconds a run.
  Cost is linear in `points`, so 10 points is roughly 7 seconds and 30 is
  roughly 21. It is faster with `localFirst` set — 5.1 seconds for the same 20
  points — because a zone-restricted candidate list is much shorter to score.
  This one definitely needs a progress indicator.
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

- Nothing on the engine. Everything below is done and pushed.

## Also done today

- **`npm run smoke` now covers all nine exports**, not just `runSimulation`. It
  shape-checks the three new calls at their smallest parameters, and it asserts
  the invariants nobody can see by reading a number: that the zone equity row and
  `regionGapPct` / `zoneGiniPct` are the same measurements, that exactly the
  three rate metrics are marked unwindowable and carry zeros, and that the steady
  state windows are contiguous and end on the last simulated day. It went from
  about 1 second to 8.
- **Gate C has a fifth check now** and it still passes. `utilityTrap` gives no
  transplant back to anyone over 60: 73 over-60 patients lose one, 0 gain one.
  Zero is the only number that makes that claim true, so it is asserted rather
  than described. `scripts/demo-check.ts` also prints the age-band swap table and
  the zone-versus-age inequality comparison.
- **Rewrote the README.** It still described the project as it was before the
  interface and before any of the analysis existed. It now covers the three
  policies, what is measured, the four diagnostic scripts and what each one
  answers, and keeps the synthetic-data disclaimer. If you were planning to
  write it, do not - tell me what is wrong with it instead.
- **Verified the production build in a browser, not just the dev server.** Full
  demo path: default numbers match `npm run smoke` field for field, both presets
  rewrite every control including mode and local-first, the Pareto gap axis
  auto-scales to the data, sensitivity ranks donation rate first in both modes,
  and the current point on the frontier is drawn as its own series and is
  dominated. All four Round 4 claims hold on screen.
- **Did not fold `scripts/robustness.ts` onto `runRobustness`.** Looked at it
  properly and it is the wrong trade. The script's value is the paired per-seed
  test - does this finding hold on *this* seed - which the export cannot express
  because it aggregates one config at a time. Folding it would either double the
  work to 120 simulations or lose the "20 of 20 seeds" line. The only duplication
  is a ten-line min/mean/max helper. Left alone deliberately.

## Stubbed or fake, do not trust

- Nothing. Every number now comes out of a real simulation. All five exports
  are real and every field on the Outcome, the sensitivity rows and the Pareto
  points is computed.

## I need from the other side

- Nothing blocking. Your status file is still the empty template — fill in what
  you have wired so I know what is actually being called.
- Tell me the moment you want a number that is not on the `Outcome`. I will add
  it engine-side rather than have you compute it.

## Warnings

- **Contract is 1.6.0 and there are nine exports, not six.** All additive.
  Nothing renamed, removed or reordered, so everything already written still
  compiles and still shows the same numbers.
- **`Metrics` has eleven fields now, not ten.** `zoneGiniPct` is new. If you
  iterate `Object.keys(metrics)` anywhere, you get an extra tile. The
  `compareOutcomes` row list has a new entry for it too, so the comparison table
  grows by one row on its own.
- **`ParetoPoint` carries a `metrics` object now.** Purely additive; the three
  axis fields the chart reads are untouched.
- **`Outcome.meta` has two new fields**, `earlyWindowDays` and `lateWindowDays`.
- **Three `steadyState` rows return zeros and must not be rendered as numbers.**
  `regionGapPct`, `overSixtyRatePct` and `zoneGiniPct` have `windowable: false`.
  A rate needs a listed denominator and a window does not have an honest one.
  Show "not applicable", or drop the row.
- **`runRobustness` is the most expensive call on the contract — about 13
  seconds at the default twenty seeds.** It is twenty full simulations. Worker
  and button only, like the other two.
- **`runCounterfactual` ignores the scenario config's seed** and forces the
  baseline's. Different seeds would mean different synthetic people and the whole
  comparison would be meaningless. If you show the seed anywhere, read it off
  `report.seed`.
- **`lost` and `gained` are capped at 100 rows.** `lostCount` and `gainedCount`
  are the true totals. Never count the array length.
- **`priceOfConstraint` is `null` when nothing is feasible.** That is a finding,
  not an empty state — say that no policy in the swept space meets the line.
- **Weight slider step is 0.01 now, not 0.05** (`docs/CONTRACT.md`). It was a
  contract error: 0.33 is unreachable on a 0.05 step, so your slider sat at 0.35
  while its label read 0.33.

- **Contract is 1.1.0, not 1.0.0.** One field added to `Metrics`:
  `overSixtyRatePct`. Nothing else moved. Check `outcome.contractVersion` if you
  are asserting on it anywhere.

- **`presets().localityTrap.constraints.localFirst` changed from `"state"` to
  `"zone"`.** If you cached a preset object or hard-coded the old value in a
  control's default, it is stale. Nothing else about either preset moved.
- **`presets()` and `defaultConfig()` no longer carry `// STUB`.** They were real
  already; the marker was left over. No behaviour change.

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
- **`regionGapPct` on the frontier spans about two points, not twenty.** If you
  scale that axis to the data it will look dramatic; if you scale it 0 to 100 it
  will look flat. Scale it to the data and label it honestly.

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
