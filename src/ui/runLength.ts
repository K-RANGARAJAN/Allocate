// How long the run was, in words.
//
// The app used to say "two years" everywhere regardless of the slider, so a
// 180-day run still claimed two years of allocation. The duration is read off
// the config the engine echoed back on the Outcome, so the phrase always
// describes the run that produced the numbers beside it.
//
// This formats a config value into a label. It derives no metric: nothing here
// touches `outcome.metrics`, and the number of days is printed as given.
const DAYS_IN_YEAR = 365;

const YEAR_WORDS = ["", "one", "two", "three", "four"];

export function runLengthLabel(durationDays: number): string {
  if (durationDays % DAYS_IN_YEAR === 0) {
    const years = durationDays / DAYS_IN_YEAR;
    if (years >= 1 && years < YEAR_WORDS.length) {
      if (years === 1) {
        return "one year";
      }
      return `${YEAR_WORDS[years]} years`;
    }
  }
  return `${durationDays} days`;
}
