import { describe, expect, it } from "vitest"
import { getMissionSteps } from "./mission-instructions"

describe("getMissionSteps", () => {
  it("preserves paragraph wording and punctuation", () => {
    expect(getMissionSteps("Walk 1.5 km. Stop at the park.")).toEqual([
      "Walk 1.5 km. Stop at the park.",
    ])
  })

  it("turns non-empty lines into steps without list markers", () => {
    expect(getMissionSteps(" 1. Find a leaf.\r\n\n- Look closely.\n• Compare colours.\n2) Return it. ")).toEqual([
      "Find a leaf.", "Look closely.", "Compare colours.", "Return it.",
    ])
  })

  it.each([null, "", " \n ", "- \n1. "])("handles missing instructions: %s", (text) => {
    expect(getMissionSteps(text)).toEqual([])
  })
})
