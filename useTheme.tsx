import { createContext, ReactNode, useContext, useEffect, useState } from 'react'

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

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

/**
 * Wraps the app once, holds the ONE real theme state, and keeps <html>'s
 * `dark` class plus the address-bar `theme-color` meta tag in sync with it.
 * Every component reads/toggles the SAME state via useTheme() below — this
 * used to be a plain hook called independently per-component, which meant
 * e.g. the tweet embed never actually found out the header's toggle had
 * been clicked.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
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

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
