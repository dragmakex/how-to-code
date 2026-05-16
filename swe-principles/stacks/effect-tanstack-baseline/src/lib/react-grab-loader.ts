/**
 * Production no-op for the development-only react-grab helper.
 *
 * @returns A resolved promise with no side effects.
 */
export function loadReactGrab(): Promise<void> {
  return Promise.resolve()
}
