// Static explanatory copy, one entry per control. This is written text, not a
// derived value: nothing here reads the Outcome or reacts to a result.
export const CONTROL_HINTS: Record<string, string> = {
  "weights.urgency":
    "How much the score favours the sickest patients. Raise it and organs go " +
    "to those closest to dying, who often gain fewer years from the transplant.",

  "weights.lifeYears":
    "How much the score favours patients expected to live longest with the " +
    "organ. Raise it and younger patients win almost every match.",

  "weights.waitingTime":
    "How much the score favours those who have waited longest. Raise it and " +
    "the queue behaves more like a line, regardless of medical need.",

  presets:
    "Two policies chosen to expose a trade-off rather than to be good. Each " +
    "is a full configuration, so every control below changes when you click one.",

  maxColdIschemiaHours:
    "How long a kidney may spend outside a body before it must be discarded. " +
    "Lower is medically safer but rules out distant patients, so more organs " +
    "go unused.",

  localFirst:
    "Whether nearby patients get first refusal. Off matches nationally. Zone " +
    "keeps organs in the retrieving region. State is tighter still. " +
    "Tightening it cuts discards and widens the gap between regions.",

  minUrgencyToList:
    "How sick a patient must be before they can join the waiting list at all. " +
    "Raise it and the list shortens, but people are turned away earlier in " +
    "their illness.",

  maxAgeToList:
    "An age ceiling for joining the list. Set it and older patients are " +
    "excluded before any policy weighting is applied. Leave it off for no limit.",

  ageMatchingOn:
    "Whether donor and recipient ages are matched. Tends to send younger " +
    "organs to younger patients, which raises expected years gained and " +
    "lowers access for the old.",

  retrievalHospitalKeeps:
    "How many organs the hospital that retrieved them may keep. This is the " +
    "cascade, and it is how Tamil Nadu actually allocates. Higher values " +
    "reward hospitals for retrieving, and concentrate transplants where " +
    "retrieval already happens.",

  rotaEnabled:
    "Whether organs rotate between participating hospitals in turn, rather " +
    "than going by score. This is the other half of the Tamil Nadu model.",

  urgentSupersedesRota:
    "Whether a critically ill patient can jump the hospital rota. Off means " +
    "the rota holds even when someone is dying.",

  donationRateMultiplier:
    "How many organs become available, against the baseline rate. This is the " +
    "only control that changes supply rather than who gets what. Sensitivity " +
    "analysis ranks it above every policy weight.",

  transplantCentresPerZone:
    "How many transplant centres operate in each zone. Fewer centres in a zone " +
    "means patients there are harder to reach within the cold ischemia limit.",

  "sim.seed":
    "Which synthetic population is generated. Same seed, same patients, same " +
    "result every time. Change it to check a finding is not one lucky draw.",

  "sim.durationDays":
    "How long the simulation runs. Short runs are dominated by the opening " +
    "backlog clearing and have not settled.",

  "sim.initialWaitlistSize":
    "How many patients are already waiting on day one.",

  "sim.newListingsPerDay":
    "How many new patients join the list each day. Set it against the " +
    "donation rate to model a list that grows or shrinks.",

  mode:
    "Score ranks every patient by the weights below. Cascade and rota follows " +
    "the Tamil Nadu model, where the retrieving hospital claims first and " +
    "organs then rotate between hospitals. First come first served ignores " +
    "medical need entirely."
};
