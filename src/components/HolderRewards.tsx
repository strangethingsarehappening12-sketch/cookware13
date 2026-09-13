import { useEffect, useState } from 'react'
import {
  cookwareConfig,
  formatCompactNumber,
  formatCompactUsd,
  getHolderRewardsSummary,
  HolderRewardsSummary,
} from '../config'

function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="font-display text-4xl font-bold text-clay sm:text-5xl">{value}</p>
      <p className="mt-2 font-mono text-xs tracking-wide text-ink/50">{label}</p>
    </div>
  )
}

export default function HolderRewards() {
  const [summary, setSummary] = useState<HolderRewardsSummary>({
    isLive: false,
    totalUsd: null,
    totalHood: null,
    payoutsCount: null,
    holdersCount: null,
  })

  useEffect(() => {
    let cancelled = false

    const poll = () => {
      getHolderRewardsSummary().then((snap) => {
        if (!cancelled) setSummary(snap)
      })
    }

    poll()
    const id = setInterval(poll, cookwareConfig.pollIntervalMs)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  return (
    <div className="rounded-3xl border-[3px] border-ink bg-cream p-8 text-center shadow-thick sm:p-12">
      <h2 className="font-display text-3xl font-bold sm:text-4xl">HOLDER REWARDS</h2>

      {!summary.isLive && (
        <p className="mt-3 text-sm text-ink/60">{summary.error ?? 'Loading holder rewards…'}</p>
      )}

      <div className="mt-8 flex flex-col gap-8 sm:flex-row sm:justify-around">
        <StatBlock
          value={summary.totalUsd !== null ? formatCompactUsd(summary.totalUsd) : '—'}
          label={
            summary.totalHood !== null
              ? `${formatCompactNumber(summary.totalHood)} HOOD PAID TO HOLDERS`
              : 'HOOD PAID TO HOLDERS'
          }
        />
        <StatBlock
          value={summary.payoutsCount !== null ? summary.payoutsCount.toLocaleString() : '—'}
          label="PAYOUTS"
        />
        <StatBlock
          value={summary.holdersCount !== null ? summary.holdersCount.toLocaleString() : '—'}
          label="HOLDERS EARNING"
        />
      </div>

      {summary.truncated && (
        <p className="mt-6 text-xs text-ink/40">
          Based on recent payout history — very long-standing totals may show a partial count.
        </p>
      )}
    </div>
  )
}
