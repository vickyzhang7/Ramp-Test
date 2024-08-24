import { useCallback, useState } from "react"
import { PaginatedRequestParams, PaginatedResponse, Transaction } from "../utils/types"
import { PaginatedTransactionsResult } from "./types"
import { useCustomFetch } from "./useCustomFetch"

export function usePaginatedTransactions(): PaginatedTransactionsResult {
  const { fetchWithCache } = useCustomFetch()
  const [paginatedTransactions, setPaginatedTransactions] = useState<PaginatedResponse<Transaction[]> | null>(null)
  const [loading, setLoading] = useState(false)  // Separate loading state

  const fetchAll = useCallback(async () => {
    setLoading(true)  // Set loading to true when fetching
    const response = await fetchWithCache<PaginatedResponse<Transaction[]>, PaginatedRequestParams>(
      "paginatedTransactions",
      {
        page: paginatedTransactions === null ? 0 : paginatedTransactions.nextPage,
      }
    )

    setPaginatedTransactions((previousResponse) => {
      if (response === null) {
        return previousResponse
      }

      // Append new data to existing data
      if (previousResponse === null) {
        return response
      }

      return {
        data: [...previousResponse.data, ...response.data],
        nextPage: response.nextPage,
      }
    })

    setLoading(false)  // Set loading to false after fetching
  }, [fetchWithCache, paginatedTransactions])

  const invalidateData = useCallback(() => {
    setPaginatedTransactions(null)
  }, [])

  return { data: paginatedTransactions, loading, fetchAll, invalidateData }
}
