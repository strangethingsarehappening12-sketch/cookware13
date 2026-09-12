import { useCallback, useEffect, useState } from 'react'

/**
 * Demo persistence layer. Reads/writes localStorage.
 * To go live: replace the two effects below with API calls
 * (GET on mount, POST/PATCH on set) — the hook's return signature
 * (value, setValue) can stay identical, so components never change.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key)
      return raw !== null ? (JSON.parse(raw) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // localStorage unavailable (e.g. private mode) — fail silently in demo mode
    }
  }, [key, value])

  const reset = useCallback(() => setValue(initialValue), [initialValue])

  return [value, setValue, reset] as const
}
