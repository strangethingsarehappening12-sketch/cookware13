interface ProgressBarProps {
  progress: number // 0–1
  fromLabel: string
  toLabel: string
}

export default function ProgressBar({ progress, fromLabel, toLabel }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, progress * 100))
  const displayPct = pct < 0.01 && pct > 0 ? '<0.01' : pct.toFixed(2)

  return (
    <div className="w-full">
      <div className="h-10 w-full overflow-hidden rounded-full border-[3px] border-ink bg-white">
        <div
          className="h-full rounded-full bg-clay transition-[width] duration-700 ease-out"
          style={{ width: `${Math.max(pct, 1.2)}%` }}
        />
      </div>
      <div className="mt-3 flex items-center justify-between font-mono text-xs text-ink/60 sm:text-sm">
        <span>{fromLabel}</span>
        <span className="rounded-full border-2 border-ink bg-clay px-3 py-1 font-semibold text-cream">
          {displayPct}%
        </span>
        <span>{toLabel}</span>
      </div>
    </div>
  )
}
