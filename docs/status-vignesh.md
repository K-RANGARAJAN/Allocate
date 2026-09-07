# Status — Vignesh (Engine)
Updated: 2026-09-07 18:08 IST / c0f7b6c
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

- Added `src/engine/policies/fcfs.ts`. Longest wait wins, nothing else
  considered. It is the null hypothesis the other two policies get measured
  against.
- Added a graft quality floor. `MIN_VIABLE_QUALITY` is 0.6, anchored to a donor
  of about 65 with no transport damage. Organs under it are discarded with the
  reason `graft quality too low`. Default discards go from 0 to 38 of 1170,
  3.2%, so there is now a real baseline for policy to move.
- Added `scripts/conflict-check.ts` and **Gate A passed**. Pure urgency
  transplants 23.2% of over-60s. Pure life-years transplants **0%** of them.
  Not a low rate, zero, across 730 days — and there is no age rule anywhere in
  the engine. The weights do it alone, which is exactly the finding the project
  is built to show. It is not free either: life-years weighting kills 1409 on
  the list against urgency's 1248.
- `runSimulation` is real. It runs the day loop, aggregates the event log, and
  returns genuine numbers. The `// STUB` marker is gone and the dummy builders
  are deleted. `runSensitivity` and `runParetoSweep` are still stubs.
- Added the real breakdowns. Age bands are exactly `18-39`, `40-59`, `60-69`,
  `70+`, in that order, always all four. Zones always all three, hospital types
  always both, and all three discard reasons are always returned including at
  zero, so your tables never grow or shrink between runs.
- Added the real headline metrics to `metrics.ts`. All nine come off the event
  log. Wait times are measured over transplanted patients, the standard registry
  reading — people still waiting have no completed wait to report.
  `regionGapPct` is the widest gap between any two zones' transplant rates.
  Every mean and percentile returns 0 rather than NaN on an empty series.
- Added offer acceptance and the three discard paths. Centres decline at the
  rate in `OFFER_ACCEPTANCE_RATE`, each refusal costs two hours and sends the
  organ down the list, up to five offers. Every organ now ends as exactly one
  transplant or one discard, so organ conservation is structural.
- Added the allocation step to the day loop. Organs arriving on a day are
  matched against every waiting patient by `isEligible`, and the score policy
  picks the recipient. Cold time is travel plus decline delay, graft quality is
  donor quality after ischemia damage, and life years delivered are the estimate
  at listing scaled by that quality — a smaller number than the policy scored on.
- Added the real day loop skeleton to `src/engine/simulate.ts`: listings,
  urgency drift, daily death hazard, timeline points every 30 days plus a
  closing point. Allocation is the next commit. The event log types live in
  `model.ts` so simulate and metrics do not import each other.
- `constraints.maxAgeToList` is now enforced, at listing, which is the only
  place it belongs. Patients over the cap are never listed.
- Added `src/engine/policies/score.ts`: `scoreCandidate` and `selectRecipient`.
  Weights are normalised internally, so all-1.0 means an equal split. Three
  components each in 0..1: current urgency over 10, expected years over
  BASE_LIFE_YEARS, and years waited capped at 5. Longest wait breaks ties, so
  the result does not depend on array order. Nothing in the file mentions age.
- Added `scripts/distributions.ts`. Run it with
  `npx tsx scripts/distributions.ts`. It builds the world without simulating it
  and prints every distribution, so the inputs can be checked before anything
  depends on them.
- Task 002 gate passed. Mean expected life years at listing: 18-39 band 15.23,
  60-78 band 3.85. The old band is 25.3% of the young band, well under the 50%
  the gate requires. The age gradient the whole project rests on is real and
  came out of the formula, not out of a rule.
- Scarcity is 0.184 organs per patient ever listed: 1198 organs against 6528
  patients. Roughly one in five gets transplanted, so policy actually has to
  choose.
- Added `src/engine/organs.ts`: `generateOrganArrivals`. 0.8 donors a day scaled
  by `donationRateMultiplier`, two kidneys per donor sharing a donorId. Donor
  zones are the inverse of patient zones, south 45 north 33 west 22, so
  geography creates real pressure instead of being decorative.
- Moved the shared vocabulary and the seeded samplers into `model.ts` so
  population and organ generation depend on one module rather than each other.
- Added `src/engine/population.ts`: `generateInitialWaitlist` and
  `generateNewListings`. Blood group, age, zone and hospital type on the
  specified distributions, comorbidity trending with age but with real spread,
  base urgency trending with comorbidity. The initial 2000 are backdated across
  the previous 900 days, so day zero already has people who have waited years.
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

- Task 004: the TRANSTAN cascade and hospital rota, then policy dispatch.
  Ends at Gate B.
- Task 003, the first real vertical slice: score policy, the day loop, real
  metrics. `runSimulation` is still stubbed until the last commit of the task.
- Task 002, the world model: constants and formulas, compatibility rules,
  synthetic patients, synthetic organ arrivals.

## Stubbed or fake, do not trust

- `runSensitivity` and `runParetoSweep`. Every number they return is invented.
  Only the shapes are real. Do not demo either of them.
- `meta.runtimeMs` is now a real measurement, and is the one documented
  exception to byte-identical determinism.

## I need from the other side

- Nothing blocking. Build against `src/engine/index.ts` and tell me the moment
  you want a number that is not on the `Outcome`.

## Warnings

- `runSimulation` now takes about 0.7 seconds instead of being instant. If you
  are calling it on every slider drag, debounce it.
- `medianWaitDays` reads 923 at default, larger than the 730 day run. That is
  correct: the initial 2000 are backdated up to 900 days, so their waits started
  before day zero.
- `regionGapPct` is 0.6 at default. Also correct — with `localFirst` off and no
  geographic preference in the score policy, zones equalise. The regional
  disparity story is the cascade policy in task 004, not this.

- Age band strings changed from the stub set. They were `18-34`, `35-49`,
  `50-64`, `65+`. They are now `18-39`, `40-59`, `60-69`, `70+`. If you hard
  coded band names or colours anywhere, update them. These four are final.

- `discardReasons` now has **four** rows, not three. The new one is
  `graft quality too low`. If you sized or coloured that table for three, fix it.
- The quality discards are almost entirely donor-age driven, not geography
  driven. `ISCHEMIA_FREE_HOURS` is 12 and the worst journey in the model is 13
  hours, so transport barely damages anything and shortening it barely helps.
  Task 007 wants `localityTrap` to cut discards; on this model it may not, and I
  will report that rather than move the constant (R2).
- The "declined by all centres" discard is effectively unreachable: five offers
  at 85% acceptance is a 1 in 13,000 event, about 0.09 organs across a whole
  run. Those are the roadmap's numbers and I am not tuning them (R2).

- `expectedLifeYearsAtListing` can exceed `BASE_LIFE_YEARS` slightly for
  patients under 20, topping out at 22.73 for an 18 year old with no
  comorbidity. That is the roadmap's formula applied faithfully, and it affects
  about a hundred patients out of six and a half thousand. Leaving it rather
  than tuning it.
- `presets().utilityTrap` changed shape of behaviour, not shape of data. If you
  cached its constraint values anywhere, re-read them.
- No contract fields added, renamed or removed. Nothing in the `Outcome` moved.
