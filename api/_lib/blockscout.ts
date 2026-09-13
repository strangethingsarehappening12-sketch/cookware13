// Robinhood Chain's chain ID, for the Blockscout PRO API.
const CHAIN_ID = 4663

// Falls back to the free public instance if BLOCKSCOUT_API_KEY isn't set yet
// — this route works either way, and automatically gets faster/higher-limit
// once the key is added, with no code change needed.
function getApiBase(): string {
  return process.env.BLOCKSCOUT_API_KEY
    ? `https://api.blockscout.com/${CHAIN_ID}/api/v2`
    : 'https://robinhoodchain.blockscout.com/api/v2'
}

export async function blockscoutFetch<T = any>(
  path: string,
  params: Record<string, string> = {},
): Promise<T> {
  const apiKey = process.env.BLOCKSCOUT_API_KEY
  const url = new URL(`${getApiBase()}${path}`)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
  if (apiKey) url.searchParams.set('apikey', apiKey)

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Blockscout returned ${res.status}`)
  return res.json() as Promise<T>
}
