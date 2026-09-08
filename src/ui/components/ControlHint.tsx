import { useEffect, useId, useRef, useState } from "react";
import type { MouseEvent } from "react";

import { CONTROL_HINTS } from "../data/controlHints";
import { placeBubble } from "./hintPlacement";

export interface ControlHintProps {
  hint: string;
}

export function ControlHint(props: ControlHintProps) {
  const text = CONTROL_HINTS[props.hint];
  const iconRef = useRef<HTMLSpanElement | null>(null);
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState({ left: 0, top: 0 });
  const id = useId();

  // Escape closes it, like any other transient overlay.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  if (text === undefined) {
    return null;
  }

  function place() {
    const icon = iconRef.current;
    if (icon === null) {
      return;
    }
    setBox(placeBubble(icon, window.innerWidth));
    setOpen(true);
  }

  function hide() {
    setOpen(false);
  }

  // A <button> inside the <label> these controls use would be activated by the
  // label, so Enter on the icon would toggle the control being read about.
  function keepFocus(event: MouseEvent) {
    event.preventDefault();
  }

  // Mounted always, toggling a class: rendering it only when open would mount
  // it already at `is-open` and the fade would never run.
  let bubbleClass = "hint-bubble";
  if (open) {
    bubbleClass = "hint-bubble is-open";
  }

  let describedBy = undefined;
  if (open) {
    describedBy = id;
  }

  return (
    <>
      <span
        ref={iconRef}
        className="hint-icon"
        tabIndex={0}
        aria-label="What this control does"
        aria-describedby={describedBy}
        onMouseEnter={place}
        onMouseLeave={hide}
        onFocus={place}
        onBlur={hide}
        onMouseDown={keepFocus}
      >
        i
      </span>
      <span
        id={id}
        role="tooltip"
        aria-hidden={open === false}
        className={bubbleClass}
        style={box}
      >
        {text}
      </span>
    </>
  );
}
