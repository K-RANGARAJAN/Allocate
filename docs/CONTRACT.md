# Contract

**Version 1.8.0**

This document is the prose companion to `src/contract/types.ts`. The types file is
the machine-readable truth. This file explains what the fields mean.

Neither developer changes the contract without messaging the other first. When it
changes, `CONTRACT_VERSION` changes with it and both status files are updated.

## The ten-function API

`src/engine/index.ts` exports exactly these ten functions and nothing else. The
interface imports from this module only, never from engine internals.

| Function | Returns | Cost | Purpose |
| --- | --- | --- | --- |
| `defaultConfig()` | `PolicyConfig` | instant | The baseline policy the app opens on |
| `presets()` | `Record<string, PolicyConfig>` | instant | Named policies, currently `utilityTrap` and `localityTrap` |
| `runSimulation(config)` | `Outcome` | ~0.65s | Two years of allocation under one policy |
| `runSensitivity(config)` | `SensitivityRow[]` | 10-12s | One lever moved at a time, ranked by impact |
| `runParetoSweep(config, points)` | `ParetoPoint[]` | ~0.7s per point | A sweep across the weight space |
| `compareOutcomes(baseline, scenario, baselineLabel?, scenarioLabel?)` | `ScenarioComparison` | instant | Two finished outcomes as one delta table |
| `runRobustness(config, seeds?)` | `RobustnessReport` | ~13s at 20 seeds | Every metric as a range across many seeds |
| `runCounterfactual(baseline, scenario, baselineLabel?, scenarioLabel?)` | `CounterfactualReport` | ~1.5s | The individual patients whose outcome the policy changed |
| `runConstrainedFrontier(config, points, constraint, objective?)` | `ConstrainedFrontierReport` | one sweep | What holding a user-set constraint costs |
| `runModeComparison(config)` | `ModeComparison` | ~2.4s | The same settings under all three allocation rules |

The last three run in a worker, behind an explicit button, never on a control
change. `runRobustness` is the most expensive call on the contract: it is one
full simulation per seed.

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
| `regionGapPct`, `ratePct`, `overSixtyRatePct` | percentage points, 0 to 100 |
| `durationDays` | days |
| `donationRateMultiplier` | multiplier, 1.0 is baseline |
| `urgency`, `minUrgencyToList` | 0 to 10 |
| `transplants`, `waitlistDeaths`, `organsDiscarded` | counts, never negative |

## Slider ranges and defaults

| Control | Range | Default |
| --- | --- | --- |
| `weights.urgency` | 0 to 1 step 0.01 | 0.33 |
| `weights.lifeYears` | 0 to 1 step 0.01 | 0.33 |
| `weights.waitingTime` | 0 to 1 step 0.01 | 0.33 |
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

Two fields are legitimately `null`. `constraints.maxAgeToList` null means no
upper age limit on listing. `ModeMetricRow.best` null means no allocation rule
reads best on that metric, either because the metric has no honest direction or
because the rules tied. Every other numeric field is always a finite number. The
smoke test enforces this.

## Three rules, one population

`runModeComparison(config)` runs the caller's settings under all three allocation
rules at one seed, so the same synthetic patients and the same organs meet the
weighted score, the Tamil Nadu cascade and first come first served. About three
times a single run, so roughly 2.4 seconds. Worker only.

`rows` is one entry per metric with the value under each rule, plus `best` and
`spread`. **`best` is null wherever no rule genuinely wins**: always for
`overSixtyRatePct`, because whether more or fewer older recipients is an
improvement is the argument this platform refuses to settle, and on any metric
where the three rules tie. The interface must not mark a winner the engine did
not name.

`byAgeBand` and `byZone` give the transplant rate per group under each rule, in
the same order as the matching `Breakdowns` arrays. They are the evidence for who
each rule reaches rather than how much it delivers in total.

`currentMode` echoes the caller's own `config.mode`, so the interface can mark
which column the user is actually running without inferring it.

## Scenario comparison

`compareOutcomes` simulates nothing. Both `Outcome` objects are already in hand,
so it is instant and safe to call on every render. It returns one row per metric
in display order, each with `before`, `after`, `delta`, `deltaPct` and
`betterDirection`.

`deltaPct` is zero when the baseline is zero — read `delta` in that case.
`betterDirection` is `"neutral"` for `overSixtyRatePct`, deliberately: whether
transplanting more or fewer older patients is an improvement is the argument the
platform refuses to settle, so it is not coloured like a score.

