# Status — Ranga (Interface)
Updated: 2026-09-08 11:00 IST / 29b35eb
Building against contract version: 1.6.0

## Public surface I currently provide

| Export | State |
| --- | --- |
| `defaultConfig()` | working |
| `presets()` | working |
| `runSimulation(config)` | working |
| `runSensitivity(config)` | working |
| `runParetoSweep(config, points)` | working |
| `compareOutcomes(baseline, scenario, ...)` | working |
| `runRobustness(config, seeds?)` | not started |
| `runCounterfactual(baseline, scenario, ...)` | not started |
| `runConstrainedFrontier(config, points, constraint, ...)` | not started |

`working` means the call is wired and its result is on screen. The first six
are. The three added at 1.4.0 through 1.6.0 are not wired yet; they land during
the five-page restructure, each in the worker behind its own button.

## Done since last update

- `src/styles/shell.css` styles the persistent header: the headline figure, the
  secondary row beside it, and the activity dot. The dot is deliberately not a
  spinner and not an overlay — it pulses in the corner while a run is in flight
  and the previous numbers stay readable throughout the 0.65s.
- **Started the five-page restructure.** `state/useActivePage.ts` holds the
  active page and the page list. It is React state and nothing else — no router
  and no new dependency, since there is no URL to restore and `package.json` is
  yours as much as mine. Each page carries the one claim it exists to make.
- **Fixed the animation-frame stall you reported in `usePolicyRun`.** You were
  right and the diagnosis was exact. The run only ever happened inside the rAF
  callback, so on any page that is not compositing the callback never fired,
  `setRunning(false)` never ran, and it sat on the loading text for good. The
  frame yield is kept because the reason for it is sound, but a 50ms timer now
  races it and whichever arrives first does the run, guarded so only one does.
  It is 50ms rather than the 0 you suggested: a zero-delay timer fires in about
  a millisecond and would beat the frame every time in a healthy page, which
  would quietly remove the paint yield you wanted kept.
- Two things came out of it that you did not report. The generation guard ran
  *after* `runSimulation`, so a superseded config still spent 0.65s on a result
  it then discarded — it is checked first now. And the cleanup cancelled the
  timeout but never the frame, so a pending run outlived its own effect. Both
  fixed here.
- **Now building against contract 1.6.0**, starting from `20af5a6`. Verified
  nine exports, eleven `Metrics` fields, and the new `equity` and `steadyState`
  fields against a live run before writing anything.
- **Renamed the metric grid's `is-stale` state to `is-running`.** The two ideas
  had one name. The grid reads off the debounced `Outcome`, so it is dimmed only
  while a run is in flight and can never hold a result from a config that is no
  longer live. `is-stale` is being freed up to mean exactly that, for the five
  expensive panels whose results do not re-run on a config change.

- All six exports are now wired and the interface is feature complete against
  contract 1.2.0.
- `ParetoPanel.tsx` carries the wording we agreed. The title is always
  "Trade-off frontier — weighted-score policies". In score mode the subtitle
  says each point is a full simulation at a different weighting. In cascade and
  first-come mode it says plainly that the mode has no weight space to sweep,
  that the chart maps the score-policy space under the current constraints, and
  that the marked point is the nearest weighting rather than where the user is.
- `charts/ParetoScatter.tsx` plots `lifeYearsGained` against `regionGapPct`.
  The gap axis is scaled to the data, never 0 to 100, exactly as you warned.
- `SensitivityPanel.tsx` puts `runSensitivity` behind an explicit button, in
  the worker, with the progress indicator. It is never reachable from a control
  change. When results land it carries your line about zero-impact levers being
  honestly zero for the config rather than broken.
- `charts/SensitivityBars.tsx` plots the rows in the order you sort them, so
  row zero stays the headline. Bar length is scaled by the chart itself rather
  than by any arithmetic of mine, and the only number displayed is
  `impactScore` as returned.
- `ProgressBar.tsx` is the indicator for both long calls. It is indeterminate
  by design: the stripe sweeps, and the caption gives elapsed wall time against
  the expected cost from your handover. There is no percentage because neither
  call reports progress, and inventing one would be a number that means nothing.
- `state/useEngineWorker.ts` owns the worker and tracks elapsed wall time.
  Neither long call reports progress, so the indicator is indeterminate.
- `src/ui/worker.ts` is the Web Worker for the two long calls, importing
  through the same seam as everything else. One note for you: the project
  tsconfig carries the DOM lib and not WebWorker, and tsconfig is not a file I
  own, so the worker scope is narrowed inside the worker rather than by
  changing the lib list. Say if you would rather it were done in tsconfig.
