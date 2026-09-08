export const CONTRACT_VERSION = "1.6.0";

export type BloodGroup = "A" | "B" | "AB" | "O";
export type ZoneId = "north" | "south" | "west";
export type HospitalType = "government" | "private";
export type PolicyMode = "score" | "cascade" | "fcfs";
export type LocalFirst = "off" | "zone" | "state";

export interface PolicyConfig {
  mode: PolicyMode;
  weights: {
    urgency: number;
    lifeYears: number;
    waitingTime: number;
  };
  constraints: {
    maxColdIschemiaHours: number;
    localFirst: LocalFirst;
    minUrgencyToList: number;
    maxAgeToList: number | null;
    ageMatchingOn: boolean;
    retrievalHospitalKeeps: number;
    rotaEnabled: boolean;
    urgentSupersedesRota: boolean;
  };
  resources: {
    donationRateMultiplier: number;
    transplantCentresPerZone: Record<ZoneId, number>;
  };
  sim: {
    seed: number;
    durationDays: number;
    initialWaitlistSize: number;
    newListingsPerDay: number;
  };
}

export interface Metrics {
  transplants: number;
  lifeYearsGained: number;
  waitlistDeaths: number;
  medianWaitDays: number;
  p90WaitDays: number;
  organsDiscarded: number;
  meanColdIschemiaHours: number;
  meanGraftQuality: number;
  regionGapPct: number;
  // Share of listed patients aged 60 or over who were transplanted. It spans
  // two age bands, so it lives here rather than being summed interface-side.
  overSixtyRatePct: number;
  // Gini coefficient over the three zones' transplant rates, as a percentage.
  // 0 is perfect equality between zones. Unlike regionGapPct, which is only the
  // widest pair, this reads every zone, so a middle zone drifting shows up here
  // and is invisible there.
  zoneGiniPct: number;
}

// How unevenly transplants are distributed across one dimension. The engine
// returns a row per dimension; regionGapPct remains on Metrics as the headline
// zone number, and `spreadPct` here is that same widest-pair figure so the two
// measures can be shown side by side and argued about.
export type EquityDimension = "zone" | "ageBand" | "hospitalType";

export interface EquityIndex {
  dimension: EquityDimension;
  label: string;
  // 0 is perfectly equal. Higher is more unequal. Percentage points.
  giniPct: number;
  // Widest gap between any two groups on this dimension, percentage points.
  spreadPct: number;
  bestGroup: string;
  bestRatePct: number;
  worstGroup: string;
  worstRatePct: number;
}

export interface AgeBandRow {
  band: string;
  listed: number;
  transplanted: number;
  ratePct: number;
}

export interface ZoneRow {
  zone: ZoneId;
  listed: number;
  transplanted: number;
  ratePct: number;
}

export interface HospitalTypeRow {
  hospitalType: HospitalType;
  listed: number;
  transplanted: number;
  ratePct: number;
}

export interface DiscardRow {
  reason: string;
  count: number;
}

export interface Breakdowns {
  byAgeBand: AgeBandRow[];
  byZone: ZoneRow[];
  byHospitalType: HospitalTypeRow[];
  discardReasons: DiscardRow[];
}

export interface TimelinePoint {
  day: number;
  waitlistSize: number;
  cumulativeTransplants: number;
  cumulativeDeaths: number;
}

// Has the run settled, or is what we are measuring still the opening transient?
// The simulation starts with a backdated waitlist, so the first months are that
// backlog clearing rather than the policy running at rest. Each row compares the
// metric over the final window against the window before it.
export interface SteadyStateRow {
  metric: MetricKey;
  label: string;
  earlyWindow: number;
  lateWindow: number;
  // Move from the early window to the late one, as a percentage of the early
  // window. Zero when the early window is zero.
  driftPct: number;
  stabilised: boolean;
  // False where a windowed reading would not mean anything. Rates are measured
  // against patients *listed*, and a patient listed inside a window may be
  // transplanted long after it, so the rate metrics do not window honestly.
  // Their early/late/drift values are returned as 0 and must not be shown.
  windowable: boolean;
}

export interface Outcome {
  contractVersion: string;
  config: PolicyConfig;
  metrics: Metrics;
  breakdowns: Breakdowns;
  timeline: TimelinePoint[];
  // Three rows, always all three, in this order: zone, ageBand, hospitalType.
  equity: EquityIndex[];
  // One row per metric, in the same display order as compareOutcomes.
  steadyState: SteadyStateRow[];
  meta: {
    runtimeMs: number;
    organsArrived: number;
    allocationDecisions: number;
    // The day windows steadyState compares. Both are [inclusive, exclusive).
    earlyWindowDays: [number, number];
    lateWindowDays: [number, number];
  };
}

