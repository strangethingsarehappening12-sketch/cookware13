import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'cookware_theme'

function getInitialTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // localStorage unavailable — fall through to the default below
  }
  // Dark is the site default for first-time visitors, regardless of system
  // preference. Anyone who explicitly toggles it keeps their own choice
  // (handled by the localStorage check above on every later visit).
  return 'dark'
}

/**
 * Tracks light/dark theme, persists the choice, and keeps the `dark` class
 * on <html> in sync — every color in the site is built from CSS variables
 * that flip off that class (see index.css), so this one hook is enough to
 * theme the whole app with no prop drilling.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')

    // Keep iOS Safari's address-bar tint in sync with the manual toggle —
    // without this it only reflects a static default, not the real state.
    const meta = document.getElementById('theme-color-meta')
    meta?.setAttribute('content', theme === 'dark' ? '#0c0c0c' : '#ffffff')

    try {
      window.localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // localStorage unavailable — theme still works for this session
    }
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return { theme, toggleTheme }
}
