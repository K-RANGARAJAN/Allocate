import type { Dispatch, SetStateAction } from "react";

import type { PolicyConfig, ZoneId } from "../../contract/types";
import { Select } from "./Select";
import { Slider } from "./Slider";
import { Toggle } from "./Toggle";

export interface ControlsPanelProps {
  config: PolicyConfig;
  setConfig: Dispatch<SetStateAction<PolicyConfig>>;
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
export function ControlsPanel(props: ControlsPanelProps) {
  const config = props.config;

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

  function setMode(next: string) {
    props.setConfig((prev) => {
      return { ...prev, mode: next as PolicyConfig["mode"] };
    });
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
        value={maxAge}
        min={50}
        max={90}
        step={1}
        onChange={(next) => setConstraint("maxAgeToList", next)}
      />
    );
  }

  return (
    <section className="panel controls">
      <h2 className="panel-title">Policy</h2>
      <p className="panel-note">
        Weights need not sum to 1. The engine normalises them before scoring, so
        three equal values mean an equal split.
      </p>

      <div className="control-group">
        <span className="label">Scoring weights</span>
        <Slider
          label="Urgency"
          value={config.weights.urgency}
          min={0}
          max={1}
          step={0.01}
          onChange={(next) => setWeight("urgency", next)}
        />
        <Slider
          label="Life-years"
          value={config.weights.lifeYears}
          min={0}
          max={1}
          step={0.01}
          onChange={(next) => setWeight("lifeYears", next)}
        />
        <Slider
          label="Waiting time"
          value={config.weights.waitingTime}
          min={0}
          max={1}
          step={0.01}
          onChange={(next) => setWeight("waitingTime", next)}
        />
      </div>

      <div className="control-group">
        <span className="label">Allocation</span>
        <Select
          label="Mode"
          value={config.mode}
          options={MODE_OPTIONS}
          onChange={setMode}
        />
        <Select
          label="Local first"
          value={config.constraints.localFirst}
          options={LOCAL_FIRST_OPTIONS}
          onChange={(next) =>
            setConstraint("localFirst", next as Constraints["localFirst"])
          }
        />
      </div>

      <div className="control-group">
        <span className="label">Constraints</span>
        <Slider
          label="Max cold ischemia"
          value={config.constraints.maxColdIschemiaHours}
          min={4}
          max={36}
          step={1}
          suffix=" h"
          onChange={(next) => setConstraint("maxColdIschemiaHours", next)}
        />
        <Slider
          label="Minimum urgency to list"
          value={config.constraints.minUrgencyToList}
          min={0}
          max={10}
          step={1}
          onChange={(next) => setConstraint("minUrgencyToList", next)}
        />
        <Slider
          label="Retrieval hospital keeps"
          value={config.constraints.retrievalHospitalKeeps}
          min={0}
          max={2}
          step={1}
          onChange={(next) => setConstraint("retrievalHospitalKeeps", next)}
        />
        <Toggle
          label="Age matching"
          checked={config.constraints.ageMatchingOn}
          onChange={(next) => setConstraint("ageMatchingOn", next)}
        />
        <Toggle
          label="Hospital rota"
          checked={config.constraints.rotaEnabled}
          onChange={(next) => setConstraint("rotaEnabled", next)}
        />
        <Toggle
          label="Urgent supersedes rota"
          checked={config.constraints.urgentSupersedesRota}
          onChange={(next) => setConstraint("urgentSupersedesRota", next)}
        />
        <Toggle
          label="Upper age limit on listing"
          checked={ageLimitOn}
          onChange={toggleAgeLimit}
        />
        {ageSlider}
      </div>

      <div className="control-group">
        <span className="label">Resources</span>
        <Slider
          label="Donation rate"
          value={config.resources.donationRateMultiplier}
          min={0.5}
          max={3}
          step={0.1}
          suffix="×"
          onChange={setDonationRate}
        />
        <Slider
          label="Centres, north"
          value={config.resources.transplantCentresPerZone.north}
          min={1}
          max={15}
          step={1}
          onChange={(next) => setCentres("north", next)}
        />
        <Slider
          label="Centres, south"
          value={config.resources.transplantCentresPerZone.south}
          min={1}
          max={15}
          step={1}
          onChange={(next) => setCentres("south", next)}
        />
        <Slider
          label="Centres, west"
          value={config.resources.transplantCentresPerZone.west}
          min={1}
          max={15}
          step={1}
          onChange={(next) => setCentres("west", next)}
        />
        <Slider
          label="Run length"
          value={config.sim.durationDays}
          min={90}
          max={1460}
          step={30}
          suffix=" days"
          onChange={(next) => setSim("durationDays", next)}
        />
        <Slider
          label="Initial waitlist"
          value={config.sim.initialWaitlistSize}
          min={0}
          max={5000}
          step={100}
          onChange={(next) => setSim("initialWaitlistSize", next)}
        />
        <Slider
          label="New listings per day"
          value={config.sim.newListingsPerDay}
          min={0}
          max={20}
          step={1}
          onChange={(next) => setSim("newListingsPerDay", next)}
        />
      </div>
    </section>
  );
}
