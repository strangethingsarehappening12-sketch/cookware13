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

const HOOD_TOKEN = '0xfB5b5778d45AE47F15323fb59B666c655174A79C'
const DISTRIBUTOR = '0xcED96B8EEa958A0d53cD99F502fCaC15754D8345'
const EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/
const MAX_TRANSFER_PAGES = 40
const CACHE_TTL_SECONDS = 30

export const config = {
  maxDuration: 30,
}

interface TokenTransfer {
  from?: { hash?: string }
  token?: { address_hash?: string } | null
  total?: { value?: string; decimals?: string } | null
}
interface TransfersResponse {
  items: TokenTransfer[]
  next_page_params: Record<string, string | number> | null
}

interface CachedPayload {
  value: number
  isLive: boolean
  truncated: boolean
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const address = String(req.query.address ?? '').trim()
  if (!EVM_ADDRESS_RE.test(address)) {
    return res.status(400).json({ error: "That doesn't look like a valid wallet address." })
  }

  const cacheKey = `cookware:payout-check:${address.toLowerCase()}`

  try {
    const cached = await redis.get<CachedPayload>(cacheKey)
    if (cached) {
      return res.status(200).json({ ...cached, cached: true })
    }

    let total = 0
    let truncated = false
    // Deliberately NOT filtering server-side by `token`/`type` — see the
    // note in onchain-stats.ts. Filtering to $HOOD happens below instead.
    let params: Record<string, string> = {}

    for (let page = 0; page < MAX_TRANSFER_PAGES; page++) {
      const data = await blockscoutFetch<TransfersResponse>(
        `/addresses/${address}/token-transfers`,
        params,
      )
      for (const t of data.items ?? []) {
        const fromDistributor = t.from?.hash?.toLowerCase() === DISTRIBUTOR.toLowerCase()
        const isHood = t.token?.address_hash?.toLowerCase() === HOOD_TOKEN.toLowerCase()
        if (fromDistributor && isHood && t.total?.value) {
          const decimals = Number(t.total.decimals ?? 18)
          total += Number(t.total.value) / 10 ** decimals
        }
      }
      if (!data.next_page_params) break
      params = Object.fromEntries(
        Object.entries(data.next_page_params).map(([k, v]) => [k, String(v)]),
      )
      if (page === MAX_TRANSFER_PAGES - 1) truncated = true
    }

    const payload: CachedPayload = { value: total, isLive: true, truncated }
    await redis.set(cacheKey, payload, { ex: CACHE_TTL_SECONDS })
    return res.status(200).json({ ...payload, cached: false })
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Unknown error fetching payout history.',
    })
  }
}
