import type { CSSProperties } from "react";

// Abstract and medical-adjacent: an ECG-style trace across the lower third and
// a sparse network of nodes and thin links standing for hospitals and the
// movement of organs between them. Inline SVG, no image files and no external
// assets. Nothing anatomical â€” the subject is allocation policy, not surgery.
const NODES = [
  [140, 120],
  [330, 78],
  [520, 148],
  [700, 96],
  [880, 168],
  [1060, 110],
  [255, 226],
  [610, 250],
  [960, 236]
];

const LINKS = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [0, 6],
  [6, 2],
  [2, 7],
  [7, 4],
  [4, 8],
  [1, 6],
  [3, 7]
];

// One period of a resting-rhythm trace: baseline, small P, the QRS spike, T.
const BEAT =
  "l 46 0 l 7 -9 l 7 9 l 30 0 l 9 4 l 7 -34 l 8 52 l 9 -22 l 12 0 l 22 0 " +
  "l 9 -12 l 10 12 l 44 0";

export function HomeBackground() {
  const beats = [0, 1, 2, 3];

  return (
    <svg
      className="home-bg"
      viewBox="0 0 1200 520"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <g className="bg-links" stroke="#DFE1E4" strokeWidth="1" fill="none">
        {LINKS.map((link, index) => {
          const a = NODES[link[0]];
          const b = NODES[link[1]];
          return (
            <line
              key={`${link[0]}-${link[1]}`}
              x1={a[0]}
              y1={a[1]}
              x2={b[0]}
              y2={b[1]}
              // Staggered so the network breathes in a wave rather than pulsing
              // as one block, which would read as a flash.
              style={{ animationDelay: `${index * 320}ms` }}
            />
          );
        })}
      </g>

      <g fill="#2F5D62">
        {NODES.map((node, index) => {
          return (
            <circle
              key={`${node[0]}-${node[1]}`}
              className="bg-node"
              cx={node[0]}
              cy={node[1]}
              r="4"
              opacity="0.28"
              style={{ animationDelay: `${index * 430}ms` }}
            />
          );
        })}
      </g>

      <g stroke="#DFE1E4" strokeWidth="1.5" fill="none" opacity="0.9">
        {beats.map((beat) => {
          return (
            <path
              key={beat}
              className="bg-trace"
              d={`M ${beat * 300 - 20} 410 ${BEAT}`}
              // The dash length only has to exceed the real path length for the
              // draw-on to start fully hidden. 320 comfortably covers one beat.
              style={
                {
                  "--trace-len": "320",
                  animationDelay: `${beat * 420}ms`
                } as CSSProperties
              }
            />
          );
        })}
      </g>
    </svg>
  );
}
