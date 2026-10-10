/**
 * @file ai-ranking.service.test.ts
 * Unit tests verifying validation rules and error handling in {@link parseRankResponse}.
 */

import { describe, expect, it } from "vitest";

import { parseRankResponse } from "./ai-ranking.service";

describe("parseRankResponse", () => {
  /**
   * Verifies that when the AI ranker returns valid mission IDs matching the request ID,
   * the parsed order of mission IDs is correctly returned.
   */
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

  /**
   * Verifies that candidate IDs not present in the allowed set are rejected.
   */
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

  /**
   * Verifies that duplicate mission IDs in the AI response trigger a validation error.
   */
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

  /**
   * Verifies that if the AI response omits any allowed candidate ID, an error is thrown.
   */
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

  /**
   * Verifies that responses containing mismatched request IDs are rejected to prevent correlation errors.
   */
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