- `ScenarioPanel.tsx` ties it together: save the current policy, pick a saved
  one as the baseline, export the set as JSON. `compareOutcomes` re-runs
  nothing, so it is called straight through on render with no worker.
- `ComparisonTable.tsx` renders a `ScenarioComparison`. Every delta and
  percentage is yours; I subtract nothing.
- `src/styles/comparison.css` carries the three tones. Teal is better in the
  direction you name, burnt orange is worse, and `tone-neutral` is plain ink
  with no arrow — that one is for `overSixtyRatePct` and for any delta of zero.
- `state/useScenarios.ts` holds saved scenarios in memory for the session and
  exports them as JSON. Nothing is persisted, per `ARCHITECTURE.md`. Each saved
  scenario is labelled from the config echoed back on its own `Outcome` rather
  than from live control state, which by then may have moved on — that is the
  use for the echo you suggested in the handover.
- `charts/TimelineChart.tsx` plots `outcome.timeline` with Recharts — waitlist
  size, cumulative transplants and cumulative deaths against day. You sample the
  series yourself, so it is plotted as given, with no resampling on my side.
- All four breakdown tables are in and wired. Verified against a real run at the
  default config: four age bands, three zones, two hospital types, and all four
  discard reasons with three of them sitting at zero and still rendered. The
  zone spread reads 18.5 against 17.0, which is the 1.5 `regionGapPct` reports,
  and all 38 discards fall under `graft quality too low` exactly as your
  handover said they would at a 24 hour ceiling.
- `BreakdownTables.tsx` opened with the age band and zone tables. Rows are
  rendered in the order you return them, unfiltered and unsorted, and `ratePct`
  is your figure. The zone table carries a note that the regional gap metric is
  the widest rate difference between two of its rows — your handover called it
  the evidence underneath that number.
- `src/styles/tables.css` styles the breakdown tables. Figures are right
  aligned and tabular, row labels are not, and the row count is fixed so the
  layout never jumps when a count goes to zero.
- The grid is wired into the results column and verified against a real run:
  all ten values render identically to what `npm run smoke` prints, 1132
  transplants and 10775.4 life-years among them.
- `MetricGrid.tsx` renders all ten fields off `outcome.metrics`, printed exactly
  as you return them — you have already rounded, so nothing here reformats or
  scales. Order and label strings are lifted from the rows `compareOutcomes`
  returns, so the grid and the comparison table never name a metric two
  different ways, and the labels carry their own units.
- `src/styles/metrics.css` styles the metric grid. It carries an `is-stale`
  state that greys the figures while a run is in flight, so a number from the
  previous config never reads as the current one.
- **The scaffold is gone.** `src/ui/App.tsx` is now the real shell: header, the
  control column with presets and the policy panel, and a results column fed by
  the debounced run. `defaultConfig`, `presets` and `runSimulation` are wired.
- `src/styles/app.css` adds the page frame: header, the 320px control column
  beside the results column, the shared button, and the preset row.
- `PresetButtons.tsx` calls `presets()` and writes the whole returned config
  back on click, so every control re-reads from the preset instead of holding a
  stale position. It reads the preset objects live rather than caching them, so
  the `localFirst` retune you shipped arrives on its own.
- The three per-zone transplant centre counts finish the controls panel. Noted
  from your handover that the government/private split moves with these, so the
  hospital-type table is expected to shift when they are dragged.
- Resources section added, and the nullable one handled: `maxAgeToList` is a
  toggle that turns the slider off entirely rather than parking it at 90,
  because `null` is the contract's way of saying no upper limit. Donation rate
  sits alongside it under Resources.
- Constraints section added: cold ischemia ceiling, minimum urgency to list,
  retrieval hospital keeps, and the three boolean constraints. All ranges taken
  from the slider table in `docs/CONTRACT.md`.
- Allocation controls added to the panel: `mode` across all three policies, and
  `localFirst`. I have your warning that `localFirst` binds every mode now, not
  just cascade, so it sits under Allocation rather than beside the cascade
  settings.
- `ControlsPanel.tsx` opened with the three scoring weights, each seeded from
  the live config and ranged 0 to 1 step 0.05 per the contract. The panel note
  says plainly that weights need not sum to 1.
- `Select.tsx` and `Toggle.tsx` complete the control primitives, for the mode
  and local-first dropdowns and the boolean constraints.
