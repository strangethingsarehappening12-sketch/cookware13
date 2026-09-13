import { Redis } from '@upstash/redis'
import type { VercelRequest, VercelResponse } from '@vercel/node'

// Self-contained deliberately (no local './_lib' imports) — matching the
// exact pattern already proven to work in api/reminders.ts.
const redis = new Redis({
  url: process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL ?? '',
  token: process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? '',
})

const CHAIN_ID = 4663
function blockscoutApiBase(): string {
  return process.env.BLOCKSCOUT_API_KEY
    ? `https://api.blockscout.com/${CHAIN_ID}/api/v2`
    : 'https://robinhoodchain.blockscout.com/api/v2'
}

async function blockscoutFetch<T = any>(path: string, params: Record<string, string> = {}): Promise<T> {
  const apiKey = process.env.BLOCKSCOUT_API_KEY
  const url = new URL(`${blockscoutApiBase()}${path}`)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
  if (apiKey) url.searchParams.set('apikey', apiKey)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Blockscout returned ${res.status}`)
  return res.json() as Promise<T>
}

const COOKWARE_TOKEN = '0x315A404872AE8D4FaD6939461a4ab0B691817777'
const HOOD_TOKEN = '0xfB5b5778d45AE47F15323fb59B666c655174A79C'
const DISTRIBUTOR = '0xcED96B8EEa958A0d53cD99F502fCaC15754D8345'

const CACHE_KEY = 'cookware:onchain-stats'
const CACHE_TTL_SECONDS = 45
const MAX_TRANSFER_PAGES = 8

export const config = {
  maxDuration: 30,
}

interface TokenTransfer {
  from?: { hash?: string }
  total?: { value?: string; decimals?: string } | null
}
interface TransfersResponse {
  items: TokenTransfer[]
  next_page_params: Record<string, string | number> | null
}

async function fetchDistributed() {
  let total = 0
  let payoutsCount = 0
  let params: Record<string, string> = { token: HOOD_TOKEN, type: 'ERC-20' }

  for (let page = 0; page < MAX_TRANSFER_PAGES; page++) {
    const data = await blockscoutFetch<TransfersResponse>(
      `/addresses/${DISTRIBUTOR}/token-transfers`,
      params,
    )
    for (const t of data.items ?? []) {
      const isOutgoing = t.from?.hash?.toLowerCase() === DISTRIBUTOR.toLowerCase()
      if (isOutgoing && t.total?.value) {
        const decimals = Number(t.total.decimals ?? 18)
        total += Number(t.total.value) / 10 ** decimals
        payoutsCount += 1
      }
    }
    if (!data.next_page_params) return { total, payoutsCount, truncated: false }
    params = Object.fromEntries(
      Object.entries({ token: HOOD_TOKEN, type: 'ERC-20', ...data.next_page_params }).map(
        ([k, v]) => [k, String(v)],
      ),
    )
  }
  return { total, payoutsCount, truncated: true }
}

interface CachedPayload {
  isLive: boolean
  totalHood: number | null
  payoutsCount: number | null
  truncated: boolean
  holdersCount: number | null
  totalUsd: number | null
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const cached = await redis.get<CachedPayload>(CACHE_KEY)
    if (cached) {
      return res.status(200).json({ ...cached, cached: true })
    }

    const [holdersData, distributed, hoodInfo] = await Promise.all([
      blockscoutFetch<{ token_holders_count?: string }>(`/tokens/${COOKWARE_TOKEN}/counters`).catch(
        () => null,
      ),
      fetchDistributed().catch(() => null),
      blockscoutFetch<{ exchange_rate?: string | null }>(`/tokens/${HOOD_TOKEN}`).catch(() => null),
    ])

    const holdersCount = holdersData ? Number(holdersData.token_holders_count) : null
    const hoodPrice = hoodInfo ? Number(hoodInfo.exchange_rate) : null

    const payload: CachedPayload = {
      isLive: distributed !== null,
      totalHood: distributed?.total ?? null,
      payoutsCount: distributed?.payoutsCount ?? null,
      truncated: distributed?.truncated ?? false,
      holdersCount: holdersCount !== null && Number.isFinite(holdersCount) ? holdersCount : null,
      totalUsd:
        distributed && hoodPrice && Number.isFinite(hoodPrice) ? distributed.total * hoodPrice : null,
    }

    if (payload.isLive) {
      await redis.set(CACHE_KEY, payload, { ex: CACHE_TTL_SECONDS })
    }

    return res.status(200).json({ ...payload, cached: false })
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Unknown error fetching on-chain stats.',
    })
  }
}
