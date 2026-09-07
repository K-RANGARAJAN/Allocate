export const CONTRACT_VERSION = "1.0.0";

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

export interface ParetoPoint {
  label: string;
  weights: PolicyConfig["weights"];
  lifeYearsGained: number;
  regionGapPct: number;
  waitlistDeaths: number;
  dominated: boolean;
  isCurrent: boolean;
}
