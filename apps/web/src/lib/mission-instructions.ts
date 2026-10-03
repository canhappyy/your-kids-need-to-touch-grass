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

/**
 * Parses raw equipment needed text into an array of clean equipment item strings.
 *
 * Handles pipe-separated (`|`) items, trims whitespace, and excludes empty or literal "None" values.
 *
 * @param equipmentNeeded - Raw equipment string from the database, or null/undefined.
 * @returns An array of sanitized, non-empty equipment item strings.
 */
export function getEquipmentList(
  equipmentNeeded: string | null | undefined,
): string[] {
  if (!equipmentNeeded) return [];

  return equipmentNeeded
    .split("|")
    .map((item) => item.trim())
    .filter((item) => Boolean(item) && item.toLowerCase() !== "none");
}
