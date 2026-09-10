import { VladStatus as VladStatusType } from '../config'

interface VladStatusProps {
  status: VladStatusType
  onToggleDemo: () => void
}

export default function VladStatus({ status, onToggleDemo }: VladStatusProps) {
  const pitched = status === 'pitched'

  return (
    <div
      className={`rounded-3xl border-[3px] border-ink p-8 shadow-thick transition-colors sm:p-10 ${
        pitched ? 'bg-moss text-cream' : 'bg-white text-ink'
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`h-3.5 w-3.5 rounded-full ${
            pitched ? 'bg-cream animate-pulse-dot' : 'bg-yellow-400 animate-pulse-dot'
          }`}
        />
        <span className="font-mono text-xs tracking-wide opacity-70">
          {pitched ? 'STATUS: PITCHED' : 'STATUS: NOT PITCHED'}
        </span>
      </div>

      {pitched ? (
        <>
          <h3 className="mt-4 font-display text-4xl font-bold sm:text-5xl">
            VLAD PITCHED COOKWARE.
          </h3>
          <p className="mt-3 font-display text-2xl font-semibold opacity-90 sm:text-3xl">NOW WHAT?</p>
          <p className="mt-4 max-w-prose text-sm opacity-80 sm:text-base">
            This isn't the ending — it's the next chapter. The counters don't stop. The
            lore doesn't stop. Cookware still has to get to $1B, and someone still has
            to keep count.
          </p>
        </>
      ) : (
        <>
          <h3 className="mt-4 font-display text-3xl font-bold sm:text-4xl">🟡 NOT PITCHED</h3>
          <p className="mt-3 max-w-prose text-sm text-ink/70 sm:text-base">
            Vlad has not pitched Cookware. The reminders continue.
          </p>
        </>
      )}

      <button
        onClick={onToggleDemo}
        className="mt-6 rounded-full border-[3px] border-ink bg-ink px-6 py-3 font-display text-sm font-bold text-cream shadow-thickSm transition-transform hover:-translate-y-0.5 hover:bg-clay active:translate-y-0 sm:text-base"
        aria-label="Toggle Vlad status"
      >
        🔄 TOGGLE STATUS
      </button>
    </div>
  )
}
