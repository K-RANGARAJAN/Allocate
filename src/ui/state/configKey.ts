import type { PolicyConfig } from "../../contract/types";

// A stable string for one config, used only to tell whether an expensive
// result still belongs to the policy on screen. It is never displayed and no
// number is derived from it. Key order is stable because every config in the
// app descends from the same defaultConfig shape.
export function configKey(config: PolicyConfig) {
  return JSON.stringify(config);
}
