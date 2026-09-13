// ─────────────────────────────────────────────────────────────
// COOKWARE CAMPAIGN CONFIG
// Every knob for "Remind Vlad" lives here. Change these values
// to reconfigure the whole site — nothing else needs editing.
// ─────────────────────────────────────────────────────────────

export type VladStatus = 'not_pitched' | 'pitched'

export interface CookwareConfig {
  /** Day 1 of the campaign. Day count is derived from this date. */
  launchDate: string // ISO date, e.g. '2026-09-09'
  /** Starting counters (before any local increments). */
  startingReminderCount: number
  startingPitchCount: number
  /** Symbolic $1B goal. Replace with a live market-cap feed later — see MarketCapProvider below. */
  targetMarketCap: number
  /** Placeholder progress value (0–1). Used only until the first live fetch resolves, or if it fails. */
  placeholderProgress: number
  /** Default Vlad status. Toggle in the demo control, or drive from a real API later. */
  vladStatus: VladStatus
  projectName: string
  handle: string
  /**
   * The ERC-20 contract address for the COOKWARE token on Robinhood Chain.
   * Leave as '' until the token has actually launched and has a live pair —
   * getMarketCapProgress() falls back to the placeholder when this is empty.
   */
  tokenAddress: string
  /** DexScreener chain id. Robinhood Chain is indexed as 'robinhood'. */
  dexscreenerChainId: string
  /** How often to re-poll the live feed, in ms. */
  pollIntervalMs: number
  /** URL of the tweet featured in the hero section. */
  vladTweetUrl: string
  /** Wallet that sends out the $HOOD airdrops to COOKWARE holders, on Robinhood Chain. */
  distributorAddress: string
  /** The $HOOD (tokenized Robinhood stock) ERC-20 contract address on Robinhood Chain. */
  hoodTokenAddress: string
  /** Direct swap link for the "Buy on Uniswap" button. */
  uniswapBuyUrl: string
}

export const cookwareConfig: CookwareConfig = {
  launchDate: '2026-09-09',
  startingReminderCount: 1,
  startingPitchCount: 0,
  targetMarketCap: 1_000_000_000,
  placeholderProgress: 0.00042,
  vladStatus: 'not_pitched',
  projectName: 'COOKWARE',
  handle: '@cookware',
  tokenAddress: '0x315A404872AE8D4FaD6939461a4ab0B691817777',
  dexscreenerChainId: 'robinhood',
  pollIntervalMs: 30_000,
  /** The tweet embedded in the hero section — replace whenever there's a new one to feature. */
  vladTweetUrl: 'https://x.com/vladtenev/status/1955761344390815995',
  distributorAddress: '0xcED96B8EEa958A0d53cD99F502fCaC15754D8345',
  hoodTokenAddress: '0xfB5b5778d45AE47F15323fb59B666c655174A79C',
  uniswapBuyUrl:
    'https://app.uniswap.org/swap/?chain=robinhood&outputCurrency=0x315A404872AE8D4FaD6939461a4ab0B691817777',
}

export interface MarketCapSnapshot {
  /** 0–1, clamped. Ratio of currentMarketCap to targetMarketCap. */
  progress: number
  /** Raw market cap in USD, or null if unavailable (no token set / fetch failed / no pairs yet). */
  currentMarketCap: number | null
  /** True once this came from a real API response rather than the placeholder. */
  isLive: boolean
  /** Present when the fetch failed or there's nothing to show yet — surface this in the UI instead of pretending it's live. */
  error?: string
}

// DexScreener's public token-pairs endpoint. No API key required.
// Docs: https://docs.dexscreener.com/api/reference
const DEXSCREENER_TOKENS_URL = 'https://api.dexscreener.com/latest/dex/tokens/'

interface DexScreenerPair {
  chainId: string
  pairAddress?: string
  liquidity?: { usd?: number }
  marketCap?: number
  fdv?: number
}

/**
 * Live market-cap progress, pulled straight from DexScreener.
 * Picks the highest-liquidity pair on the configured chain and uses its
 * marketCap (falling back to fully-diluted valuation if marketCap isn't set,
 * which is common for tokens with the full supply already circulating).
 */
