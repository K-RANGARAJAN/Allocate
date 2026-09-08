# Status — Ranga (Interface)
Updated: 2026-09-08 16:30 IST / 679d27c
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

- **The shell is live.** `App.tsx` is now header, tabs, page claim, drawer and
  a page body. The single dense page is gone and nothing was dropped in the
  move — every control, metric, table and chart that existed before is still
  reachable, and the header and controls persist across all five pages.
- `FrontierVerdict` states the price in words. It never presents `best` as a
  recommendation — the framing is that the user drew a line and this is what
  holding it costs. A null `priceOfConstraint` is rendered as its own finding,
  "No policy in the swept space meets this line", rather than as a blank panel.
- **Counterfactual verified against your run and it agrees exactly.** Default
  against utilityTrap: 373 lost, 159 gained, seed 42. By band, lost/gained —
  18-39 70/140, 40-59 230/19, 60-69 56/0, 70+ 17/0. Not one patient over 60
  gains anything, which is the page's headline.
- **Saved scenarios carry their weights now**, and the generated label is the
  placeholder in a name field so the user can type their own. Two score-mode
  scenarios used to be indistinguishable.
- `CounterfactualSection` runs the call in the worker behind its own button and
  is disabled until a baseline scenario is chosen, since the comparison has no
  meaning without two named policies. It passes `baseline.outcome.config` rather
  than my live state, so the policy it names is the one that produced the saved
  Outcome.
- `CounterfactualSample` renders the capped patient list. Its caption quotes
  `lostCount` for the total and `sampleCap` for the cap, and says outright that
  it is a sample — the row count on screen is never presented as a figure.
- **Counterfactual headline and band table.** `lostCount` and `gainedCount` are
  the headline figures and the capped arrays are never counted — their length is
  not a total and using it would be both wrong and arithmetic on my side. The
  seed shown is `report.seed`, the baseline's own, which the engine forces so
  both worlds hold the same synthetic people; the scenario config's seed is
  never displayed beside a counterfactual. Direction is stated in words, so a
  reader never has to guess which policy lost and which gained.
- **Robustness is wired, on page 4 under sensitivity.** A `unanimous` row is
  rendered as "0 on all 20 seeds" with no mean shown at all, because it is not
  an average and printing "mean 0" would throw away the point. Other rows read
  as a mean with their min-to-max band.
- `useEngineWorker` carries result slots for all five long calls now. Its
  request union is spelled out one member at a time rather than written as
  `Omit<WorkerRequest, "id">` — `Omit` does not distribute over a union and
  would have quietly collapsed the five request shapes to their shared keys.
- **The worker handles all five long calls now** — sensitivity, Pareto,
  robustness, counterfactual and the constrained frontier. The counterfactual
  request carries both configs rather than an Outcome, because that call takes
  configs and re-runs both itself at the baseline's seed.
- **The age band note is written from the rows, not from a script.** Under the
  utility trap it reads: the rate rises sharply in 18-39 and falls in the
  others, the 60-69 and 70+ bands stop being transplanted entirely, the 40-59
  band falls too, and almost every organ goes to 18-39. Every band it names is
  read off `breakdowns.byAgeBand`. Under the default and the locality trap no
  band has collapsed, so it falls back to a neutral line instead of claiming
  one. The 40-59 collapse was the part the page undersold: the trap does not
  merely abandon the over-60s, it funnels almost everything into one band.
- **Vignesh — I invented three slider ranges and you should correct them.** The
  contract documents no range for `durationDays`, `initialWaitlistSize` or
  `newListingsPerDay`. I used 90 to 1460 days, 0 to 5000 and 0 to 20 a day. If
  the engine has real limits I cannot see from the seam, say so and I will
  match them.
- **All five pages are reachable.** The tabs switch the body, and every page
  renders against a real run: page 1 the grid, timeline and age bands, page 2
  equity, breakdowns and steady state, page 3 the frontier, page 4 sensitivity,
  page 5 scenarios. The restructure is done and nothing was dropped — the three
  new engine calls attach to these pages next.
- **The shell chrome is live.** `App.tsx` now renders the persistent header and
  the five tabs above a page claim, with the controls drawer beside the body.
  The old page title and standing subtitle are gone — the header carries the
  numbers and each tab states its own claim, so a fixed blurb was just noise.
- Stripped the panels that moved onto pages out of `App.tsx`. Nothing was lost:
  each one is rendered by the page it now belongs to. This is deliberately its
  own commit so the move out and the shell wiring in can be read separately.
- **Pages 4 and 5.** What moves it opens with the sensitivity panel and its
  sorted bars, unchanged; robustness joins it next. Compare opens with scenario
  save, the scenario list, JSON export and the comparison table; the
  counterfactual joins it after that.
- All five pages exist now. Nothing new is wired into them yet — this phase was
  the shell and the move, so every panel that worked before still works and no
  engine call changed.
- **Page 3, Trade-offs.** Opens with the Pareto frontier exactly as it was,
  data-scaled y axis and mode-dependent subtitles untouched. The constrained
  frontier joins it once that call is wired.
- **Page 2, Who it reaches.** Equity leads, then the four breakdown tables,
  then steady state. Equity is first on purpose: the tables are the evidence and
  the equity rows are the claim they support, and putting the tables first would
  bury a 22.3 age Gini under four tables that each look equally important.
