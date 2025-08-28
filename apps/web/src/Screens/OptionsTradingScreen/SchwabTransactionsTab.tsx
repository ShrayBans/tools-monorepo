import { ReactTable } from "@shray/ui"
import { formatNumberWithCommas } from "@shray/ui/src/lib/formatNumber"
import { useMemo, useState } from "react"
import toast from "react-hot-toast"

import { trpc } from "../../lib/trpc"

interface SchwabTransactionsTabProps {
  formatDateTime: (timestamp: number) => string
  formatCurrency: (value: number) => string
  formatPercent: (value: number) => string
}

export default function SchwabTransactionsTab({
  formatDateTime,
  formatCurrency,
  formatPercent,
}: SchwabTransactionsTabProps) {
  const [selectedAccountHash, setSelectedAccountHash] = useState("")
  const [startDate, setStartDate] = useState(() => {
    // Default to 30 days ago
    const date = new Date()
    date.setDate(date.getDate() - 30)
    return date.toISOString()
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString())
  const [transactionType, setTransactionType] = useState<
    | "TRADE"
    | "RECEIVE_AND_DELIVER"
    | "DIVIDEND_OR_INTEREST"
    | "ACH_RECEIPT"
    | "ACH_DISBURSEMENT"
    | "CASH_RECEIPT"
    | "CASH_DISBURSEMENT"
    | "ELECTRONIC_FUND"
    | "WIRE_OUT"
    | "WIRE_IN"
    | "JOURNAL"
    | "MEMORANDUM"
    | "MARGIN_CALL"
    | "MONEY_MARKET"
    | "SMA_ADJUSTMENT"
    | ""
  >("")
  const [searchQuery, setSearchQuery] = useState("")

  // Get account list to populate dropdown
  const accountsQuery = trpc.schwab.getAccounts.useQuery()
  const accounts = accountsQuery.data?.accounts || []

  // Get account numbers with hashes
  const accountNumbersQuery = trpc.schwab.getAccountNumbers.useQuery()
  const accountNumbers = accountNumbersQuery.data?.accountNumbers || []

  // Get transactions query
  const transactionsQuery = trpc.schwab.getTransactions.useQuery(
    {
      accountHash: selectedAccountHash,
      startDate,
      endDate,
      types: transactionType || undefined,
    },
    {
      enabled: !!selectedAccountHash,
    },
  )

  const transactions = transactionsQuery.data?.transactions || []

  // Filter transactions based on search
  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions

    const query = searchQuery.toLowerCase()
    return transactions.filter(
      (txn: any) =>
        txn.description?.toLowerCase().includes(query) ||
        txn.transactionItem?.instrument?.symbol?.toLowerCase().includes(query) ||
        txn.type?.toLowerCase().includes(query) ||
        txn.subAccount?.toLowerCase().includes(query),
    )
  }, [transactions, searchQuery])

  // Define table columns
  const columns = useMemo(
    () => [
      {
        Header: "Date",
        accessor: "settlementDate",
        Cell: ({ getValue }: any) => {
          const date = getValue()
          return <div className="text-xs font-mono">{date ? new Date(date).toLocaleDateString() : "-"}</div>
        },
      },
      {
        Header: "Type",
        accessor: "type",
        Cell: ({ getValue }: any) => (
          <div className="text-xs font-medium">
            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">{getValue()}</span>
          </div>
        ),
      },
      {
        Header: "Symbol",
        accessor: "transactionItem.instrument.symbol",
        Cell: ({ row }: any) => {
          const instrument = row.original.transactionItem?.instrument
          if (!instrument) return <div className="text-xs text-gray-400">-</div>

          const isOption = instrument.assetType === "OPTION"
          return (
            <div className="text-xs">
              <div className={`font-semibold ${isOption ? "text-purple-600" : "text-blue-600"}`}>
                {instrument.symbol}
              </div>
              {isOption && instrument.putCall && <div className="text-gray-500">{instrument.putCall}</div>}
            </div>
          )
        },
      },
      {
        Header: "Description",
        accessor: "description",
        Cell: ({ getValue }: any) => (
          <div className="text-xs text-primary max-w-[250px] truncate" title={getValue()}>
            {getValue() || "-"}
          </div>
        ),
      },
      {
        Header: "Quantity",
        accessor: "transactionItem.amount",
        Cell: ({ getValue }: any) => {
          const amount = getValue()
          if (!amount) return <div className="text-xs text-center">-</div>

          const isNegative = amount < 0
          return (
            <div className="text-xs text-center">
              <div className={`font-semibold ${isNegative ? "text-destructive" : "text-green-600"}`}>
                {formatNumberWithCommas(Math.abs(amount))}
              </div>
              <div className={`text-xs ${isNegative ? "text-destructive" : "text-green-500"}`}>
                {isNegative ? "Sell" : "Buy"}
              </div>
            </div>
          )
        },
      },
      {
        Header: "Price",
        accessor: "transactionItem.price",
        Cell: ({ getValue }: any) => {
          const price = getValue()
          return <div className="text-xs text-center font-mono">{price ? formatCurrency(price) : "-"}</div>
        },
      },
      {
        Header: "Net Amount",
        accessor: "netAmount",
        Cell: ({ getValue }: any) => {
          const amount = getValue()
          if (!amount) return <div className="text-xs text-center">-</div>

          const isNegative = amount < 0
          return (
            <div
              className={`text-xs text-right font-mono font-semibold ${isNegative ? "text-destructive" : "text-green-600"}`}
            >
              {formatCurrency(amount)}
            </div>
          )
        },
      },
      {
        Header: "Fees",
        accessor: "fees",
        Cell: ({ row }: any) => {
          const fees = row.original.fees
          if (!fees) return <div className="text-xs text-center">-</div>

          const totalFees = Object.values(fees).reduce(
            (sum: number, fee: any) => sum + (typeof fee === "number" ? fee : 0),
            0,
          )
          return <div className="text-xs text-right font-mono">{formatCurrency(Number(totalFees))}</div>
        },
      },
    ],
    [formatCurrency],
  )

  // Handle date input change to ensure proper format
  const handleDateChange = (value: string, setter: (date: string) => void) => {
    if (value) {
      // Convert to ISO format if it's just a date
      const date = new Date(value)
      setter(date.toISOString())
    } else {
      setter("")
    }
  }

  const transactionTypes = [
    "TRADE",
    "RECEIVE_AND_DELIVER",
    "DIVIDEND_OR_INTEREST",
    "ACH_RECEIPT",
    "ACH_DISBURSEMENT",
    "CASH_RECEIPT",
    "CASH_DISBURSEMENT",
    "ELECTRONIC_FUND",
    "WIRE_OUT",
    "WIRE_IN",
    "JOURNAL",
    "MEMORANDUM",
    "MARGIN_CALL",
    "MONEY_MARKET",
    "SMA_ADJUSTMENT",
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">💰 Schwab Transactions</h2>
        <div className="text-xs text-primary">
          {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-foregroundx border border-border rounded p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Account Selection */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-primary">Account</label>
            <select
              value={selectedAccountHash}
              onChange={(e) => setSelectedAccountHash(e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select account...</option>
              {accountNumbers.map((accountNumber) => {
                // Find the corresponding account details
                const accountDetails = accounts.find(
                  (acc) => acc.securitiesAccount.accountNumber === accountNumber.accountNumber,
                )
                return (
                  <option key={accountNumber.hashValue} value={accountNumber.hashValue}>
                    {accountDetails?.securitiesAccount.type || "Account"} - {accountNumber.accountNumber}
                  </option>
                )
              })}
            </select>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-primary">Start Date</label>
            <input
              type="date"
              value={startDate ? startDate.split("T")[0] : ""}
              onChange={(e) => handleDateChange(e.target.value, setStartDate)}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-primary">End Date</label>
            <input
              type="date"
              value={endDate ? endDate.split("T")[0] : ""}
              onChange={(e) => handleDateChange(e.target.value, setEndDate)}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Transaction Type */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-primary">Type</label>
            <select
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value as typeof transactionType)}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All types</option>
              {transactionTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search descriptions, symbols..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary"
              >
                ✕
              </button>
            )}
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => transactionsQuery.refetch()}
            disabled={transactionsQuery.isLoading}
            className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs rounded border border-blue-300 disabled:opacity-50"
          >
            {transactionsQuery.isLoading ? "Loading..." : "🔄 Refresh"}
          </button>
        </div>

        {/* Quick Date Filters */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium text-primary">Quick filters:</span>
          {[
            { label: "Last 7 days", days: 7 },
            { label: "Last 30 days", days: 30 },
            { label: "Last 90 days", days: 90 },
            { label: "YTD", days: null },
          ].map((filter) => (
            <button
              key={filter.label}
              onClick={() => {
                const end = new Date()
                const start = new Date()

                if (filter.days === null) {
                  // YTD
                  start.setMonth(0, 1)
                } else {
                  start.setDate(start.getDate() - filter.days)
                }

                setStartDate(start.toISOString())
                setEndDate(end.toISOString())
              }}
              className="px-2 py-1 bg-foregroundx  text-primary text-xs rounded border"
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction Summary */}
      {transactionsQuery.data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded border">
            <div className="text-xs font-medium text-blue-800">Total Transactions</div>
            <div className="text-sm font-semibold">{transactionsQuery.data.ytdTransactionsCount}</div>
          </div>
          <div className="bg-purple-50 p-3 rounded border">
            <div className="text-xs font-medium text-purple-800">Options Transactions</div>
            <div className="text-sm font-semibold">{transactionsQuery.data.optionsTransactionsCount}</div>
          </div>
          <div
            className={`p-3 rounded border ${transactionsQuery.data.realizedPnL >= 0 ? "bg-green-50" : "bg-red-50"}`}
          >
            <div
              className={`text-xs font-medium ${transactionsQuery.data.realizedPnL >= 0 ? "text-green-800" : "text-destructive"}`}
            >
              Realized P&L
            </div>
            <div
              className={`text-sm font-semibold ${transactionsQuery.data.realizedPnL >= 0 ? "text-green-600" : "text-destructive"}`}
            >
              {formatCurrency(transactionsQuery.data.realizedPnL)}
            </div>
          </div>
          <div className="bg-foregroundx p-3 rounded border">
            <div className="text-xs font-medium text-gray-800">Date Range</div>
            <div className="text-xs">
              {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {!selectedAccountHash ? (
        <div className="text-center py-8">
          <div className="text-gray-500">Please select an account to view transactions.</div>
        </div>
      ) : transactionsQuery.isLoading ? (
        <div className="text-center py-8">
          <div className="text-gray-500">Loading transactions...</div>
        </div>
      ) : transactionsQuery.error ? (
        <div className="text-center py-8">
          <div className="text-destructive">Error: {transactionsQuery.error.message}</div>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500">
            {searchQuery ? "No transactions match your search." : "No transactions found for the selected criteria."}
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <ReactTable
            columns={columns}
            data={filteredTransactions}
            enableSorting={true}
            enablePagination={true}
            initialState={{
              sortBy: [{ id: "settlementDate", desc: true }], // Sort by newest first
              pageSize: 25,
            }}
            className="border border-border rounded w-full"
            headerCellClassName="text-xs font-medium text-gray-500 uppercase tracking-wide bg-foregroundx py-2 px-3"
            cellClassName="text-xs py-2 px-3 border-t border-gray-100"
            emptyState={<div className="text-center py-8 text-gray-500">No transactions found</div>}
          />
        </div>
      )}
    </div>
  )
}
