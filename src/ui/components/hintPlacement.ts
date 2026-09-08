export const BUBBLE_WIDTH = 260;
const GAP = 12;
const EDGE = 8;

export interface HintBox {
  left: number;
  top: number;
}

// Where the bubble goes. It is anchored to the drawer's right edge rather than
// the icon's, so it clears the whole control column instead of landing on the
// next control down — the point is to not cover what is being read about. It
// flips to the left of the icon when there is no room on the right.
//
// This is layout arithmetic on screen coordinates. It touches no simulation
// value and displays no number.
export function placeBubble(icon: HTMLElement, viewportWidth: number): HintBox {
  const rect = icon.getBoundingClientRect();
  const host = icon.closest(".drawer");

  let anchor = rect.right;
  if (host !== null) {
    anchor = host.getBoundingClientRect().right;
  }

  let left = anchor + GAP;
  if (left + BUBBLE_WIDTH > viewportWidth - EDGE) {
    left = rect.left - BUBBLE_WIDTH - GAP;
  }
  if (left < EDGE) {
    left = EDGE;
  }

  return { left, top: rect.top };
}