export type MetricKey = keyof Metrics;

export interface SensitivityRow {
  lever: string;
  label: string;
  deltaPct: Partial<Record<MetricKey, number>>;
  impactScore: number;
}

// Which way a metric has to move to count as an improvement. "neutral" is used
// where the platform deliberately refuses to say — the over-60 transplant rate
// is the argument, not a score, and colouring it green or red would be the
// platform naming a winner.
export type MetricDirection = "higher" | "lower" | "neutral";

export interface MetricDelta {
  metric: MetricKey;
  label: string;
  before: number;
  after: number;
  delta: number;
  // Percentage move from the baseline. Zero when the baseline is zero — read
  // `delta` in that case, not this.
  deltaPct: number;
  betterDirection: MetricDirection;
}

export interface ScenarioComparison {
  baselineLabel: string;
  scenarioLabel: string;
  rows: MetricDelta[];
}

export interface ParetoPoint {
  label: string;
  weights: PolicyConfig["weights"];
  lifeYearsGained: number;
  regionGapPct: number;
  waitlistDeaths: number;
  dominated: boolean;
  isCurrent: boolean;
  // Every metric at this point, so a constraint can be tested against any of
  // them and a tooltip can show more than the two plotted axes. The three
  // fields above are duplicates of entries here, kept because the chart reads
  // them directly.
  metrics: Metrics;
}

// Is the finding a property of the policy, or an accident of one seed? Each row
// is one metric re-measured across many seeds. This is the answer to the single
// question most likely to be asked of every number in this project.
export interface RobustnessRow {
  metric: MetricKey;
  label: string;
  mean: number;
  min: number;
  max: number;
  // True when every seed returned the same value. The over-60 rate under the
  // utility trap is 0 on every seed, and that is worth saying outright.
  unanimous: boolean;
}

export interface RobustnessReport {
  seeds: number[];
  rows: RobustnessRow[];
  runtimeMs: number;
}

// One patient who came out differently under two policies. Both runs use the
// same seed, so this is the same person in both worlds, not a like-for-like
// average.
export interface CounterfactualPatient {
  patientId: string;
  age: number;
  ageBand: string;
  zone: ZoneId;
  hospitalType: HospitalType;
  // Days already waited at the point the outcome diverged.
  waitDays: number;
  // Day of the transplant under whichever policy transplanted them.
  transplantDay: number;
  // Day of death under whichever policy did not.
  deathDay: number;
}

export interface CounterfactualBandRow {
  band: string;
  lost: number;
  gained: number;
}

export interface CounterfactualReport {
  baselineLabel: string;
  scenarioLabel: string;
  seed: number;
  // Transplanted under the baseline, died waiting under the scenario. The true
  // total, even when `lost` below is capped.
  lostCount: number;
  // Died waiting under the baseline, transplanted under the scenario.
  gainedCount: number;
  // Longest-waiting first, capped. Read the counts above for totals.
  lost: CounterfactualPatient[];
  gained: CounterfactualPatient[];
  sampleCap: number;
  byAgeBand: CounterfactualBandRow[];
  runtimeMs: number;
}

// A constraint the user imposes on the search, not one the platform chose.
export interface FrontierConstraint {
  metric: MetricKey;
  direction: "atLeast" | "atMost";
  value: number;
}

// What insisting on that constraint costs. The platform still names no winner:
// the user sets the floor, and this reports the price of holding it.
export interface ConstrainedFrontierReport {
  constraint: FrontierConstraint;
  constraintLabel: string;
  objective: MetricKey;
  objectiveLabel: string;
  points: ParetoPoint[];
  feasibleCount: number;
  // Best on the objective among points meeting the constraint. Null when no
  // swept point meets it, which is itself a finding — show it as such.
  best: ParetoPoint | null;
  // Best on the objective ignoring the constraint entirely.
  unconstrainedBest: ParetoPoint | null;
  currentMeetsConstraint: boolean;
  // unconstrainedBest minus best, on the objective. Zero when the constraint
  // costs nothing, null when nothing is feasible.
  priceOfConstraint: number | null;
  runtimeMs: number;
}
