# Resonance

A kidney allocation policy simulator. Set an allocation policy - how organs get
matched to waiting patients - and the platform simulates two years of allocation
decisions, then shows what that policy cost: transplants, life-years, deaths on
the waiting list, waiting times, discarded organs, and who was and was not
reached.

There is no correct policy. Maximise life-years and you stop transplanting older
patients. Prioritise local patients and regional disparity widens. Resonance
exists to make those trade-offs visible, not to name a winner.

## Running it

```bash
npm install
npm run dev
```

Then open the URL Vite prints, usually `http://localhost:5173`.

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Type check, then production build |
| `npm run smoke` | Runs all nine engine exports and validates every field the interface renders |

## Diagnostics

These are the project's evidence. Each one runs the engine and prints what it
found, and each fails loudly rather than quietly adjusting anything.

| Command | What it answers |
| --- | --- |
| `npx tsx scripts/distributions.ts` | Is the synthetic population shaped the way it should be? |
| `npx tsx scripts/conflict-check.ts` | Do the metrics genuinely conflict, or does one policy win on everything? |
| `npx tsx scripts/demo-check.ts` | Do the two demo presets earn their findings through weights alone? |
| `npx tsx scripts/robustness.ts` | Does each finding survive twenty different random seeds? |

## What it models

Two years of kidney allocation across three zones, from a synthetic waiting list
of 2000 patients with new listings arriving daily and deceased-donor organs
arriving at a configurable rate. Patients age, grow more urgent, and can die
waiting. Organs decay in transit and can be discarded.

Three allocation policies:

- **Weighted score** - candidates are ranked by urgency, expected life-years and
  waiting time, in whatever proportion you set.
- **Cascade (TRANSTAN)** - the Tamil Nadu shape: the retrieving hospital has
  first claim, then government and private centres in the same zone, then other
  zones, with an optional rota so organs rotate between centres in turn.
- **First come, first served** - longest wait first, as a baseline.

India allocates through NOTTO nationally with state bodies beneath it, and Tamil
Nadu's cascade and hospital rota work differently from a weighted score. Modelling
both and comparing them is the point of the project.

## What it measures

Eleven headline metrics, four breakdowns (age band, zone, hospital type, discard
reason), a timeline, inequality indices over three dimensions, and a steady-state
check that says whether a number has settled or is still the opening backlog
clearing.

Beyond a single run, the engine will also sweep the weight space for a trade-off
frontier, rank every policy lever by how much it moves the outcome, re-run any
finding across twenty seeds to show it is not an accident of one, price a
constraint you impose, and name the individual patients whose outcome changed
between two policies.

## Determinism

The same config at the same seed produces a byte-identical result, with measured
runtime the single exception. That is what makes two scenarios comparable rather
than merely different.

## A note on the data

All data in this project is generated synthetically in code. No real registry or
patient data is used anywhere. This is an illustrative model for exploring policy
trade-offs. It is not a clinical tool and it is not a policy tool.
