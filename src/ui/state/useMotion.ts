import { useEffect, useState } from "react";

// Two tiers. Full is for a preset click and first load, where the whole picture
// changes and the change is worth narrating. Quiet is for a slider-driven run,
// where a count-up would make a drag feel laggy and the numbers should simply
// swap. A page switch is never animated.
export type MotionTier = "full" | "quiet";

export const FULL_COUNT_MS = 600;
export const FULL_CHART_MS = 800;
export const QUIET_CHART_MS = 300;

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);

    function onChange(event: MediaQueryListEvent) {
      setReduced(event.matches);
    }

    query.addEventListener("change", onChange);
    return () => {
      query.removeEventListener("change", onChange);
    };
  }, []);

  return reduced;
}

export function chartDurationFor(tier: MotionTier, reduced: boolean) {
  if (reduced) {
    return 0;
  }
  if (tier === "full") {
    return FULL_CHART_MS;
  }
  return QUIET_CHART_MS;
}
