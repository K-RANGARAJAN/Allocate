// First come, first served. The baseline that ignores everything except how
// long someone has been waiting. It exists so the other two policies have a
// null hypothesis to be compared against.

import type { PolicyConfig } from "../../contract/types";
import type { Organ, Patient } from "../model";

export function selectRecipient(
  eligiblePatients: Patient[],
  _organ: Organ,
  _config: PolicyConfig,
  _currentDay: number
): Patient | null {
  if (eligiblePatients.length === 0) {
    return null;
  }

  let best = eligiblePatients[0];
  for (const candidate of eligiblePatients) {
    if (candidate.listedDay < best.listedDay) {
      best = candidate;
    }
  }
  return best;
}
