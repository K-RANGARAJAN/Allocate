import { useEffect, useRef, useState } from "react";

import { FULL_COUNT_MS } from "../state/useMotion";

export interface CountUpProps {
  value: number;
  animate: boolean;
}

// Presentation only. The interpolation never becomes the answer: the final
// frame is assigned the engine's value verbatim, and when animation is off the
// value is rendered directly with no arithmetic at all.
export function CountUp(props: CountUpProps) {
  const [shown, setShown] = useState(props.value);
  const from = useRef(props.value);

  useEffect(() => {
    if (props.animate === false) {
      setShown(props.value);
      from.current = props.value;
      return;
    }

    const start = performance.now();
    const begin = from.current;
    const target = props.value;
    let frame = 0;

    function step(now: number) {
      const elapsed = now - start;
      if (elapsed >= FULL_COUNT_MS) {
        // The engine's number, not an interpolated one.
        setShown(target);
        from.current = target;
        return;
      }
      const progress = elapsed / FULL_COUNT_MS;
      const eased = 1 - Math.pow(1 - progress, 3);
      setShown(Math.round(begin + (target - begin) * eased));
      frame = requestAnimationFrame(step);
    }

    frame = requestAnimationFrame(step);

    // rAF is suspended whenever the page is not compositing, and a frozen
    // count-up would leave an interpolated number on screen as if it were the
    // answer. This guarantees the engine's value lands regardless.
    const settle = setTimeout(() => {
      setShown(target);
      from.current = target;
    }, FULL_COUNT_MS + 50);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(settle);
      from.current = target;
    };
  }, [props.value, props.animate]);

  return <>{shown}</>;
}
