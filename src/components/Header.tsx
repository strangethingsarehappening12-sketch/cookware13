interface HeaderProps {
  onRemind: () => void
}

export default function Header({ onRemind }: HeaderProps) {
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
        <button
          onClick={onRemind}
          className="rounded-full border-[3px] border-ink bg-clay px-4 py-2 font-display text-xs font-bold text-cream shadow-thickSm transition-transform hover:-translate-y-0.5 active:translate-y-0 sm:px-5 sm:text-sm"
        >
          REMIND VLAD
        </button>
      </div>
    </header>
  )
}
