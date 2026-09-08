import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import type { PolicyConfig, ZoneId } from "../../contract/types";
import { CollapsibleGroup } from "./CollapsibleGroup";
import { Select } from "./Select";
import { NumberField } from "./NumberField";
import { PresetButtons } from "./PresetButtons";
import { Slider } from "./Slider";
import { Toggle } from "./Toggle";

export interface ControlsPanelProps {
  config: PolicyConfig;
  setConfig: Dispatch<SetStateAction<PolicyConfig>>;
  setWholeConfig: (next: PolicyConfig) => void;
}

type WeightKey = keyof PolicyConfig["weights"];
type Constraints = PolicyConfig["constraints"];

export const MODE_OPTIONS = [
  { value: "score", label: "Weighted score" },
  { value: "cascade", label: "Cascade (TRANSTAN)" },
  { value: "fcfs", label: "First come, first served" }
];

const LOCAL_FIRST_OPTIONS = [
  { value: "off", label: "Off" },
  { value: "zone", label: "Zone" },
  { value: "state", label: "State" }
];

// The policy panel. Every control is seeded from the live config, which starts
// as defaultConfig(). Ranges come from docs/CONTRACT.md.
type GroupId = "priorities" | "constraints" | "resources" | "none";

export function ControlsPanel(props: ControlsPanelProps) {
  const config = props.config;
  const [open, setOpen] = useState<GroupId>("priorities");

  function toggle(group: GroupId) {
    setOpen((prev) => {
      if (prev === group) {
        return "none";
      }
      return group;
    });
  }

  function setWeight(key: WeightKey, value: number) {
    props.setConfig((prev) => {
      const weights = { ...prev.weights };
      weights[key] = value;
      return { ...prev, weights };
    });
  }

  function setConstraint<K extends keyof Constraints>(
    key: K,
    value: Constraints[K]
  ) {
    props.setConfig((prev) => {
      const constraints = { ...prev.constraints };
      constraints[key] = value;
      return { ...prev, constraints };
    });
  }

  function setCentres(zone: ZoneId, next: number) {
    props.setConfig((prev) => {
      const perZone = { ...prev.resources.transplantCentresPerZone };
      perZone[zone] = next;
      const resources = { ...prev.resources, transplantCentresPerZone: perZone };
      return { ...prev, resources };
    });
  }

  function setSim<K extends keyof PolicyConfig["sim"]>(
    key: K,
    value: PolicyConfig["sim"][K]
  ) {
    props.setConfig((prev) => {
      const sim = { ...prev.sim };
      sim[key] = value;
      return { ...prev, sim };
    });
  }

  function setDonationRate(next: number) {
    props.setConfig((prev) => {
      const resources = { ...prev.resources, donationRateMultiplier: next };
      return { ...prev, resources };
    });
  }

  // null is the contract's way of saying no upper age limit on listing, so the
  // toggle turns the slider off entirely rather than parking it at 90.
  function toggleAgeLimit(enabled: boolean) {
    if (enabled) {
      setConstraint("maxAgeToList", 70);
      return;
    }
    setConstraint("maxAgeToList", null);
  }

  const maxAge = config.constraints.maxAgeToList;
  let ageLimitOn = false;
  if (maxAge !== null) {
    ageLimitOn = true;
  }

  let ageSlider = null;
  if (maxAge !== null) {
    ageSlider = (
      <Slider
        label="Upper age to list"
          hint="maxAgeToList"
        value={maxAge}
        min={50}
        max={90}
        step={1}
        onChange={(next) => setConstraint("maxAgeToList", next)}
      />
    );
  }

  return (
    <section className="controls">
      <CollapsibleGroup
        title="Priorities"
        open={open === "priorities"}
        onToggle={() => toggle("priorities")}
      >
        <PresetButtons onPick={props.setWholeConfig} />
        <p className="panel-note">
          Weights need not sum to 1. The engine normalises them before scoring,
          so three equal values mean an equal split.
        </p>
        <Slider
          label="Urgency"
          hint="weights.urgency"
          value={config.weights.urgency}
          min={0}
          max={1}
          step={0.01}
          onChange={(next) => setWeight("urgency", next)}
        />
        <Slider
          label="Life-years"
          hint="weights.lifeYears"
          value={config.weights.lifeYears}
          min={0}
          max={1}
          step={0.01}
          onChange={(next) => setWeight("lifeYears", next)}
        />
        <Slider
          label="Waiting time"
          hint="weights.waitingTime"
          value={config.weights.waitingTime}
          min={0}
          max={1}
          step={0.01}
          onChange={(next) => setWeight("waitingTime", next)}
        />
      </CollapsibleGroup>

      <CollapsibleGroup
        title="Constraints"
        open={open === "constraints"}
        onToggle={() => toggle("constraints")}
      >
        <Select
          label="Local first"
          hint="localFirst"
          value={config.constraints.localFirst}
          options={LOCAL_FIRST_OPTIONS}
          onChange={(next) =>
            setConstraint("localFirst", next as Constraints["localFirst"])
          }
        />
        <Slider
          label="Max cold ischemia"
          hint="maxColdIschemiaHours"
          value={config.constraints.maxColdIschemiaHours}
          min={4}
          max={36}
          step={1}
          suffix=" h"
          onChange={(next) => setConstraint("maxColdIschemiaHours", next)}
        />
        <Slider
          label="Minimum urgency to list"
          hint="minUrgencyToList"
          value={config.constraints.minUrgencyToList}
          min={0}
          max={10}
          step={1}
          onChange={(next) => setConstraint("minUrgencyToList", next)}
        />
        <Slider
          label="Retrieval hospital keeps"
          hint="retrievalHospitalKeeps"
          value={config.constraints.retrievalHospitalKeeps}
          min={0}
          max={2}
          step={1}
          onChange={(next) => setConstraint("retrievalHospitalKeeps", next)}
        />
        <Toggle
          label="Age matching"
          hint="ageMatchingOn"
          checked={config.constraints.ageMatchingOn}
          onChange={(next) => setConstraint("ageMatchingOn", next)}
        />
        <Toggle
          label="Hospital rota"
          hint="rotaEnabled"
          checked={config.constraints.rotaEnabled}
          onChange={(next) => setConstraint("rotaEnabled", next)}
        />
        <Toggle
          label="Urgent supersedes rota"
          hint="urgentSupersedesRota"
          checked={config.constraints.urgentSupersedesRota}
          onChange={(next) => setConstraint("urgentSupersedesRota", next)}
        />
        <Toggle
          label="Upper age limit on listing"
          hint="maxAgeToList"
          checked={ageLimitOn}
          onChange={toggleAgeLimit}
        />
        {ageSlider}
      </CollapsibleGroup>

      <CollapsibleGroup
        title="Resources"
        open={open === "resources"}
        onToggle={() => toggle("resources")}
      >
        <Slider
          label="Donation rate"
          hint="donationRateMultiplier"
          value={config.resources.donationRateMultiplier}
          min={0.5}
          max={3}
          step={0.1}
          suffix="×"
          onChange={setDonationRate}
        />
        <Slider
          label="Centres, north"
          hint="transplantCentresPerZone"
          value={config.resources.transplantCentresPerZone.north}
          min={1}
          max={15}
          step={1}
          onChange={(next) => setCentres("north", next)}
        />
        <Slider
          label="Centres, south"
          hint="transplantCentresPerZone"
          value={config.resources.transplantCentresPerZone.south}
          min={1}
          max={15}
          step={1}
          onChange={(next) => setCentres("south", next)}
        />
        <Slider
          label="Centres, west"
          hint="transplantCentresPerZone"
          value={config.resources.transplantCentresPerZone.west}
          min={1}
          max={15}
          step={1}
          onChange={(next) => setCentres("west", next)}
        />
        {/*
          These three set how much work a run is, and runSimulation is on the
          main thread. At the old ceilings (1460 days, 5000 waiting, 20 a day)
          a single run took 15 to 41 seconds with the tab frozen and no way
          back, and sensitivity became several minutes. Capped here so the
          worst case anyone can reach is a few seconds. Three years is still
          long enough to answer whether a metric has settled.
        */}
        <Slider
          label="Run length"
          hint="sim.durationDays"
          value={config.sim.durationDays}
          min={90}
          max={1095}
          step={10}
          suffix=" days"
          onChange={(next) => setSim("durationDays", next)}
        />
        <Slider
          label="Initial waitlist"
          hint="sim.initialWaitlistSize"
          value={config.sim.initialWaitlistSize}
          min={0}
          max={3000}
          step={100}
          onChange={(next) => setSim("initialWaitlistSize", next)}
        />
        <NumberField
          label="Seed"
          hint="sim.seed"
          value={config.sim.seed}
          min={1}
          max={999999}
          onChange={(next) => setSim("seed", next)}
        />
        <Slider
          label="New listings per day"
          hint="sim.newListingsPerDay"
          value={config.sim.newListingsPerDay}
          min={0}
          max={12}
          step={1}
          onChange={(next) => setSim("newListingsPerDay", next)}
        />
      </CollapsibleGroup>
    </section>
  );
}
