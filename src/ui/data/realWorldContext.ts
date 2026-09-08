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
    definition:
      "Total extra years of life expected across every recipient, summed.",
    inPractice:
      "In practice: a transplant adds roughly 17 years of life expectancy for " +
      "recipients aged 20-39, and about 4 years for those aged 60-74. " +
      "Source: SRTR life-years-from-transplant analyses."
  },

  waitlistDeaths: {
    definition:
      "Patients who died while still waiting, having never received an organ.",
    inPractice:
      "In practice: annual deaths run about 16.5 per 100 patient-years on " +
      "dialysis, 2.4 on the waiting list, and 1.2 after transplant. " +
      "Source: Clinical Kidney Journal, 2018."
  },

  overSixtyRatePct: {
    definition:
      "The share of listed patients aged over 60 who received a transplant. " +
      "This is the number that collapses under a life-years-maximising policy.",
    inPractice:
      "In practice: among elderly dialysis patients, transplantation carries " +
      "about a 41% lower risk of death than comparable candidates left on the " +
      "waiting list. Source: Indian Journal of Nephrology."
  },

  meanColdIschemiaHours: {
    definition:
      "Average time each organ spent outside a body before transplant.",
    inPractice:
      "In practice: kidney cold ischemia is generally kept under 24 hours, " +
      "with under 18 preferred."
  },

  transplants: {
    definition:
      "Total kidneys successfully transplanted over the two-year run.",
    inPractice:
      "In practice: kidney transplantation carries roughly a 40% reduced risk " +
      "of death against matched dialysis patients in India. " +
      "Source: NOTTO-recognised centre guidance."
  },

  regionGapPct: {
    definition:
      "The gap in transplant rate between the best-served and worst-served " +
      "zone, in percentage points. It compares only the two extremes."
  },

  zoneGiniPct: {
    definition:
      "Inequality across all three zones rather than just the best and worst. " +
      "It can stay flat while the regional gap moves, which is why both are " +
      "shown."
  },

  medianWaitDays: {
    definition:
      "How long the middle patient waited. Half waited less, half waited " +
      "more. It can fall because patients were served faster, or because the " +
      "slowest-waiting patients stopped being transplanted at all."
  },

  p90WaitDays: {
    definition:
      "How long the unluckiest tenth waited. It shows the tail the median " +
      "hides."
  },

  organsDiscarded: {
    definition:
      "Organs retrieved but never transplanted, usually because no compatible " +
      "patient was reachable within the cold ischemia limit."
  },

  meanGraftQuality: {
    definition:
      "Average expected quality of the transplanted organs, from 0 to 1. " +
      "Higher means better-matched, longer-lasting grafts."
  }
};

// Shown once at the top of the grid, never per tile.
export const CONTEXT_DISCLAIMER =
  "Simulated on synthetic patients. Grey text explains what each measure is; " +
  "lines marked 'In practice' are published real-world figures, not a " +
  "benchmark this model is fitted to.";
