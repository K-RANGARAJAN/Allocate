import type { MetricKey } from "../../contract/types";

// Published figures, hardcoded as citations. They are context sitting near a
// simulated number, never a benchmark it is fitted to and never something to
// compare against: nothing anywhere derives a difference, ratio or percentage
// between one of these and the value on the tile.
//
// Only the metrics below carry a note. The rest get nothing — an anchor is not
// invented to fill a gap.
export const REAL_WORLD_CONTEXT: Partial<Record<MetricKey, string>> = {
  lifeYearsGained:
    "In practice: a transplant adds roughly 17 years of life expectancy for " +
    "recipients aged 20-39, and about 4 years for those aged 60-74. " +
    "Source: SRTR life-years-from-transplant analyses.",

  waitlistDeaths:
    "In practice: annual deaths run about 16.5 per 100 patient-years on " +
    "dialysis, 2.4 on the waiting list, and 1.2 after transplant. " +
    "Source: Clinical Kidney Journal, 2018.",

  overSixtyRatePct:
    "In practice: among elderly dialysis patients, transplantation carries " +
    "about a 41% lower risk of death than comparable candidates left on the " +
    "waiting list. Source: Indian Journal of Nephrology.",

  meanColdIschemiaHours:
    "In practice: kidney cold ischemia is generally kept under 24 hours, with " +
    "under 18 preferred.",

  transplants:
    "In practice: kidney transplantation carries roughly a 40% reduced risk " +
    "of death against matched dialysis patients in India. " +
    "Source: NOTTO-recognised centre guidance."
};

// Shown once at the top of the grid, never per tile. This is the sentence that
// stops a reader treating the simulated figure and the published one as two
// measurements of the same thing.
export const CONTEXT_DISCLAIMER =
  "Simulated on synthetic patients. Real-world figures below each metric are " +
  "published context, not a benchmark this model is fitted to.";
