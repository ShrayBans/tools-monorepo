import { ReactTable } from "@shray/ui"
import useLocalStorage from "@shray/ui/src/hooks/useLocalStorage"
import { useMemo } from "react"
import toast from "react-hot-toast"

import { trpc } from "../../lib/trpc"

interface StarredOptionsTabProps {
  formatCurrency: (value: number) => string
  formatPercent: (value: number) => string
  formatDate: (timestamp: number) => string
  formatDateTime: (timestamp: number) => string
}

export default function StarredOptionsTab({
  formatCurrency,
  formatPercent,
  formatDate,
  formatDateTime,
}: StarredOptionsTabProps) {
  // Starred options storage
  const [starredOptions, setStarredOptions] = useLocalStorage<Record<string, any>>("starred-options", {})

  // Get current stock quotes for price comparison
  const starredSymbols = useMemo(() => {
    const symbols = new Set<string>()
    Object.values(starredOptions).forEach((option: any) => {
      if (option.symbol) symbols.add(option.symbol)
    })
    return Array.from(symbols)
  }, [starredOptions])

  const stockQuotesQuery = trpc.options.watchlist.get.useQuery(
    { useCache: true },
    { enabled: starredSymbols.length > 0 },
  )

  // Helper function to remove an option from starred
  const removeStar = (optionKey: string, option: any) => {
    const updated = { ...starredOptions }
    delete updated[optionKey]
    setStarredOptions(updated)
    toast.success(`Removed ${option.symbol} $${option.strike} put from starred options`)
  }

  // Helper function to clear all starred options
  const clearAllStarred = () => {
    if (Object.keys(starredOptions).length === 0) {
      toast.error("No starred options to clear")
      return
    }

    if (window.confirm(`Are you sure you want to remove all ${Object.keys(starredOptions).length} starred options?`)) {
      setStarredOptions({})
      toast.success("All starred options have been removed")
    }
  }

  // Convert starred options to array with additional calculated fields
  const starredOptionsArray = useMemo(() => {
    // Convert the data array to a Map for easier lookup
    const stockPricesArray = stockQuotesQuery.data?.data || []
    const stockPricesMap = new Map()
    stockPricesArray.forEach((stock: any) => {
      stockPricesMap.set(stock.symbol, stock)
    })

    return Object.entries(starredOptions)
      .map(([key, option]) => {
        const currentStockData = stockPricesMap.get(option.symbol)
        const currentPrice = currentStockData?.price || option.stockPriceWhenStarred || 0
        const priceChange =
          currentPrice > 0 && option.stockPriceWhenStarred > 0
            ? ((currentPrice - option.stockPriceWhenStarred) / option.stockPriceWhenStarred) * 100
            : 0

        // Calculate how much time has passed since starring
        const daysSinceStarred = option.starredAt
          ? Math.floor((Date.now() - option.starredAt) / (1000 * 60 * 60 * 24))
          : 0

        // Calculate current moneyness
        const distanceFromStrike = currentPrice > 0 ? ((currentPrice - option.strike) / currentPrice) * 100 : 0
        const isNowITM = option.strike >= currentPrice
        const isNowOTM = option.strike < currentPrice

        return {
          ...option,
          optionKey: key,
          currentStockPrice: currentPrice,
          priceChange,
          daysSinceStarred,
          distanceFromStrike,
          isNowITM,
          isNowOTM,
          daysToExpirationNow: option.expirationDate
            ? Math.max(0, Math.ceil((option.expirationDate - Date.now()) / (1000 * 60 * 60 * 24)))
            : 0,
        }
      })
      .sort((a, b) => (b.starredAt || 0) - (a.starredAt || 0)) // Sort by most recently starred
  }, [starredOptions, stockQuotesQuery.data?.data])

  // Define columns for the starred options table
  const columns = useMemo(
    () => [
      {
        Header: "⭐",
        accessor: "star",
        width: 40,
        Cell: ({ row }: any) => {
          const option = row.original
          return (
            <button
              onClick={() => removeStar(option.optionKey, option)}
              className="hover:scale-110 transition-transform duration-200 focus:outline-none"
              title="Remove from starred"
            >
              <span className="text-yellow-500 text-lg">⭐</span>
            </button>
          )
        },
      },
      {
        Header: "Symbol",
        accessor: "symbol",
        Cell: ({ getValue }: any) => <div className="text-xs font-bold text-blue-600">{getValue()}</div>,
      },
      {
        Header: "Strike",
        accessor: "strike",
        Cell: ({ getValue }: any) => <div className="text-xs font-mono font-medium">{formatCurrency(getValue())}</div>,
      },
      {
        Header: "Current Stock",
        accessor: "currentStockPrice",
        Cell: ({ row }: any) => {
          const { currentStockPrice, stockPriceWhenStarred, priceChange } = row.original
          return (
            <div className="text-xs">
              <div className="font-mono font-medium">{formatCurrency(currentStockPrice)}</div>
              {stockPriceWhenStarred > 0 && priceChange !== 0 && (
                <div className={`text-xs ${priceChange > 0 ? "text-green-600" : "text-destructive"}`}>
                  {priceChange > 0 ? "+" : ""}
                  {priceChange.toFixed(1)}%
                </div>
              )}
            </div>
          )
        },
      },
      {
        Header: "Bid/Ask",
        accessor: "bidAsk",
        Cell: ({ row }: any) => {
          const { bid, ask } = row.original
          const mid = bid && ask ? (bid + ask) / 2 : 0
          return (
            <div className="text-xs text-center">
              <div className="font-medium ">{formatCurrency(mid)}</div>
              <div className="text-gray-500">
                {formatCurrency(bid || 0)}/{formatCurrency(ask || 0)}
              </div>
            </div>
          )
        },
      },
      {
        Header: "Greeks",
        accessor: "greeks",
        Cell: ({ row }: any) => {
          const { delta, gamma, theta, vega } = row.original
          return (
            <div className="text-xs font-mono text-primary">
              Δ:{delta?.toFixed(3) || "N/A"} Γ:{gamma?.toFixed(4) || "N/A"} Θ:{theta?.toFixed(3) || "N/A"} ν:
              {vega?.toFixed(3) || "N/A"}
            </div>
          )
        },
      },
      {
        Header: "Days Left",
        accessor: "daysToExpirationNow",
        Cell: ({ getValue }: any) => {
          const days = getValue()
          return (
            <div
              className={`text-xs text-center font-mono ${days <= 7 ? "text-destructive font-bold" : days <= 30 ? "text-yellow-600" : "text-primary"}`}
            >
              {days}d
            </div>
          )
        },
      },
      {
        Header: "Status",
        accessor: "status",
        Cell: ({ row }: any) => {
          const { isNowITM, isNowOTM, distanceFromStrike } = row.original

          return (
            <div className="text-xs text-center">
              <span
                className={`px-1 py-0.5 rounded text-xs font-medium ${
                  isNowITM ? "bg-red-100 text-destructive" : "bg-green-100 text-green-800"
                }`}
              >
                {isNowITM ? "ITM" : "OTM"}
              </span>
              {isNowOTM && distanceFromStrike > 0 && (
                <div className="text-gray-500 mt-0.5">{distanceFromStrike.toFixed(1)}%</div>
              )}
            </div>
          )
        },
      },
      {
        Header: "Starred",
        accessor: "starredAt",
        Cell: ({ row }: any) => {
          const { starredAt, daysSinceStarred } = row.original
          return (
            <div className="text-xs text-center">
              <div className="text-primary">{formatDate(starredAt)}</div>
              <div className="text-gray-500">{daysSinceStarred}d ago</div>
            </div>
          )
        },
      },
      {
        Header: "Expiration",
        accessor: "expirationDate",
        Cell: ({ getValue }: any) => <div className="text-xs text-center font-mono">{formatDate(getValue())}</div>,
      },
    ],
    [formatCurrency, formatPercent, formatDate],
  )

  const starredCount = Object.keys(starredOptions).length

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold ">
            Pinned Options {starredCount > 0 && <span className="text-gray-500">({starredCount})</span>}
          </h2>
          {stockQuotesQuery.isLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          )}
        </div>

        {starredCount > 0 && (
          <button
            onClick={clearAllStarred}
            className="px-3 py-1 bg-red-100 text-destructive rounded text-sm hover:bg-red-200 transition-colors"
          >
            Clear All ({starredCount})
          </button>
        )}
      </div>

      {/* Quick stats */}
      {starredCount > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="font-semibold text-primary">Total Starred</div>
            <div className="text-2xl font-bold text-blue-600">{starredCount}</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="font-semibold text-primary">Unique Symbols</div>
            <div className="text-2xl font-bold text-green-600">{starredSymbols.length}</div>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg">
            <div className="font-semibold text-primary">Expiring Soon</div>
            <div className="text-2xl font-bold text-yellow-600">
              {starredOptionsArray.filter((opt) => opt.daysToExpirationNow <= 7).length}
            </div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="font-semibold text-primary">Now ITM</div>
            <div className="text-2xl font-bold text-destructive">
              {starredOptionsArray.filter((opt) => opt.isNowITM).length}
            </div>
          </div>
        </div>
      )}

      {/* Starred options table */}
      {starredCount > 0 ? (
        <ReactTable
          columns={columns}
          data={starredOptionsArray}
          enableSorting={true}
          enablePagination={true}
          loading={stockQuotesQuery.isLoading}
          emptyState={<div className="text-center py-8 text-gray-500">No starred options found</div>}
          className="bg-background rounded-lg border border-border"
          headerCellClassName="text-xs font-medium text-gray-500 uppercase tracking-wide bg-foregroundx py-2 px-3"
          cellClassName="text-xs py-2 px-3"
        />
      ) : (
        <div className="text-center py-12 bg-foregroundx rounded-lg">
          <div className="text-6xl mb-4">⭐</div>
          <div className="text-xl font-semibold text-primary mb-2">No Starred Options</div>
          <div className="text-gray-500 mb-4">Star options from other tabs to track them here</div>
          <div className="text-sm text-gray-400">
            Use the star (☆) button in any options table to add options to your watchlist
          </div>
        </div>
      )}
    </div>
  )
}