## Equity indices

`Outcome.equity` is three rows, always all three, in this order: `zone`,
`ageBand`, `hospitalType`. Each carries a `giniPct` and a `spreadPct` over that
dimension's transplant rates, plus the best and worst group by name.

`spreadPct` is the widest gap between two groups — the same measure
`regionGapPct` uses. `giniPct` reads every group instead of only the extremes.
They are both returned because they disagree, and the disagreement is the point:
a spread can sit still while a middle group moves, and the Gini will catch it.

`metrics.zoneGiniPct` is the zone row's `giniPct`, lifted onto `Metrics` so it
flows through `compareOutcomes` and `runRobustness` like every other metric. It
is computed by the same function as the equity row, so the two can never
disagree.

## Steady state

`Outcome.steadyState` answers whether a number is the policy or the opening
backlog still clearing. The run starts with a backdated waitlist, so the early
months are that queue draining. Each row compares the metric over the final
180-day window against the 180 days before it. `meta.earlyWindowDays` and
`meta.lateWindowDays` say which days those were.

`stabilised` is true when the drift between windows is within 10%.

**`windowable` is false for `regionGapPct`, `overSixtyRatePct` and
`zoneGiniPct`.** Rates are measured against patients *listed*, and someone listed
inside a window is often transplanted long after it, so a rate confined to a
window is not a rate of anything. Those three rows return zeros and the interface
must not display them as numbers — show "not applicable" or omit the row.

## metricOrder is where metric lists come from

`Outcome.metricOrder` is one `{ metric, label }` entry per metric on `Metrics`,
always complete, always in display order. The interface renders every metric list
from it rather than keeping its own copy, so a metric added to the contract
appears everywhere at once and no two panels can name the same number
differently.

It is built from the same list `compareOutcomes` and `steadyState` use, so all
three agree by construction. The smoke test asserts the entry count against
`Metrics`, that every named metric exists, that every entry has a label, and that
the order and labels match `steadyState` position for position.

Read labels and order from here. `steadyState` also carries them and is also
guaranteed complete, but that is a property of what it is for, not a promise
about labelling.

## steadyState is a complete, ordered row set - guaranteed

`Outcome.steadyState` carries **exactly one row per metric on `Metrics`, always,
including the three where `windowable` is false**. It is built by walking the
same ordered list `compareOutcomes` uses, so its order and its `label` strings
are identical to the comparison table's, and it can never fall out of step with
`Metrics`.

It will never be filtered to windowable rows only. If a metric is added to
`Metrics`, a row appears here in the same release. The interface may rely on
this for label and ordering, and the smoke test asserts the row count and the
windowable flags on every run.

## Simulation ranges and what they cost

There are no hard limits. Every corner of the ranges below returns finite,
correctly shaped output - all 11 metrics, 11 `steadyState` rows, 3 equity rows,
4 age bands, a non-empty timeline. An empty world (`initialWaitlistSize` 0 and
`newListingsPerDay` 0) is valid and returns zeros in 1ms rather than throwing.

The limit is time, not correctness. Cost scales with the number of
patient-days simulated:

| Config | One `runSimulation` |
| --- | --- |
| default, 730 days | 0.48s |
| `durationDays` 1460 | 5.0s |
| `initialWaitlistSize` 5000 | 3.3s |
| `newListingsPerDay` 20 | 4.3s |
| all four maxima together | **41s** |

**41 seconds is not survivable on the main thread**, and it makes the four
expensive calls unusable: `runSensitivity` becomes ~12 minutes,
`runParetoSweep` at 20 points ~14 minutes, `runRobustness` ~14 minutes. A user
who drags three sliders to their maxima has frozen the tab with no way back.

Either cap the exposed ranges well below those maxima, or gate the expensive
panels on the estimated cost of the current config. The demo never needs more
than the default 730 days.

## Robustness

`runRobustness(config, seeds?)` re-runs the whole simulation once per seed and
returns each metric as a mean, min and max rather than a point. Omit `seeds` for
the fixed default set of twenty.

`unanimous` is true when every seed returned the identical value. The over-60
rate under `utilityTrap` is 0 on all twenty seeds, and that is worth saying in
those words rather than as "mean 0".

## Counterfactual

