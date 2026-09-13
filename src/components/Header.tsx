import { useState } from 'react'
import SoundToggle from './SoundToggle'

const NAV_LINKS = [
  { href: '#lore', label: 'LORE' },
  { href: '#tracker', label: 'TRACKER' },
  { href: '#faq', label: 'FAQ' },
  { href: '#remind', label: 'REMIND VLAD' },
]

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-ink bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <a href="#top" className="flex items-center gap-2 font-fun text-xl tracking-wide text-clay">
          <img src="/cookware-logo.png" alt="Cookware" className="h-8 w-8" />
          COOKWARE
        </a>

        {/* Desktop nav — unchanged, only shows at sm breakpoint and up */}
        <nav className="hidden gap-6 font-mono text-xs tracking-wide sm:flex">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-clay">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <SoundToggle />
          <a
            href="#remind"
            className="rounded-full border-[3px] border-ink bg-clay px-4 py-2 font-display text-xs font-bold text-cream shadow-thickSm transition-transform hover:-translate-y-0.5 active:translate-y-0 sm:px-5 sm:text-sm"
          >
            REMIND VLAD
          </a>

          {/* Hamburger — mobile only, opens the dropdown below */}
          <button
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-ink bg-cream text-ink sm:hidden"
          >
            {menuOpen ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="5" y1="5" x2="19" y2="19" />
                <line x1="19" y1="5" x2="5" y2="19" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <nav className="flex flex-col border-t-[3px] border-ink bg-cream px-5 py-2 font-mono text-sm tracking-wide sm:hidden">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="border-b border-ink/10 py-3 last:border-none hover:text-clay"
            >
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  )
}
