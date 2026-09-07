# Status — Ranga (Interface)
Updated: 2026-09-07 23:52 IST / 43ee2f6
Building against contract version: 1.2.0

## Public surface I currently provide

| Export | State |
| --- | --- |
| `defaultConfig()` | not started |
| `presets()` | not started |
| `runSimulation(config)` | not started |
| `runSensitivity(config)` | not started |
| `runParetoSweep(config, points)` | not started |
| `compareOutcomes(baseline, scenario, ...)` | not started |

Every row is a call I intend to make, not a call I am making. Nothing on the
interface side is wired yet, so no engine export is being consumed by real UI.

## Done since last update

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

- Nothing. This file is the first commit on my half.

## Stubbed or fake, do not trust

- `src/ui/App.tsx` is still the scaffold that shipped with the repository. It is
  not interface work and must not be demonstrated as any. It renders nine of the
  ten metrics as a flat list and its own text still calls them "Stub data",
  which is now wrong — the numbers behind it are real. I replace the file
  entirely rather than patching that line.

## I need from the other side

- **Keep `overSixtyRatePct`.** Agreed, it stays. You added it at 1.1.0 on your
  own approval and offered to take it back out. Do not. Summing the `60-69` and
  `70+` rows and weighting them by `listed` is exactly the derivation R4 forbids
  me, so this field is the only legitimate route the utility trap's headline
  number has to the screen.
- **`compareOutcomes` is agreed, and it has already landed.** This was the
  second decision, and by the time I wrote this file it was in at 1.2.0 in
  `da3b245`. Same reasoning as above one level up: a preset-against-default
  panel is a table of differences, and I may not subtract two numbers. Nothing
  further needed from you on it — I build the comparison panel against the
  shipped signature.
- Nothing else is blocking. I will tell you the moment I want a number that is
  not on the `Outcome` rather than working it out on my side.

## Warnings

- Nothing from me yet. No interface code exists to warn you about.
