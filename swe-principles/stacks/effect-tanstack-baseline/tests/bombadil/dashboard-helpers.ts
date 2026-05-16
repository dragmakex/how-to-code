type Point = {
  x: number
  y: number
}

export const toArray = <T>(iterable: Iterable<T>): Array<T> => [...iterable]

export const normalizeText = (text: string | null | undefined): string =>
  (text ?? "").trim().replaceAll(/\s+/g, " ").toLowerCase()

export const parseNumber = (text: string | null | undefined): number | null => {
  const match = (text ?? "").match(/-?\d+/)
  return match === null ? null : Number(match[0])
}

export const centerPoint = (element: Element): Point | null => {
  if (!(element instanceof HTMLElement)) {
    return null
  }

  if (element.matches(":disabled")) {
    return null
  }

  const rect = element.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) {
    return null
  }

  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  }
}
