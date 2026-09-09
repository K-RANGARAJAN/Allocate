import { useEffect, useRef, useState } from "react";

import { CONTRACT_VERSION } from "../../contract/types";
import type { Outcome } from "../../contract/types";

export interface Scenario {
  id: number;
  label: string;
  outcome: Outcome;
}

export interface ScenarioStore {
  scenarios: Scenario[];
  save: (outcome: Outcome, name: string) => void;
  remove: (id: number) => void;
  exportJson: () => void;
}

// Two score-mode scenarios used to be indistinguishable, both reading
// "Scenario 1 · score". The weights are what the user actually changed, so they
// belong in the name. Everything is read off the config echoed back on the
// Outcome rather than live control state, which may already have moved on.
export function generatedLabel(outcome: Outcome, id: number) {
  const w = outcome.config.weights;
  return `${id}. ${outcome.config.mode} ${w.urgency}/${w.lifeYears}/${w.waitingTime}`;
}

const STORAGE_KEY = "allocate.scenarios";

interface StoredShape {
  contractVersion: string;
  nextId: number;
  scenarios: Scenario[];
}

// Every read and write is wrapped. localStorage throws rather than returning
// null in a private window, when site data is blocked, and when the quota is
// full, and a saved scenario is a convenience - it must never be the reason the
// app fails to start.
function readStored(): StoredShape | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return null;
    }

    const parsed = JSON.parse(raw) as StoredShape;
    if (Array.isArray(parsed.scenarios) === false) {
      return null;
    }

    // A scenario saved under an older contract holds an Outcome of the old
    // shape, and the panels would render it against today's fields. Dropping
    // them is better than showing a table with holes in it.
    if (parsed.contractVersion !== CONTRACT_VERSION) {
      return null;
    }

    return parsed;
  } catch (error) {
    return null;
  }
}

function writeStored(scenarios: Scenario[], nextId: number): void {
  try {
    const payload: StoredShape = {
      contractVersion: CONTRACT_VERSION,
      nextId,
      scenarios
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    // Most likely the quota: an Outcome is a few kilobytes and a determined
    // user can save a lot of them. The scenario still works for this session,
    // it just will not survive a reload, which is the old behaviour.
  }
}

// Scenarios live in localStorage so they survive a reload, and leave as JSON.
// There is still no backend and nothing leaves the browser. This overturns the
// original "held in memory" decision in ARCHITECTURE.md, on Vignesh's call,
// because a saved policy that vanishes on refresh is not really saved.
export function useScenarios(): ScenarioStore {
  const [scenarios, setScenarios] = useState<Scenario[]>(() => {
    const stored = readStored();
    if (stored === null) {
      return [];
    }
    return stored.scenarios;
  });

  const nextId = useRef(1);
  const loaded = useRef(false);

  // Restored once, before the first write, so ids continue rather than
  // colliding with a label already on screen.
  if (loaded.current === false) {
    loaded.current = true;
    const stored = readStored();
    if (stored !== null && typeof stored.nextId === "number") {
      nextId.current = stored.nextId;
    }
  }

  useEffect(() => {
    writeStored(scenarios, nextId.current);
  }, [scenarios]);

  function save(outcome: Outcome, name: string) {
    const id = nextId.current;
    nextId.current = id + 1;

    let label = name.trim();
    if (label.length === 0) {
      label = generatedLabel(outcome, id);
    }

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
    link.download = "allocate-scenarios.json";
    link.click();

    URL.revokeObjectURL(url);
  }

  return { scenarios, save, remove, exportJson };
}
