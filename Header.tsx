import { useTheme } from '../hooks/useTheme'

interface HeaderProps {
  onRemind: () => void
}

export default function Header({ onRemind }: HeaderProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-ink bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <a href="#top" className="flex items-center gap-2 font-fun text-xl tracking-wide text-clay">
          <img src="/cookware-logo.png" alt="Cookware" className="h-8 w-8" />
          COOKWARE
        </a>
        <nav className="hidden gap-6 font-mono text-xs tracking-wide sm:flex">
          <a href="#lore" className="hover:text-clay">
            LORE
          </a>
          <a href="#tracker" className="hover:text-clay">
            TRACKER
          </a>
          <a href="#faq" className="hover:text-clay">
            FAQ
          </a>
          <a href="#remind" className="hover:text-clay">
            REMIND VLAD
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-ink bg-cream text-ink transition-transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {theme === 'dark' ? (
              // Sun icon — click to go light
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
            ) : (
              // Moon icon — click to go dark
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 1020.354 15.354z" />
              </svg>
            )}
          </button>
          <button
            onClick={onRemind}
            className="rounded-full border-[3px] border-ink bg-clay px-4 py-2 font-display text-xs font-bold text-cream shadow-thickSm transition-transform hover:-translate-y-0.5 active:translate-y-0 sm:px-5 sm:text-sm"
          >
            REMIND VLAD
          </button>
        </div>
      </div>
    </header>
  )
}
