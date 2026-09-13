/**
 * Parses raw instruction text into an array of clean step-by-step strings.
 *
 * Splits text on line breaks, strips leading bullet points (such as `-`, `*`, `•`)
 * or numbered markers (such as `1.`, `2)`), and removes empty lines while preserving
 * the original author wording.
 *
 * @param instructionText - Raw multi-line instruction string from the database, or null.
 * @returns An array of sanitized, non-empty instruction step strings.
 */
export function getMissionSteps(instructionText: string | null): string[] {
  return (instructionText ?? "")
    .split(/\r?\n/)
    .map((line) =>
      line
        .trim()
        .replace(/^(?:[-*•]|\d+[.)])(?:\s+|$)/, "")
        .trim(),
    )
    .filter(Boolean);
}
