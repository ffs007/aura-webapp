import { describe, it, expect } from "vitest";
import { computePending, coherence, stepsFor, allFields, fitTips } from "@/lib/onboarding";

describe("onboarding", () => {
  it("personal presentation is never inferred or preselected", () => {
    expect(allFields().find(f => f.key === "presentation")?.suggested).toBe("");
    expect(allFields().find(f => f.key === "beard_preference")?.suggested).toBe("");
    expect(computePending({}, "quick")).toContain("presentation");
  });
  it("quick mode has fewer steps", () => { expect(stepsFor("quick").length).toBeLessThan(stepsFor("assisted").length); });
  it("skipped fields are pending", () => {
    const p = computePending({ goals: "x", _pending: ["body_shape"] }, "quick");
    expect(p).toContain("body_shape"); expect(p).not.toContain("goals"); expect(p).not.toContain("weight_kg");
  });
  it("coherence warns gently but never throws", () => {
    expect(coherence({ height_cm: 65, weight_kg: 165 }).length).toBeGreaterThan(0);
    expect(coherence({ height_cm: 165, weight_kg: 65 })).toEqual([]);
  });
  it("tips change with shape", () => { expect(fitTips({ body_shape: "oval" })).not.toEqual(fitTips({ body_shape: "triangulo" })); });
});
