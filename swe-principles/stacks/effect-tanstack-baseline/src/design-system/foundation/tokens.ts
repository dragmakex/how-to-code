/**
 * Semantic spacing scale mapped to Tailwind theme classes.
 *
 * These reference `--spacing-*` tokens declared in `@theme` in `styles.css`.
 */
export const spaceClass = {
  "2xs": "gap-2xs",
  xs: "gap-xs",
  s: "gap-s",
  m: "gap-m",
  l: "gap-l",
  xl: "gap-xl",
  "2xl": "gap-2xl",
} as const

export type SpaceToken = keyof typeof spaceClass
