import type { MetricKey } from "../../contract/types";

export interface MetricContext {
  // What the measure is. Plain wording, no prefix and no source, because it is
  // a definition rather than a claim about the world.
  definition?: string;
  // A published real-world figure, always carrying its source. It lives in its
  // own field so it can never be confused with the definition above it.
  inPractice?: string;
}

// Static text, hardcoded. The published figures are context sitting near a
// simulated number, never a benchmark it is fitted to and never something to
// compare against: nothing anywhere derives a difference, ratio or percentage
// between one of these and the value on the tile.
export const REAL_WORLD_CONTEXT: Partial<Record<MetricKey, MetricContext>> = {
  lifeYearsGained: {
    inPractice:
      "In practice: a transplant adds roughly 17 years of life expectancy for " +
      "recipients aged 20-39, and about 4 years for those aged 60-74. " +
      "Source: SRTR life-years-from-transplant analyses."
  },

  waitlistDeaths: {
    inPractice:
      "In practice: annual deaths run about 16.5 per 100 patient-years on " +
      "dialysis, 2.4 on the waiting list, and 1.2 after transplant. " +
      "Source: Clinical Kidney Journal, 2018."
  },

  overSixtyRatePct: {
    inPractice:
      "In practice: among elderly dialysis patients, transplantation carries " +
      "about a 41% lower risk of death than comparable candidates left on the " +
      "waiting list. Source: Indian Journal of Nephrology."
  },

  meanColdIschemiaHours: {
    inPractice:
      "In practice: kidney cold ischemia is generally kept under 24 hours, " +
      "with under 18 preferred."
  },

  transplants: {
    inPractice:
      "In practice: kidney transplantation carries roughly a 40% reduced risk " +
      "of death against matched dialysis patients in India. " +
      "Source: NOTTO-recognised centre guidance."
  }
};

// Shown once at the top of the grid, never per tile.
export const CONTEXT_DISCLAIMER =
  "Simulated on synthetic patients. Real-world figures below each metric are " +
  "published context, not a benchmark this model is fitted to.";
