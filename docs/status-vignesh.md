# Status — Vignesh (Engine)
Updated: 2026-09-07 16:30 IST / f9ce728
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

- `expectedLifeYearsAtListing` can exceed `BASE_LIFE_YEARS` slightly for
  patients under 20, topping out at 22.73 for an 18 year old with no
  comorbidity. That is the roadmap's formula applied faithfully, and it affects
  about a hundred patients out of six and a half thousand. Leaving it rather
  than tuning it.
- `constraints.maxAgeToList` is not enforced anywhere yet. It is a listing rule,
  so it goes in the day loop in task 003, not in patient generation. Until then
  moving that slider will change nothing.
- `presets().utilityTrap` changed shape of behaviour, not shape of data. If you
  cached its constraint values anywhere, re-read them.
- No contract fields added, renamed or removed. Nothing in the `Outcome` moved.
