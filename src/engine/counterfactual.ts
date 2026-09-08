// Who paid for the policy.
//
// "+4,600 life-years, +108 deaths" is an accounting entry. It is also 108 people
// who would have been transplanted under one rule and died waiting under
// another, and because both runs use the same seed they are the *same* people in
// both worlds, not a statistical like-for-like.
//
// Nothing here is modelled. Both runs already record patientId, age, zone,
// hospital type and wait days on every transplant and every death, so this is a
// join between two event logs and no new assumption enters anywhere.

import type {
  CounterfactualBandRow,
  CounterfactualPatient,
  CounterfactualReport,
  PolicyConfig
} from "../contract/types";
import { AGE_BANDS, ageBandOf } from "./metrics";
import { COUNTERFACTUAL_SAMPLE_CAP } from "./model";
import type { DeathEvent, SimulationLog, TransplantEvent } from "./model";

interface Divergence {
  transplant: TransplantEvent;
  death: DeathEvent;
}

function indexDeaths(log: SimulationLog): Map<string, DeathEvent> {
  const byId = new Map<string, DeathEvent>();
  for (const event of log.deaths) {
    byId.set(event.patientId, event);
  }
  return byId;
}

// Transplanted in one world, died waiting in the other.
function divergences(
  transplantedIn: SimulationLog,
  diedIn: SimulationLog
): Divergence[] {
  const deaths = indexDeaths(diedIn);
  const out: Divergence[] = [];

  for (const transplant of transplantedIn.transplants) {
    const death = deaths.get(transplant.patientId);
    if (death) {
      out.push({ transplant, death });
    }
  }

  return out;
}

function toPatient(divergence: Divergence): CounterfactualPatient {
  const transplant = divergence.transplant;
  return {
    patientId: transplant.patientId,
    age: transplant.age,
    ageBand: ageBandOf(transplant.age),
    zone: transplant.zone,
    hospitalType: transplant.hospitalType,
    waitDays: transplant.waitDays,
    transplantDay: transplant.day,
    deathDay: divergence.death.day
  };
}

// Longest wait first. The person who had been waiting eight years and was
// passed over is the one worth putting at the top of the table.
function sortAndCap(divergences: Divergence[]): CounterfactualPatient[] {
  const patients = divergences.map(toPatient);
  patients.sort((a, b) => {
    return b.waitDays - a.waitDays;
  });
  return patients.slice(0, COUNTERFACTUAL_SAMPLE_CAP);
}

function bandRows(lost: Divergence[], gained: Divergence[]): CounterfactualBandRow[] {
  const rows: CounterfactualBandRow[] = [];

  for (const band of AGE_BANDS) {
    const lostCount = lost.filter((item) => {
      return ageBandOf(item.transplant.age) === band;
    }).length;
    const gainedCount = gained.filter((item) => {
      return ageBandOf(item.transplant.age) === band;
    }).length;
    rows.push({ band, lost: lostCount, gained: gainedCount });
  }

  return rows;
}

// Both logs must come from the same seed or the patients are different people.
// The caller is responsible for that; runCounterfactual in index.ts forces it.
export function buildCounterfactual(
  baselineLog: SimulationLog,
  scenarioLog: SimulationLog,
  baselineLabel: string,
  scenarioLabel: string,
  seed: number,
  runtimeMs: number
): CounterfactualReport {
  const lost = divergences(baselineLog, scenarioLog);
  const gained = divergences(scenarioLog, baselineLog);

  return {
    baselineLabel,
    scenarioLabel,
    seed,
    lostCount: lost.length,
    gainedCount: gained.length,
    lost: sortAndCap(lost),
    gained: sortAndCap(gained),
    sampleCap: COUNTERFACTUAL_SAMPLE_CAP,
    byAgeBand: bandRows(lost, gained),
    runtimeMs
  };
}

export function configWithSeed(config: PolicyConfig, seed: number): PolicyConfig {
  const next = JSON.parse(JSON.stringify(config)) as PolicyConfig;
  next.sim.seed = seed;
  return next;
}