- `src/ui/components/Slider.tsx` is the labelled range primitive the policy
  panel is built from. It shows its current value in tabular figures exactly as
  the config holds it, and it derives nothing.
- `src/styles/controls.css` styles the policy panel's controls — the range
  track, its thumb, and the label-and-value row above it.
- `src/ui/state/usePolicyRun.ts` holds the live `PolicyConfig`, seeded from
  `defaultConfig()`, and runs `runSimulation` behind a 300ms debounce with a
  generation guard so a slow run cannot land on top of a newer one. This is the
  only place `runSimulation` is called.
- Note on imports: your seam exports the six functions but no types, so the UI
  takes its types from `src/contract/types` exactly as `src/engine/index.ts`
  does. That is the shared contract, not an engine internal. Say if you would
  rather the seam re-exported them.
- `src/styles/base.css` adds the reset, the page frame and the primitives the
  panels are built from — `.panel`, `.panel-title`, `.label` and `.num`. The
  `.num` class carries the tabular figures and goes on every figure on screen.
- Started the interface. `src/styles/tokens.css` holds every colour, type step
  and spacing step the UI will use, and nothing downstream hard-codes a hex.
  IBM Plex Sans is linked in `index.html` with a system fallback stack, and
  `--numeric` carries the tabular figures that every number on screen is set in.
- Confirmed the seam before writing anything: contract is 1.2.0 and the six
  exports import cleanly, `compareOutcomes` among them.
- Rebased onto `870e4d4` and read the handover in `docs/status-vignesh.md` end
  to end, along with `ARCHITECTURE.md`, `docs/CONTRACT.md` and `CONTRIBUTING.md`.
- Verified the toolchain against the current engine. `npm run smoke` exits 0 and
  prints all ten metrics at contract 1.2.0. `npm run build` completes with no
  type errors. `npm run dev` serves the page and the scaffold renders real
  numbers off `runSimulation`, matching the smoke output field for field.
- Noted the costs I have to design around: `runSimulation` at ~0.65s needs
  debouncing on a drag, `runSensitivity` at 10-12s and `runParetoSweep` at ~0.7s
  per point are on-demand only and both need a progress indicator.

## In progress right now

- Nothing in flight. Every panel in the build order is in: tokens and styles,
  the controls, the metric grid, the four breakdown tables, the timeline, save
  and compare, sensitivity and the Pareto frontier.

## Stubbed or fake, do not trust

- Nothing. The scaffold `App.tsx` is gone, replaced by the real shell.

## I need from the other side

- **Keep `overSixtyRatePct`.** Agreed, it stays. You added it at 1.1.0 on your
  own approval and offered to take it back out. Do not. Summing the `60-69` and
  `70+` rows and weighting them by `listed` is exactly the derivation R4 forbids
  me, so this field is the only legitimate route the utility trap's headline
  number has to the screen.
- **`compareOutcomes` landed and the comparison panel is built on it.** Every
  difference on screen is one of your `MetricDelta` rows. `betterDirection` is
  rendered as colour only where it is `higher` or `lower`; `neutral` prints in
  plain ink with no arrow, so the over-60 rate is never coloured like a score.
  Where `before` is zero the percentage is suppressed and the absolute delta
  shown, since `deltaPct` comes back zero there and would read as no change.
- Nothing else is blocking. I will tell you the moment I want a number that is
  not on the `Outcome` rather than working it out on my side.

## Warnings

- **`is-stale` no longer means what it did.** It is reserved for a result that
  came from a config that is no longer live — the five expensive panels, which
  do not re-run when a control moves. A panel dimmed while its own run is in
  flight is `is-running` instead. Nothing on screen carries `is-stale` yet; it
  arrives with the restructure.

- **`runSensitivity` and `runParetoSweep` are called only from `src/ui/worker.ts`,
  never on the main thread and never from a control change.** `runSimulation` is
  on the main thread behind a 300ms debounce. `compareOutcomes` is called inline
  on render, which is safe because it re-runs nothing.
- **The progress indicators are indeterminate, not percentages.** Neither long
  call reports progress, so the bar sweeps and the caption shows elapsed wall
  time against your documented cost. I did not ask you for a progress callback.
- **The UI computes no metric.** The only arithmetic anywhere in `src/ui/` is
  elapsed milliseconds to seconds in the progress caption and the pixel height
  of the sensitivity chart. Chart axes and bar lengths are scaled by Recharts,
  the same way the timeline's axis is.
