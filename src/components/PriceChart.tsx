import { useEffect, useState } from 'react'
import { cookwareConfig, getBestPairAddress } from '../config'

export default function PriceChart() {
  const [pairAddress, setPairAddress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getBestPairAddress().then((result) => {
      if (cancelled) return
      if (result.pairAddress) setPairAddress(result.pairAddress)
      else setError(result.error ?? 'No trading pair found yet.')
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="rounded-3xl border-[3px] border-ink bg-cream p-4 shadow-thick sm:p-6">
      <div className="px-2 pb-4 pt-2">
        <h2 className="font-display text-3xl font-bold sm:text-4xl">$COOKWARE PRICE</h2>
        <p className="mt-1 text-sm text-ink/60">Live chart from DexScreener</p>
      </div>

      {pairAddress ? (
        <iframe
          key={pairAddress}
          src={`https://dexscreener.com/${cookwareConfig.dexscreenerChainId}/${pairAddress}?embed=1&theme=dark&trades=0&info=0`}
          title="COOKWARE live price chart"
          className="h-[520px] w-full rounded-2xl border-2 border-ink/20"
          loading="lazy"
        />
      ) : (
        <div className="flex h-[520px] items-center justify-center rounded-2xl border-2 border-ink/20 text-sm text-ink/40">
          {error ?? 'Loading chart…'}
        </div>
      )}
    </div>
  )
}
