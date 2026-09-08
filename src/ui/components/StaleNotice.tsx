export interface StaleNoticeProps {
  stale: boolean;
}

// Shown when a panel's result belongs to a policy the user has since changed.
// The numbers stay on screen because they are still true of the config that
// produced them — what would be dishonest is letting them read as current.
export function StaleNotice(props: StaleNoticeProps) {
  if (props.stale === false) {
    return null;
  }
  return (
    <p>
      <span className="stale-flag">
        From an earlier policy. Re-run to update.
      </span>
    </p>
  );
}

export function runLabel(stale: boolean, fresh: string) {
  if (stale) {
    return "Re-run for current policy";
  }
  return fresh;
}

export function panelClass(stale: boolean) {
  if (stale) {
    return "panel is-stale";
  }
  return "panel";
}
