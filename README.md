# Resonance

A kidney allocation policy simulator. Set an allocation policy — how organs get
matched to waiting patients — and the platform simulates two years of allocation
decisions, then shows what that policy cost: transplants, life-years, deaths on
the waiting list, waiting times, discarded organs and the gap between regions.

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
| `npm run smoke` | Runs the engine and validates the output shape |

## A note on the data

All data in this project is generated synthetically in code. No real registry or
patient data is used anywhere. This is an illustrative model for exploring policy
trade-offs. It is not a clinical tool and it is not a policy tool.
