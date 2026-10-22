import { useState, useCallback } from 'react'

interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useApi<TArgs, TResult>(
  apiFn: (args: TArgs) => Promise<TResult>
) {
  const [state, setState] = useState<ApiState<TResult>>({
    data: null, loading: false, error: null
  })

  const execute = useCallback(async (args: TArgs) => {
    setState({ data: null, loading: true, error: null })
    try {
      const data = await apiFn(args)
      setState({ data, loading: false, error: null })
      return data
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setState({ data: null, loading: false, error: msg })
      return null
    }
  }, [apiFn])

  return { ...state, execute }
}
