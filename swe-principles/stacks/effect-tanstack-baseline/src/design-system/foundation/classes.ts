export type ClassValue = string | false | null | undefined

/**
 * Joins optional class names into a single className string.
 *
 * @param values - Conditional class values.
 * @returns A trimmed className string.
 */
export function cx(...values: ReadonlyArray<ClassValue>): string {
  return values.filter(Boolean).join(" ")
}
