import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import { defaultConfig, runSimulation } from "../../engine/index";
import type { Outcome, PolicyConfig } from "../../contract/types";

// runSimulation costs about 0.65s, so it is never called from a control's own
// change event. Edits land in state immediately and the run trails them by this
// much, which keeps a slider drag smooth and collapses a burst into one run.
const DEBOUNCE_MS = 300;

export interface PolicyRun {
  config: PolicyConfig;
  outcome: Outcome | null;
  running: boolean;
  setConfig: Dispatch<SetStateAction<PolicyConfig>>;
}

export function usePolicyRun(): PolicyRun {
  const [config, setConfig] = useState<PolicyConfig>(defaultConfig);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [running, setRunning] = useState(true);

  // Guards against a slow run landing after a newer one and overwriting it.
  const generation = useRef(0);

  useEffect(() => {
    setRunning(true);
    generation.current = generation.current + 1;
    const mine = generation.current;

    const timer = setTimeout(() => {
      // Yields a frame first so the pending state paints before the main thread
      // blocks for the run.
      requestAnimationFrame(() => {
        const next = runSimulation(config);
        if (mine !== generation.current) {
          return;
        }
        setOutcome(next);
        setRunning(false);
      });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [config]);

  return { config, outcome, running, setConfig };
}
