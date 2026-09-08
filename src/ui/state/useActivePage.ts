import { useState } from "react";

// Tab state is React state and nothing more. No router, no new dependency:
// there is no URL to restore and package.json is shared.
export type PageId = "outcome" | "reach" | "tradeoffs" | "movers" | "compare";

export interface PageSpec {
  id: PageId;
  label: string;
  // The one claim the page exists to make. Shown under the tabs so a reader
  // knows what they are looking at before they read a number.
  claim: string;
}

export const PAGES: PageSpec[] = [
  {
    id: "outcome",
    label: "Policy and outcome",
    claim: "What this policy does over two years."
  },
  {
    id: "reach",
    label: "Who it reaches",
    claim: "Who it serves, who it misses, and whether the run has settled."
  },
  {
    id: "tradeoffs",
    label: "Trade-offs",
    claim: "What a different weighting would buy, and what a floor costs."
  },
  {
    id: "movers",
    label: "What moves it",
    claim: "Which levers matter, and whether the finding survives the seed."
  },
  {
    id: "compare",
    label: "Compare",
    claim: "This policy against another, down to the individual patient."
  }
];

export interface ActivePage {
  page: PageId;
  setPage: (next: PageId) => void;
}

export function useActivePage(): ActivePage {
  const [page, setPage] = useState<PageId>("outcome");
  return { page, setPage };
}
