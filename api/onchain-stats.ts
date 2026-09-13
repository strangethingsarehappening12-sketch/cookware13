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

// The older, Etherscan-compatible API — a genuinely separate code path in
// Blockscout's backend from the v2 REST API above. Used as a fallback for
// bulk transfer listing, since the v2 REST endpoints (both address- and
// token-centric) are 500ing for $HOOD specifically, while this shim isn't.
function blockscoutLegacyBase(): string {
  return process.env.BLOCKSCOUT_API_KEY
    ? `https://api.blockscout.com/v2/api`
    : 'https://robinhoodchain.blockscout.com/api'
}

async function blockscoutLegacyFetch<T = any>(params: Record<string, string>): Promise<T> {
  const apiKey = process.env.BLOCKSCOUT_API_KEY
  const url = new URL(blockscoutLegacyBase())
  if (apiKey) url.searchParams.set('chain_id', String(CHAIN_ID))
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
  if (apiKey) url.searchParams.set('apikey', apiKey)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Blockscout (legacy API) returned ${res.status}`)
  return res.json() as Promise<T>
}

const COOKWARE_TOKEN = '0x315A404872AE8D4FaD6939461a4ab0B691817777'
const HOOD_TOKEN = '0xfB5b5778d45AE47F15323fb59B666c655174A79C'
const DISTRIBUTOR = '0xcED96B8EEa958A0d53cD99F502fCaC15754D8345'

const CACHE_KEY = 'cookware:onchain-stats'
const CACHE_TTL_SECONDS = 45
const MAX_TRANSFER_PAGES = 20

export const config = {
  maxDuration: 30,
}

interface EtherscanTokenTx {
  from?: string
  value?: string
  tokenDecimal?: string
  contractAddress?: string
}

async function fetchDistributed() {
  // Querying transfers via Blockscout's v2 REST API (both address-centric
  // and token-centric) 500s for $HOOD specifically. This uses the older,
  // Etherscan-compatible shim instead — different backend code path,
  // paginated with page/offset rather than a cursor.
  //
  // Only `address` is passed as a server-side filter — NOT `contractaddress`
  // as well. Combining both returned a suspiciously small total, consistent
  // with this shim not correctly honoring both filters together (likely
  // ignoring one and returning a slice of unrelated recent activity
  // instead). Filtering to $HOOD is done ourselves below, using each
  // transfer's own `contractAddress` field.
  let total = 0
  let payoutsCount = 0
  const offset = 100

  for (let page = 1; page <= MAX_TRANSFER_PAGES; page++) {
    const data = await blockscoutLegacyFetch<{ result: EtherscanTokenTx[] | string }>({
      module: 'account',
      action: 'tokentx',
      address: DISTRIBUTOR,
      page: String(page),
      offset: String(offset),
      sort: 'desc',
    })

    const items = Array.isArray(data.result) ? data.result : []
    if (items.length === 0) return { total, payoutsCount, truncated: false }

    for (const t of items) {
      const isOutgoing = t.from?.toLowerCase() === DISTRIBUTOR.toLowerCase()
      const isHood = t.contractAddress?.toLowerCase() === HOOD_TOKEN.toLowerCase()
      if (isOutgoing && isHood && t.value) {
        const decimals = Number(t.tokenDecimal ?? 18)
        total += Number(t.value) / 10 ** decimals
        payoutsCount += 1
      }
    }

    if (items.length < offset) return { total, payoutsCount, truncated: false }
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
  error?: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const cached = await redis.get<CachedPayload>(CACHE_KEY)
    if (cached) {
      return res.status(200).json({ ...cached, cached: true })
    }

    let distributedError: string | null = null
    const [holdersData, distributed, hoodInfo] = await Promise.all([
      blockscoutFetch<{ token_holders_count?: string }>(`/tokens/${COOKWARE_TOKEN}/counters`).catch(
        () => null,
      ),
      fetchDistributed().catch((err) => {
        distributedError = err instanceof Error ? err.message : 'Unknown error.'
        return null
      }),
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
      ...(distributed === null && { error: distributedError ?? 'Unable to load holder rewards right now.' }),
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
