import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import { defaultConfig, runSimulation } from "../../engine/index";
import type { Outcome, PolicyConfig } from "../../contract/types";

// runSimulation costs about 0.65s, so it is never called from a control's own
// change event. Edits land in state immediately and the run trails them by this
// much, which keeps a slider drag smooth and collapses a burst into one run.
const DEBOUNCE_MS = 300;

// How long to wait for the paint frame before running anyway. It has to be
// longer than a frame, or a zero-delay timer would win the race in a healthy
// page and the frame would never get its chance to paint.
const FRAME_FALLBACK_MS = 50;

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

    let frame = 0;
    let fallback: ReturnType<typeof setTimeout> | undefined;
    let done = false;

    function execute() {
      if (done) {
        return;
      }
      done = true;
      cancelAnimationFrame(frame);
      if (fallback !== undefined) {
        clearTimeout(fallback);
      }

      // Checked before the run, not after, so a superseded config does not
      // spend 0.65s on a result that is thrown away.
      if (mine !== generation.current) {
        return;
      }
      const next = runSimulation(config);
      setOutcome(next);
      setRunning(false);
    }

    const timer = setTimeout(() => {
      // Yielding a frame lets the pending state paint before the main thread
      // blocks. But rAF is suspended whenever the page is not compositing — a
      // background tab, an occluded or minimised window — and it does not fire
      // on refocus either, so the run must not depend on it. Whichever of these
      // arrives first wins, and `done` makes sure only one runs.
      frame = requestAnimationFrame(execute);
      fallback = setTimeout(execute, FRAME_FALLBACK_MS);
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
      if (fallback !== undefined) {
        clearTimeout(fallback);
      }
    };
  }, [config]);

  return { config, outcome, running, setConfig };
}