export async function getMarketCapProgress(): Promise<MarketCapSnapshot> {
  const { tokenAddress, dexscreenerChainId, targetMarketCap, placeholderProgress } = cookwareConfig

  if (!tokenAddress) {
    return {
      progress: placeholderProgress,
      currentMarketCap: null,
      isLive: false,
      error: 'No tokenAddress configured yet — showing placeholder progress.',
    }
  }

  try {
    const res = await fetch(`${DEXSCREENER_TOKENS_URL}${tokenAddress}`)
    if (!res.ok) throw new Error(`DexScreener returned ${res.status}`)

    const data = (await res.json()) as { pairs: DexScreenerPair[] | null }
    const pairsOnChain = (data.pairs ?? []).filter((p) => p.chainId === dexscreenerChainId)

    if (pairsOnChain.length === 0) {
      return {
        progress: placeholderProgress,
        currentMarketCap: null,
        isLive: false,
        error: 'No trading pair found yet for this token on this chain.',
      }
    }

    // Most liquid pair is the most reliable price/cap source.
    const bestPair = pairsOnChain.reduce((best, p) =>
      (p.liquidity?.usd ?? 0) > (best.liquidity?.usd ?? 0) ? p : best,
    )

    const marketCap = bestPair.marketCap ?? bestPair.fdv ?? null
    if (marketCap == null) {
      return {
        progress: placeholderProgress,
        currentMarketCap: null,
        isLive: false,
        error: 'Pair found, but no market cap / FDV reported for it.',
      }
    }

    return {
      progress: Math.min(1, Math.max(0, marketCap / targetMarketCap)),
      currentMarketCap: marketCap,
      isLive: true,
    }
  } catch (err) {
    return {
      progress: placeholderProgress,
      currentMarketCap: null,
      isLive: false,
      error: err instanceof Error ? err.message : 'Unknown error fetching market cap.',
    }
  }
}

// ─────────────────────────────────────────────────────────────
// PAIR ADDRESS (for the embedded DexScreener chart)
// The live price chart uses DexScreener's own embeddable widget — the
// real interactive chart with its built-in timeframe/candle-type controls
// — rather than a custom-built one. It just needs the pair address to
// point at, which is cached after the first lookup since it never changes.
// ─────────────────────────────────────────────────────────────
let cachedPairAddress: string | null = null

export interface PairAddressResult {
  pairAddress: string | null
  error?: string
}

export async function getBestPairAddress(): Promise<PairAddressResult> {
  if (cachedPairAddress) return { pairAddress: cachedPairAddress }

  const { tokenAddress, dexscreenerChainId } = cookwareConfig
  if (!tokenAddress) return { pairAddress: null, error: 'No tokenAddress configured yet.' }

  try {
    const res = await fetch(`${DEXSCREENER_TOKENS_URL}${tokenAddress}`)
    if (!res.ok) throw new Error(`DexScreener returned ${res.status}`)
    const data = (await res.json()) as { pairs: DexScreenerPair[] | null }
    const pairsOnChain = (data.pairs ?? []).filter((p) => p.chainId === dexscreenerChainId)

    if (pairsOnChain.length === 0) {
      return { pairAddress: null, error: 'No trading pair found yet for this token on this chain.' }
    }

    const best = pairsOnChain.reduce((top, p) =>
      (p.liquidity?.usd ?? 0) > (top.liquidity?.usd ?? 0) ? p : top,
    )
    if (!best.pairAddress) {
      return { pairAddress: null, error: 'Pair found, but no pair address was returned.' }
    }

    cachedPairAddress = best.pairAddress
    return { pairAddress: cachedPairAddress }
  } catch (err) {
    return {
      pairAddress: null,
      error: err instanceof Error ? err.message : 'Unknown error resolving the trading pair.',
    }
  }
}

export function getCurrentDay(launchDate: string, now: Date = new Date()): number {
  const start = new Date(launchDate + 'T00:00:00')
  const diffMs = now.getTime() - start.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  return Math.max(1, diffDays + 1)
}

/** Compact currency formatting for big round goals: 1_000_000_000 → "$1B". */
export function formatCompactUsd(value: number): string {
  const trim = (n: number) => (n % 1 === 0 ? n.toFixed(0) : n.toFixed(1))
  const abs = Math.abs(value)
  if (abs >= 1_000_000_000) return `$${trim(value / 1_000_000_000)}B`
  if (abs >= 1_000_000) return `$${trim(value / 1_000_000)}M`
  if (abs >= 1_000) return `$${trim(value / 1_000)}K`
  return `$${value.toLocaleString()}`
}

/** Same compact rounding as formatCompactUsd, but for plain (non-dollar) quantities. */
export function formatCompactNumber(value: number): string {
  const trim = (n: number) => (n % 1 === 0 ? n.toFixed(0) : n.toFixed(1))
  const abs = Math.abs(value)
  if (abs >= 1_000_000_000) return `${trim(value / 1_000_000_000)}bn`
  if (abs >= 1_000_000) return `${trim(value / 1_000_000)}m`
  if (abs >= 1_000) return `${trim(value / 1_000)}k`
  return value.toLocaleString()
}

