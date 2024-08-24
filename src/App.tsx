import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee } from "./utils/types"

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [isLoading, setIsLoading] = useState(false)
  const [isFiltered, setIsFiltered] = useState(false)
  const [transactionsState, setTransactionsState] = useState<{ [id: string]: boolean }>({})

  const handleTransactionApprovalChange = useCallback((transactionId: string, newValue: boolean) => {
    setTransactionsState(prevState => ({
      ...prevState,
      [transactionId]: newValue,
    }))
  }, [])

  const transactions = useMemo(() => {
    const mergedTransactions = (paginatedTransactions?.data ?? transactionsByEmployee ?? []).map(transaction => ({
      ...transaction,
      approved: transactionsState[transaction.id] !== undefined ? transactionsState[transaction.id] : transaction.approved,
    }))
    return mergedTransactions
  }, [paginatedTransactions, transactionsByEmployee, transactionsState])

  const loadAllTransactions = useCallback(async () => {
    setIsLoading(true)
    transactionsByEmployeeUtils.invalidateData()
    paginatedTransactionsUtils.invalidateData()

    await employeeUtils.fetchAll()
    await paginatedTransactionsUtils.fetchAll()

    setIsLoading(false)
  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils])

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      setIsFiltered(true)
      paginatedTransactionsUtils.invalidateData()
      await transactionsByEmployeeUtils.fetchById(employeeId)
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions()
    }
  }, [employeeUtils.loading, employees, loadAllTransactions])

  const handleSelectChange = useCallback(
    async (newValue: Employee | null) => {
      if (newValue === null || newValue.id === EMPTY_EMPLOYEE.id) {
        setIsFiltered(false)
        await loadAllTransactions()
      } else {
        if (newValue.id) {
          await loadTransactionsByEmployee(newValue.id)
        }
      }
    },
    [loadAllTransactions, loadTransactionsByEmployee]
  )

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={isLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={handleSelectChange}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={transactions} onTransactionApprovalChange={handleTransactionApprovalChange} />

          {transactions !== null && !isFiltered && (
            <button
              className="RampButton"
              disabled={paginatedTransactionsUtils.loading}
              onClick={async () => {
                await paginatedTransactionsUtils.fetchAll()
              }}
            >
              View More
            </button>
          )}
        </div>
      </main>
    </Fragment>
  )
}
