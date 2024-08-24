import { useCallback, useState } from "react"
import { Employee } from "../utils/types"
import { useCustomFetch } from "./useCustomFetch"
import { EmployeeResult } from "./types"

export function useEmployees(): EmployeeResult {
  const { fetchWithCache } = useCustomFetch()
  const [employees, setEmployees] = useState<Employee[] | null>(null)
  const [loading, setLoading] = useState(false)  // Separate loading state

  const fetchAll = useCallback(async () => {
    setLoading(true)  // Set loading to true when fetching
    const employeesData = await fetchWithCache<Employee[]>("employees")
    setEmployees(employeesData)
    setLoading(false)  // Set loading to false after fetching
  }, [fetchWithCache])

  const invalidateData = useCallback(() => {
    setEmployees(null)
  }, [])

  return { data: employees, loading, fetchAll, invalidateData }
}