`runCounterfactual(baseline, scenario)` runs both configs **at the baseline's
seed**, whatever seed the scenario config carries. That is deliberate: the same
seed means the same synthetic population, so a patient appearing in the result is
one person meeting two different rules, not a statistical average.

`lostCount` is patients transplanted under the baseline who died waiting under
the scenario. `gainedCount` is the reverse. The `lost` and `gained` arrays are
capped at `sampleCap` and sorted longest-wait first — read the counts for totals,
never the array lengths.

`byAgeBand` uses the same four band strings as `breakdowns.byAgeBand`.

## Constrained frontier

`runConstrainedFrontier(config, points, constraint, objective?)` sweeps once,
then reports which swept points satisfy a constraint the **user** set.

The platform names no winner here and the interface must not present `best` as a
recommendation. The honest framing is: you said you will not go below this line,
and here is what holding it costs. `priceOfConstraint` is that cost on the
objective, and it is `null` when no swept point is feasible — which is itself a
finding and should be shown as one, not as an empty chart.

`objective` defaults to `lifeYearsGained`. Direction is taken from the same table
`compareOutcomes` uses, so a "lower is better" objective is minimised correctly.

## Changelog

<!-- One line per contract change: version, date, what moved, who agreed. -->

1.8.0 — 2026-09-08 — added `runModeComparison` with `ModeComparison`,
`ModeMetricRow` and `ModeGroupRow`. Everything else in the project compares
weightings of one scoring rule; this compares the rules themselves, which is the
comparison the project is actually about. `ModeMetricRow.best` is nullable and is
null for `overSixtyRatePct` and on ties, so the engine never names a winner it
has not earned. Agreed by Vignesh.

1.7.0 — 2026-09-08 — added `Outcome.metricOrder` and the `MetricLabel` type, the
canonical display order and label for every metric. Requested by Ranga: his
metric grid was reading labels off `steadyState`, which worked only because that
array happens to be complete, and would have silently lost tiles if it were ever
filtered. Additive; `steadyState` is unchanged and still carries its own labels.
Agreed by Vignesh.

1.6.0 — 2026-09-08 — added `runConstrainedFrontier` with `FrontierConstraint`
and `ConstrainedFrontierReport`, and added `metrics: Metrics` to `ParetoPoint` so
a constraint can be tested against any metric without sweeping twice. The three
existing `ParetoPoint` axis fields are unchanged and still read directly by the
chart. Agreed by Vignesh.

1.5.0 — 2026-09-08 — added `runCounterfactual` with `CounterfactualReport`,
`CounterfactualPatient` and `CounterfactualBandRow`. Both runs are forced onto
the baseline's seed so the patients are the same people under two rules. No new
modelling: it is a join between two existing event logs. Agreed by Vignesh.

1.4.0 — 2026-09-08 — added `runRobustness` with `RobustnessReport` and
`RobustnessRow`. Promotes what was a terminal-only script to the contract so
every headline number can carry a range instead of a point. Agreed by Vignesh.

1.3.0 — 2026-09-08 — added `Outcome.equity` (`EquityIndex`, `EquityDimension`),
`Outcome.steadyState` (`SteadyStateRow`), `metrics.zoneGiniPct`, and
`meta.earlyWindowDays` / `meta.lateWindowDays`. Both new Outcome fields are
aggregation over the log `runSimulation` already produces, so its cost is
unchanged. Also corrected the weight slider step from 0.05 to 0.01: 0.33 is not
reachable on a 0.05 step, so the browser sanitised the input to 0.35 while the
label read 0.33 and the first drag of any weight jumped. Additive except that
step, which was a documentation error. Agreed by Vignesh.

1.2.0 — 2026-09-07 — added a sixth export, `compareOutcomes`, with the
`ScenarioComparison`, `MetricDelta` and `MetricDirection` types. The interface
may not compute a difference (R4) and nothing on the contract returned one,
which left the preset comparisons — the Round 4 demo — with no legitimate route
to the screen. It re-runs nothing. The five existing signatures are untouched.
Agreed by Vignesh, raised by Ranga.

1.1.0 — 2026-09-07 — added `overSixtyRatePct` to `Metrics`. It is the share of
listed patients aged 60 or over who were transplanted, and it is the headline
number of the utilityTrap demo. It spans the `60-69` and `70+` age bands, so
without it the interface would have to sum two breakdown rows and weight them,
which R4 forbids. Additive only, nothing renamed or removed. Agreed by Vignesh.
