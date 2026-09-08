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

## Grounding

All data is synthetic, but the model is not arbitrary. This section says exactly
which parts are anchored to published figures, which are simplified proxies for
real instruments, and which are ours.

### Scale

The simulated world produces 0.8 deceased donors per day, about 292 a year.
India's deceased donor rate is 0.77 per million population, so this world
represents a region of roughly 380 million - about a quarter of India's national
deceased donation, which is consistent with the fact that five states account for
around 90% of it. The three zones are that region, not the whole country.

For comparison, the model lists about 6,350 kidney patients over two years.
Tamil Nadu alone currently has 6,448 kidney patients waiting.

### Anchored to published figures

| What | Source |
| --- | --- |
| Blood group distribution, O 37 / B 32 / A 23 / AB 8 | Indian population frequencies, which differ materially from Western ones |
| Government share of transplant centres, 13% | 682 kidney transplant centres are registered with NOTTO; 87% are private |
| Deceased donor rate used to set the scale | 0.77 per million population nationally, 1.3 in Tamil Nadu |
| The cascade and hospital rota | The allocation model actually operated in Tamil Nadu |

### Simplified proxies for real instruments

| Ours | Real instrument | How it differs |
| --- | --- | --- |
| `expectedLifeYearsAtListing` | LYFT, Life Years From Transplant (Wolfe et al., 1999) | Our own curve, not their model. It returns 11.0 years at age 50 against a published mean post-transplant survival of 11.9 at median age 52, and 3.0 at age 70 with mean comorbidity against a published median near 4 for over-65 diabetic deceased-donor recipients. Conservative at the young end. |
| `donorQuality` | KDPI / KDRI (Rao et al., OPTN) | KDPI reads eight to ten donor characteristics. We use donor age alone, the strongest single factor, as a linear proxy. A proxy, not an implementation. |

### Ours, and not claimed to be otherwise

The urgency scale and its drift rate, the comorbidity index, the daily death
hazard, the ischemia decay rate and viability floor, offer acceptance rate,
transport hours between zones, and the two zone distributions. These are
plausible shapes chosen to make the mechanics work, not measurements.

Internal scaffolding with no real-world referent at all: the Pareto labelling
thresholds, the steady-state window and tolerance, the robustness seed list, and
the counterfactual sample cap. These model nothing and make no claim.

## Known limitations

- **Organ discards are far too low.** The model discards about 3% of arriving
  organs; real registries report figures closer to 20%. Our only discard
  mechanism is graft quality decaying in transit. We do not model biopsy
  findings, positive crossmatch, logistics failures or recipient no-shows. This
  makes the locality-trap discard finding understated, not overstated.
- **Cold ischemia times are low**, averaging 10.5 hours against a real-world
  figure closer to 17-20. The modelled geography is compact; the longest journey
  is 13 hours.
- **Median wait is long.** The model reports 934 days. Tamil Nadu reports average
  kidney waits between three months and a year, though Tamil Nadu is the
  best-performing state in India and the model's initial waitlist is backdated up
  to 900 days, which lengthens the measured median.
- **Living donors are not modelled at all.** They are the majority of Indian
  kidney transplants. This is a deceased-donor allocation model only, which is
  where allocation policy actually bites.

## A note on the data

All data in this project is generated synthetically in code. No real registry or
patient data is used anywhere. This is an illustrative model for exploring policy
trade-offs. It is not a clinical tool and it is not a policy tool.
