import { describe, expect, it } from "vitest";

import { parseRankResponse } from "./ai-ranking.service";

describe("parseRankResponse", () => {
  it("accepts ordered candidate IDs from the matching request", () => {
    expect(
      parseRankResponse(
        JSON.stringify({
          requestId: "request-1",
          rankedMissionIds: ["MIS-002", "MIS-001"],
        }),
        "request-1",
        new Set(["MIS-001", "MIS-002"]),
      ),
    ).toEqual(["MIS-002", "MIS-001"]);
  });

  it("rejects unknown mission IDs", () => {
    expect(() =>
      parseRankResponse(
        JSON.stringify({
          requestId: "request-1",
          rankedMissionIds: ["MIS-999"],
        }),
        "request-1",
        new Set(["MIS-001"]),
      ),
    ).toThrow("unknown mission ID");
  });

  it("rejects duplicate mission IDs", () => {
    expect(() =>
      parseRankResponse(
        JSON.stringify({
          requestId: "request-1",
          rankedMissionIds: ["MIS-001", "MIS-001"],
        }),
        "request-1",
        new Set(["MIS-001"]),
      ),
    ).toThrow("duplicate mission ID");
  });

  it("rejects missing mission IDs", () => {
    expect(() =>
      parseRankResponse(
        JSON.stringify({
          requestId: "request-1",
          rankedMissionIds: ["MIS-001"],
        }),
        "request-1",
        new Set(["MIS-001", "MIS-002"]),
      ),
    ).toThrow("omitted");
  });

  it("rejects a mismatched request ID", () => {
    expect(() =>
      parseRankResponse(
        JSON.stringify({
          requestId: "wrong-request",
          rankedMissionIds: ["MIS-001"],
        }),
        "request-1",
        new Set(["MIS-001"]),
      ),
    ).toThrow("request ID");
  });
});