// ─────────────────────────────────────────────────────────────
// ON-CHAIN STATS: HOLDER REWARDS + PER-WALLET PAYOUT CHECK
// Both now go through our own serverless API routes (/api/onchain-stats,
// /api/payout-check) instead of calling Blockscout directly from the
// browser. Those routes call Blockscout's PRO API (fast, higher rate
// limit, falls back to the free public instance if no key is configured
// yet) and cache results briefly in Redis — so repeat visitors get an
// instant cached response instead of everyone re-triggering the same
// slow paginated lookup independently.
// ─────────────────────────────────────────────────────────────

export interface StatValue {
  value: number | null
  isLive: boolean
  error?: string
  /** True if the underlying lookup hit its pagination safety cap — the real total may be higher. */
  truncated?: boolean
}

export interface HolderRewardsSummary {
  isLive: boolean
  error?: string
  /** Total $HOOD paid out, in USD — null if a live price isn't available. */
  totalUsd: number | null
  /** Total $HOOD paid out, in HOOD tokens. */
  totalHood: number | null
  /** Number of individual payout transfers. */
  payoutsCount: number | null
  /** Number of distinct COOKWARE holders (i.e. eligible/earning). */
  holdersCount: number | null
  truncated?: boolean
}

/** Combined snapshot for the "HOLDER REWARDS" summary card. */
export async function getHolderRewardsSummary(): Promise<HolderRewardsSummary> {
  try {
    const res = await fetch('/api/onchain-stats')
    const data = (await res.json()) as Omit<HolderRewardsSummary, 'error'> & { error?: string }
    if (!res.ok) throw new Error(data.error ?? `Stats API returned ${res.status}`)
    if (!data.isLive) throw new Error(data.error ?? 'On-chain stats unavailable right now.')
    return data
  } catch (err) {
    return {
      isLive: false,
      error: err instanceof Error ? err.message : 'Unknown error fetching holder rewards.',
      totalUsd: null,
      totalHood: null,
      payoutsCount: null,
      holdersCount: null,
    }
  }
}

// Basic sanity check before hitting the API with something that isn't an address.
const EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/

/**
 * How much $HOOD a specific wallet has received from the distributor —
 * looked up (and briefly cached) server-side via /api/payout-check.
 */
export async function getHoodReceivedByAddress(walletAddress: string): Promise<StatValue> {
  const address = walletAddress.trim()
  if (!EVM_ADDRESS_RE.test(address)) {
    return { value: null, isLive: false, error: "That doesn't look like a valid wallet address." }
  }

  try {
    const res = await fetch(`/api/payout-check?address=${encodeURIComponent(address)}`)
    const data = (await res.json()) as StatValue
    if (!res.ok) throw new Error(data.error ?? `Payout check API returned ${res.status}`)
    return { ...data, isLive: true }
  } catch (err) {
    return {
      value: null,
      isLive: false,
      error: err instanceof Error ? err.message : 'Unknown error fetching payout history.',
    }
  }
}

// ─────────────────────────────────────────────────────────────
// GLOBAL "REMIND VLAD" CLICK COUNTER
// Backed by Vercel KV (Redis) via a serverless function at /api/reminders
// (see api/reminders.ts) — your own storage, no third-party service.
// Requires a KV store created and connected in the Vercel dashboard;
// see the setup notes in api/reminders.ts.
// ─────────────────────────────────────────────────────────────
const REMINDERS_API_URL = '/api/reminders'

interface ReminderApiResponse {
  value: number
}

/** Reads the current global count WITHOUT incrementing it — safe to call on page load. */
export async function fetchGlobalReminderCount(): Promise<number> {
  try {
    const res = await fetch(REMINDERS_API_URL)
    if (!res.ok) throw new Error(`Counter API returned ${res.status}`)
    const data = (await res.json()) as ReminderApiResponse
    return Number(data.value) || 0
  } catch {
    // API unreachable (e.g. KV not set up yet) — fall back to the configured
    // starting value rather than showing a hard error for something this
    // low-stakes.
    return cookwareConfig.startingReminderCount
  }
}

/**
 * Increments the global count by 1 and returns the new authoritative value.
 * Returns null on failure so the caller can decide how to handle it (e.g.
 * keep the optimistic local bump rather than rolling it back).
 */
export async function bumpGlobalReminderCount(): Promise<number | null> {
  try {
    const res = await fetch(REMINDERS_API_URL, { method: 'POST' })
    if (!res.ok) throw new Error(`Counter API returned ${res.status}`)
    const data = (await res.json()) as ReminderApiResponse
    return Number(data.value)
  } catch {
    return null
  }
}