- `SteadyStatePanel.tsx` renders the eleven rows with the window days read off
  `meta`. The three `windowable: false` rows print an em dash and the verdict
  "not applicable" — never a zero, which would read as no drift and mean the
  opposite of the truth. It checks the flag, never the value. Verified: your
  life-years +12% and discards -50% both come through as still moving.
- `EquityPanel.tsx` renders the three rows with Gini and spread side by side and
  the best and worst group named. Both figures are shown because they disagree,
  which your contract note says is the point — a middle zone can drift while the
  widest pair sits still, and only the Gini catches it.
- `src/styles/equity.css` styles the three equity rows, with a dominant state
  for the age row. Your finding drives the layout: age inequality is more than
  ten times regional at the default config, and a layout that keeps the zone row
  visually equal would go on implying the geography story is the big one.
- **Page 1 verified against both configs.** Default to utilityTrap on page 1
  alone: the header over-60 rate goes 10.2 to 0, the grid tile goes 10.2 to 0,
  and the age table shows 60-69 at 95 transplants dropping to 0 and 70+ at 30
  dropping to 0. The collapse reads three ways without leaving the page. Worth
  noting the 40-59 band collapses too, 16.8% to 3%, while 18-39 goes from 414
  transplants to 1027 — the trap concentrates almost everything into one band.
- **Page 1, Policy and outcome.** The eleven-tile metric grid, the timeline at
  full width, and the four age bands beneath it. It is built so a reader who
  never leaves this page still sees the over-60 collapse: the header carries the
  rate, the grid carries it again, and the age table shows the two bands it
  spans going to nothing. Verified below against both configs.
- `AgeBandTable.tsx` is pulled out of the breakdowns so page 1 can carry it on
  its own. Page 1 has to make the over-60 argument without the reader visiting
  another page, so it shows the table with a note pointing at the last two rows;
  page 2 shows the same table beside three others and drops the note.
- **The missing zone inequality tile is fixed** — you reported it and you were
  right. The grid held a ten-entry list I hardcoded back at 1.1.0, so
  `zoneGiniPct` was being dropped silently. It now reads the order and labels
  off `metricList`, and renders eleven tiles with "Zone inequality (Gini) % 1.9"
  in your own wording. It cannot fall behind the contract again.
- `ControlsDrawer.tsx` puts the controls in the shell rather than on a page, so
  they are reachable from all five. It collapses, which lets a chart take the
  full width without the reader losing sight of the policy behind it.
- The preset buttons moved inside Priorities, next to the weights they rewrite.
- **The controls are three collapsible groups now**: Priorities, Constraints and
  Resources, one open at a time, Priorities open on load. The old Allocation
  group is gone — the mode selector lives in the persistent header where it is
  reachable from every page, and `localFirst` moved down into Constraints, which
  is where it belongs now that it binds every mode and not just the cascade.
- **The seed is a control now**, as a typed number rather than a slider — it is
  an identifier, not a magnitude, so dragging it along a range is the wrong
  gesture. Its hint says what changing it actually tests: same seed means the
  same synthetic people, so a finding that survives a seed change is the policy
  rather than the draw. That is your robustness argument, reachable by hand.
- **Weight slider step corrected, 0.05 to 0.01**, per the 1.3.0 changelog. You
  were right about the symptom: 0.33 is not reachable on a 0.05 step, so the
  thumb sat at 0.35 while the label read 0.33 off the config, and the first drag
  of any weight jumped a notch. One number in three `Slider` calls.
- **Run length, initial waitlist and new listings per day are now controls.**
  They were on the config but not reachable. Ranges are mine, not the contract's
  — 90 to 1460 days, 0 to 5000 listed, 0 to 20 a day — so say if any of those
  should be tighter.
- Checked before exposing run length: at 400, 360, 200, 90 and 30 days you halve
  the steady-state windows and still return all eleven rows with nothing
  non-finite. So a short run degrades honestly and `metricList` holds.
- `CollapsibleGroup.tsx` is the group primitive for the controls drawer. A
  collapsed group does not render its children at all, so nothing hidden is
  holding state the user cannot see and then acting on it.
- `AppHeader.tsx` is the persistent header, on every page: transplants as the
  headline figure, life-years, waitlist deaths and the over-60 rate beside it,
  the allocation mode selector, and the activity dot. The over-60 rate is
  printed plain — it is `neutral` on the contract, so it is not coloured here.
- `src/ui/metricList.ts` reads the engine's own metric order and labels off
  `outcome.steadyState`, which carries one row per metric in the same order
  `compareOutcomes` uses. The header, the grid and the comparison table will
  share one source, and a metric added to the contract appears by itself.

  **Vignesh — one thing to confirm.** This makes the grid's labels depend on
  `steadyState`, a field that exists for a different purpose. Can you guarantee
  it always carries a row for every metric, including the three where
  `windowable` is false? If you ever filter it down to windowable rows, my grid
  silently loses three tiles and nothing fails loudly. If you would rather
  expose a canonical label-and-order list on the `Outcome` instead, say so and
  I will switch to it — that is the field I actually want.
- `PageNav.tsx` is the five-tab navigation, with the active tab underlined in
  teal and each page's one claim rendered beneath it.
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
