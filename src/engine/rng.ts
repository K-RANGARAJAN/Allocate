// Seeded deterministic random number generator for the engine.
// Mulberry32. The same seed always produces the same sequence, forever.
// Nothing in src/engine may call Math.random directly. Everything comes from here.

export interface Rng {
  next(): number;
  range(min: number, max: number): number;
  int(min: number, max: number): number;
  pick<T>(items: T[]): T;
  weightedPick<T>(items: T[], weights: number[]): T;
}

export function createRng(seed: number): Rng {
  let state = seed | 0;

  // Uniform float in [0, 1).
  function next(): number {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    const scrambled = (t ^ (t >>> 14)) >>> 0;
    return scrambled / 4294967296;
  }

  // Uniform float in [min, max).
  function range(min: number, max: number): number {
    const span = max - min;
    return min + next() * span;
  }

  // Uniform integer in [min, max]. Both ends inclusive.
  function int(min: number, max: number): number {
    const span = max - min + 1;
    const draw = Math.floor(next() * span);
    return min + draw;
  }

  function pick<T>(items: T[]): T {
    if (items.length === 0) {
      throw new Error("rng.pick was called with an empty array");
    }
    const index = int(0, items.length - 1);
    return items[index];
  }

  function weightedPick<T>(items: T[], weights: number[]): T {
    if (items.length === 0) {
      throw new Error("rng.weightedPick was called with an empty array");
    }
    if (items.length !== weights.length) {
      throw new Error("rng.weightedPick needs exactly one weight per item");
    }
    let total = 0;
    for (const weight of weights) {
      if (weight < 0) {
        throw new Error("rng.weightedPick needs non-negative weights");
      }
      total = total + weight;
    }
    if (total <= 0) {
      return pick(items);
    }
    let threshold = next() * total;
    for (let i = 0; i < items.length; i++) {
      threshold = threshold - weights[i];
      if (threshold < 0) {
        return items[i];
      }
    }
    return items[items.length - 1];
  }

  return { next, range, int, pick, weightedPick };
}
