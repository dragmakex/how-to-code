/**
 * Development-only react-grab loader.
 *
 * Keeps the heavy debugging dependency out of production bundles.
 *
 * @returns A promise that resolves once the helper is loaded.
 */
export function loadReactGrab(): Promise<unknown> {
  return import("react-grab")
}
