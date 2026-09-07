export const CONTRACT_VERSION = "1.2.0";

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

export interface Outcome {
  contractVersion: string;
  config: PolicyConfig;
  metrics: Metrics;
  breakdowns: Breakdowns;
  timeline: TimelinePoint[];
  meta: {
    runtimeMs: number;
    organsArrived: number;
    allocationDecisions: number;
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
}
