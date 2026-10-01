const KEY = 'rl-invitation-seen'

/**
 * Whether the envelope intro has already played in this browsing session.
 * Wrapped in try/catch because sessionStorage throws in some private modes.
 */
export function hasSeenIntro(): boolean {
  try {
    return window.sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function markIntroSeen(): void {
  try {
    window.sessionStorage.setItem(KEY, '1')
  } catch {
    // Nothing to do: the intro simply plays again next navigation.
  }
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
