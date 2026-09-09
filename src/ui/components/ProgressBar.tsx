export interface ProgressBarProps {
  label: string;
  elapsedMs: number;
  expectedSeconds: string;
}

// Indeterminate on purpose. Neither long engine call reports progress, so there
// is no honest percentage to show — this is the wall clock and the documented
// expected cost, not a fraction of the work done. The seconds here are UI
// timing, not a number off the Outcome.
export function ProgressBar(props: ProgressBarProps) {
  const seconds = (props.elapsedMs / 1000).toFixed(1);

  return (
    <div className="progress">
      <div className="progress-track">
        <div className="progress-stripe" />
      </div>
      <p className="progress-note num">
        {props.label} — {seconds}s elapsed, usually {props.expectedSeconds}.
      </p>
    </div>
  );
}
