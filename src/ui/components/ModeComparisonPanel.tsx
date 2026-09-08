import type { ModeComparison, ModeGroupRow, PolicyConfig, PolicyMode } from "../../contract/types";
import type { EngineWorker } from "../state/useEngineWorker";
import { ProgressBar } from "./ProgressBar";
import { StaleNotice, panelClass, runLabel } from "./StaleNotice";

export interface ModeComparisonPanelProps {
  config: PolicyConfig;
  worker: EngineWorker;
}

const MODE_LABELS: { mode: PolicyMode; label: string }[] = [
  { mode: "score", label: "Weighted score" },
  { mode: "cascade", label: "Cascade (TRANSTAN)" },
  { mode: "fcfs", label: "First come" }
];

// A cell is marked only where the engine named a winner. It returns null for
// the over-60 rate on purpose, because whether more or fewer older recipients
// is better is the argument this platform refuses to settle, and it returns
// null on a tie so an identical number never reads as a victory.
function cellClass(best: PolicyMode | null, mode: PolicyMode, current: PolicyMode) {
  const classes = ["num"];
  if (best === mode) {
    classes.push("mode-best");
  }
  if (mode === current) {
    classes.push("mode-current");
  }
  return classes.join(" ");
}

function GroupTable(props: { caption: string; rows: ModeGroupRow[]; current: PolicyMode }) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>{props.caption}</th>
          {MODE_LABELS.map((m) => {
            let cls = "";
            if (m.mode === props.current) {
              cls = "mode-current";
            }
            return (
              <th key={m.mode} className={cls}>
                {m.label}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {props.rows.map((row) => {
          return (
            <tr key={row.group}>
              <td>{row.group}</td>
              <td className={cellClass(null, "score", props.current)}>{row.score}</td>
              <td className={cellClass(null, "cascade", props.current)}>{row.cascade}</td>
              <td className={cellClass(null, "fcfs", props.current)}>{row.fcfs}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function ModeComparisonPanel(props: ModeComparisonPanelProps) {
  const worker = props.worker;
  const stale = worker.isStale("modes", props.config);
  const report: ModeComparison | null = worker.modes;

  let progress = null;
  if (worker.busy === "modes") {
    progress = (
      <ProgressBar
        label="Running all three rules"
        elapsedMs={worker.elapsedMs}
        expectedSeconds="about 3 seconds"
      />
    );
  }

  let body = (
    <p className="panel-note">
      Your current settings, run three ways: scored by weights, allocated through the
      Tamil Nadu cascade, and handed out strictly by waiting time. Same patients, same
      organs, same seed. Only the rule for choosing between them changes.
    </p>
  );

  if (report !== null) {
    body = (
      <div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Metric</th>
              {MODE_LABELS.map((m) => {
                let cls = "";
                if (m.mode === report.currentMode) {
                  cls = "mode-current";
                }
                return (
                  <th key={m.mode} className={cls}>
                    {m.label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {report.rows.map((row) => {
              return (
                <tr key={row.metric}>
                  <td>{row.label}</td>
                  <td className={cellClass(row.best, "score", report.currentMode)}>
                    {row.score}
                  </td>
                  <td className={cellClass(row.best, "cascade", report.currentMode)}>
                    {row.cascade}
                  </td>
                  <td className={cellClass(row.best, "fcfs", report.currentMode)}>
                    {row.fcfs}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <p className="panel-note">
          A rule is marked on a metric only where it genuinely reads best. The over-60
          rate is never marked: whether transplanting more or fewer older patients is an
          improvement is the argument, not a score. Ties are not marked either.
        </p>

        <h3 className="panel-subtitle">Transplant rate by age band</h3>
        <GroupTable caption="Band" rows={report.byAgeBand} current={report.currentMode} />

        <h3 className="panel-subtitle">Transplant rate by zone</h3>
        <GroupTable caption="Zone" rows={report.byZone} current={report.currentMode} />

        <p className="panel-note">
          Run at seed {report.seed}. The cascade never scores anyone against anyone, so
          it cannot prefer a patient for having more expected life-years left. The
          weighted score can, and does.
        </p>
      </div>
    );
  }

  function run() {
    worker.start({ kind: "modes", config: props.config }, props.config);
  }

  return (
    <section className={panelClass(stale)}>
      <h2 className="panel-title">Three rules, one population</h2>
      <div className="compare-head">
        <button type="button" className="btn" disabled={worker.busy !== null} onClick={run}>
          {runLabel(stale, "Compare all three rules")}
        </button>
      </div>
      <StaleNotice stale={stale} />
      {progress}
      {body}
    </section>
  );
}
