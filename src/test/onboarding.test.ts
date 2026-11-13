import { describe, it, expect } from "vitest";
import { computePending, coherence, stepsFor, allFields, fitTips, visibleFields } from "@/lib/onboarding";

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
  it("presentation is the first field of the first step", () => {
    const first = stepsFor("quick")[0]!;
    expect(first.fields[0]?.key).toBe("presentation");
  });
  it("conditional fields follow the chosen presentation", () => {
    const first = stepsFor("quick")[0]!;
    const visible = (presentation: string) => visibleFields(first, { presentation }).map((f) => f.key);
    expect(visible("masculine")).toContain("beard_preference");
    expect(visible("masculine")).not.toContain("makeup_preference");
    expect(visible("feminine")).toContain("makeup_preference");
    expect(visible("feminine")).not.toContain("beard_preference");
    const semApresentacao = visible("");
    expect(semApresentacao).toContain("beard_preference");
    expect(semApresentacao).toContain("makeup_preference");
  });
  it("computePending ignores conditional fields hidden by presentation", () => {
    const feminino = computePending({ presentation: "feminine" }, "quick");
    expect(feminino).not.toContain("beard_preference");
    expect(feminino).toContain("makeup_preference");
    const masculino = computePending({ presentation: "masculine" }, "quick");
    expect(masculino).not.toContain("makeup_preference");
    expect(masculino).toContain("beard_preference");
  });
  it("coherence warns gently but never throws", () => {
    expect(coherence({ height_cm: 65, weight_kg: 165 }).length).toBeGreaterThan(0);
    expect(coherence({ height_cm: 165, weight_kg: 65 })).toEqual([]);
  });
  it("tips change with shape", () => { expect(fitTips({ body_shape: "oval" })).not.toEqual(fitTips({ body_shape: "triangulo" })); });
});
