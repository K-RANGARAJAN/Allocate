// Scaffold only. This exists to prove the engine import path works end to end.
// The interface half (Ranga) replaces this file entirely.

import { defaultConfig, runSimulation } from "../engine/index";

export function App() {
  const outcome = runSimulation(defaultConfig());
  const metrics = outcome.metrics;

  return (
    <div>
      <h1>Resonance</h1>
      <p>Engine contract version {outcome.contractVersion}. Stub data.</p>
      <p>transplants: {metrics.transplants}</p>
      <p>lifeYearsGained: {metrics.lifeYearsGained}</p>
      <p>waitlistDeaths: {metrics.waitlistDeaths}</p>
      <p>medianWaitDays: {metrics.medianWaitDays}</p>
      <p>p90WaitDays: {metrics.p90WaitDays}</p>
      <p>organsDiscarded: {metrics.organsDiscarded}</p>
      <p>meanColdIschemiaHours: {metrics.meanColdIschemiaHours}</p>
      <p>meanGraftQuality: {metrics.meanGraftQuality}</p>
      <p>regionGapPct: {metrics.regionGapPct}</p>
    </div>
  );
}
