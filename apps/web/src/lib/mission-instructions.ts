/** Preserve source wording; each non-empty line becomes one instruction bullet. */
export function getMissionSteps(instructionText: string | null): string[] {
  return (instructionText ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^(?:[-*•]|\d+[.)])(?:\s+|$)/, "").trim())
    .filter(Boolean)
}
