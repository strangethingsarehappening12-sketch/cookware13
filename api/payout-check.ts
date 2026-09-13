import type { VercelRequest, VercelResponse } from '@vercel/node'
import { redis } from './_lib/redis'
import { blockscoutFetch } from './_lib/blockscout'

const HOOD_TOKEN = '0xfB5b5778d45AE47F15323fb59B666c655174A79C'
const DISTRIBUTOR = '0xcED96B8EEa958A0d53cD99F502fCaC15754D8345'
const EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/
const MAX_TRANSFER_PAGES = 40
const CACHE_TTL_SECONDS = 30

interface TokenTransfer {
  from?: { hash?: string }
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
    let params: Record<string, string> = { token: HOOD_TOKEN, type: 'ERC-20' }

    for (let page = 0; page < MAX_TRANSFER_PAGES; page++) {
      const data = await blockscoutFetch<TransfersResponse>(
        `/addresses/${address}/token-transfers`,
        params,
      )
      for (const t of data.items ?? []) {
        const fromDistributor = t.from?.hash?.toLowerCase() === DISTRIBUTOR.toLowerCase()
        if (fromDistributor && t.total?.value) {
          const decimals = Number(t.total.decimals ?? 18)
          total += Number(t.total.value) / 10 ** decimals
        }
      }
      if (!data.next_page_params) break
      params = Object.fromEntries(
        Object.entries({ token: HOOD_TOKEN, type: 'ERC-20', ...data.next_page_params }).map(
          ([k, v]) => [k, String(v)],
        ),
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
