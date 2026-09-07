import { useRef, useState } from "react";

import type { Outcome } from "../../contract/types";

export interface Scenario {
  id: number;
  label: string;
  outcome: Outcome;
}

export interface ScenarioStore {
  scenarios: Scenario[];
  save: (outcome: Outcome) => void;
  remove: (id: number) => void;
  exportJson: () => void;
}

// Scenarios live in memory for the session and leave as JSON. There is no
// backend and nothing is persisted, which matches ARCHITECTURE.md.
export function useScenarios(): ScenarioStore {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const nextId = useRef(1);

  function save(outcome: Outcome) {
    const id = nextId.current;
    nextId.current = id + 1;

    // The label reads the config echoed back on the Outcome rather than live
    // control state, which may already have moved on.
    const label = `Scenario ${id} · ${outcome.config.mode}`;
    const scenario = { id, label, outcome };
    setScenarios((prev) => [...prev, scenario]);
  }

  function remove(id: number) {
    setScenarios((prev) => prev.filter((one) => one.id !== id));
  }

  function exportJson() {
    const payload = JSON.stringify(scenarios, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "resonance-scenarios.json";
    link.click();

    URL.revokeObjectURL(url);
  }

  return { scenarios, save, remove, exportJson };
}
