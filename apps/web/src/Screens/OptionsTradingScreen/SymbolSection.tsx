import { ReactTable } from "@shray/ui"
import useLocalStorage from "@shray/ui/src/hooks/useLocalStorage"
import { useMemo, useState } from "react"
import toast from "react-hot-toast"

import { trpc } from "../../lib/trpc"

interface SymbolSectionProps {
  symbol: string
  isExpanded: boolean
  onToggle: () => void
  filters: {
    deltaFilter: number | null
    deltaFilterEnabled: boolean
    selectedExpiration: string
    // Advanced filters
    volumeFilter: number
    openInterestFilter: number
    maxSpreadFilter: number
    minDaysFilter: number
    maxDaysFilter: number
    minIVFilter: number
    maxIVFilter: number
    moneynessFilter: string
    minReturnFilter: number
  }
  formatCurrency: (value: number) => string
  formatPercent: (value: number) => string
  formatDate: (timestamp: number) => string
}

export default function SymbolSection({
  symbol,
  isExpanded,
  onToggle,
  filters,
  formatCurrency,
  formatPercent,
  formatDate,
}: SymbolSectionProps) {
  const {
    deltaFilter,
    deltaFilterEnabled,
    selectedExpiration,
    volumeFilter,
    openInterestFilter,
    maxSpreadFilter,
    minDaysFilter,
    maxDaysFilter,
    minIVFilter,
    maxIVFilter,
    moneynessFilter,
    minReturnFilter,
  } = filters

  // Starred options storage
  const [starredOptions, setStarredOptions] = useLocalStorage<Record<string, any>>("starred-options", {})

  // Helper function to generate unique key for an option
  const generateOptionKey = (option: any, symbol: string) => {
    return `${symbol}-${option.strike}-${option.expirationDate}`
  }

  // Helper function to star/unstar an option
  const toggleStar = (option: any) => {
    const optionKey = generateOptionKey(option, symbol)
    const isCurrentlyStarred = starredOptions[optionKey]

    if (isCurrentlyStarred) {
      // Remove from starred
      const updated = { ...starredOptions }
      delete updated[optionKey]
      setStarredOptions(updated)
      toast.success(`Removed ${symbol} $${option.strike} put from starred options`)
    } else {
      // Add to starred with timestamp and current stock price
      const stockPrice = allPutsQuery.data?.data?.stockPrice || 0
      const starredOption = {
        ...option,
        symbol,
        stockPriceWhenStarred: stockPrice,
        starredAt: Date.now(),
        lastUpdated: Date.now(),
      }
      setStarredOptions({
        ...starredOptions,
        [optionKey]: starredOption,
      })
      toast.success(`Starred ${symbol} $${option.strike} put option`)
    }
  }

  // Only fetch data when section is expanded
  const allPutsQuery = trpc.options.options.allPuts.useQuery(
    {
      symbol,
      expiration: selectedExpiration || undefined,
    },
    {
      enabled: isExpanded,
    },
  )

  // Apply comprehensive filtering
  const filteredPuts = useMemo(() => {
    if (!allPutsQuery.data?.data?.puts) return []

    const stockPrice = allPutsQuery.data.data.stockPrice || 0

    // Add computed premium percentage to each put
    const putsWithPremiumPercent = allPutsQuery.data.data.puts.map((put: any) => {
      const mid = put.bid && put.ask ? (put.bid + put.ask) / 2 : 0
      const premiumPercent = put.strike > 0 ? (mid / put.strike) * 100 : 0
      return {
        ...put,
        premiumPercent,
      }
    })

    return putsWithPremiumPercent.filter((put: any) => {
      // Delta filter
      if (deltaFilterEnabled && deltaFilter !== null) {
        if (put.delta === undefined || put.delta === null) return true // Include puts without delta data
        const deltaInRange =
          Math.abs(put.delta) >= Math.abs(deltaFilter - 0.05) && Math.abs(put.delta) <= Math.abs(deltaFilter + 0.05)
        if (!deltaInRange) return false
      }

      // Volume filter
      if (volumeFilter > 0 && (put.volume || 0) < volumeFilter) return false

      // Open Interest filter
      if (openInterestFilter > 0 && (put.openInterest || 0) < openInterestFilter) return false

      // Bid-Ask Spread filter
      if (maxSpreadFilter > 0 && put.bid && put.ask) {
        const spread = put.ask - put.bid
        if (spread > maxSpreadFilter) return false
      }

      // Days to expiration filter
      if (put.daysToExpiration) {
        if (put.daysToExpiration < minDaysFilter || put.daysToExpiration > maxDaysFilter) return false
      }

      // IV filter (convert percentage to decimal for comparison)
      if (put.impliedVolatility) {
        const ivPercent = put.impliedVolatility * 100
        if (ivPercent < minIVFilter || ivPercent > maxIVFilter) return false
      }

      // Moneyness filter
      if (moneynessFilter !== "all" && stockPrice > 0) {
        const isITM = put.strike >= stockPrice
        const isOTM = put.strike < stockPrice
        const distanceFromStock = Math.abs((stockPrice - put.strike) / stockPrice) * 100
        const isATM = distanceFromStock <= 2 // Within 2% is considered ATM

        switch (moneynessFilter) {
          case "itm":
            if (!isITM) return false
            break
          case "otm":
            if (!isOTM) return false
            break
          case "atm":
            if (!isATM) return false
            break
        }
      }

      // Minimum annualized return filter
      if (minReturnFilter > 0 && stockPrice > 0 && put.bid && put.ask && put.daysToExpiration) {
        const premium = (put.bid + put.ask) / 2
        const otmAmount = Math.max(0, stockPrice - put.strike)
        const margin1 = (0.2 * stockPrice - otmAmount + premium) * 100
        const margin2 = 0.1 * put.strike * 100
        const marginRequired = Math.max(margin1, margin2)
        const cashRequired = marginRequired - premium * 100

        if (cashRequired > 0) {
          const returnOnMargin = ((premium * 100) / cashRequired) * 100
          const annualizedReturn = returnOnMargin * (365 / put.daysToExpiration)
          if (annualizedReturn < minReturnFilter) return false
        }
      }

      return true
    })
  }, [
    allPutsQuery.data?.data?.puts,
    allPutsQuery.data?.data?.stockPrice,
    deltaFilter,
    deltaFilterEnabled,
    volumeFilter,
    openInterestFilter,
    maxSpreadFilter,
    minDaysFilter,
    maxDaysFilter,
    minIVFilter,
    maxIVFilter,
    moneynessFilter,
    minReturnFilter,
  ])

  // Define columns for ReactTable with Greeks and margin data
  const columns = useMemo(
    () => [
      {
        Header: "⭐",
        accessor: "star",
        width: 40,
        Cell: ({ row }: any) => {
          const option = row.original
          const optionKey = generateOptionKey(option, symbol)
          const isStarred = starredOptions[optionKey]

          return (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                toggleStar(option)
              }}
              className="hover:scale-110 transition-transform duration-200 focus:outline-none"
              title={isStarred ? "Remove from starred" : "Add to starred"}
            >
              {isStarred ? (
                <span className="text-yellow-500 text-lg">⭐</span>
              ) : (
                <span className="text-gray-300 hover:text-yellow-400 text-lg">☆</span>
              )}
            </button>
          )
        },
      },
      {
        Header: "Strike",
        accessor: "strike",
        Cell: ({ row }: any) => {
          const strike = row.original.strike
          const stockPrice = allPutsQuery.data?.data?.stockPrice || 0
          const strikeToStockDiff = stockPrice > 0 ? ((stockPrice - strike) / stockPrice) * 100 : 0

          return (
            <div className="text-xs font-mono font-medium">
              <div>{formatCurrency(strike)}</div>
              {stockPrice > 0 && (
                <div className={`text-xs ${strikeToStockDiff > 0 ? "text-green-600" : "text-destructive"}`}>
                  ({strikeToStockDiff > 0 ? "+" : ""}
                  {strikeToStockDiff.toFixed(1)}%)
                </div>
              )}
            </div>
          )
        },
      },
      {
        Header: "Bid/Ask",
        accessor: "premiumPercent", // Sort by premiumPercent field we added
        Cell: ({ row }: any) => {
          const { bid, ask, premiumPercent } = row.original
          const mid = (bid + ask) / 2
          return (
            <div className="text-xs text-center">
              <div className="font-medium ">
                {formatCurrency(mid)} <span className="text-blue-600">({premiumPercent.toFixed(2)}%)</span>
              </div>
              <div className="text-gray-500">
                {formatCurrency(bid)}/{formatCurrency(ask)}
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
        Header: "Days",
        accessor: "daysToExpiration",
        Cell: ({ getValue }: any) => <div className="text-xs text-center font-mono">{getValue() || "N/A"}d</div>,
      },
      {
        Header: "Vol/OI",
        accessor: "volumeOI",
        Cell: ({ row }: any) => {
          const { volume, openInterest } = row.original
          return (
            <div className="text-xs text-center font-mono">
              <div className="">{volume?.toLocaleString() || "0"}</div>
              <div className="text-gray-500">{openInterest?.toLocaleString() || "0"}</div>
            </div>
          )
        },
      },
      {
        Header: "IV",
        accessor: "impliedVolatility",
        Cell: ({ getValue }: any) => (
          <div className="text-xs text-center font-mono">{formatPercent(getValue() * 100)}</div>
        ),
      },
      {
        Header: "Status",
        accessor: "inTheMoney",
        Cell: ({ row }: any) => {
          const { inTheMoney, strike } = row.original
          const stockPrice = allPutsQuery.data?.data?.stockPrice || 0
          const distance = stockPrice > 0 ? ((stockPrice - strike) / stockPrice) * 100 : 0

          return (
            <div className="text-xs text-center">
              <span
                className={`px-1 py-0.5 rounded text-xs font-medium ${
                  inTheMoney ? "bg-red-100 text-destructive" : "bg-green-100 text-green-800"
                }`}
              >
                {inTheMoney ? "ITM" : "OTM"}
              </span>
              {!inTheMoney && distance > 0 && <div className="text-gray-500 mt-0.5">{distance.toFixed(1)}%</div>}
            </div>
          )
        },
      },
      {
        Header: "Margin",
        accessor: "marginAnalysis",
        Cell: ({ row }: any) => {
          const put = row.original
          const stockPrice = allPutsQuery.data?.data?.stockPrice || 0

          if (!stockPrice || !put.bid || !put.ask) {
            return <div className="text-xs text-gray-500">N/A</div>
          }

          const premium = (put.bid + put.ask) / 2

          // Simple margin calculation (20% of underlying - OTM amount + premium, min 10% of strike)
          const otmAmount = Math.max(0, stockPrice - put.strike)
          const margin1 = (0.2 * stockPrice - otmAmount + premium) * 100
          const margin2 = 0.1 * put.strike * 100
          const marginRequired = Math.max(margin1, margin2)
          const cashRequired = marginRequired - premium * 100
          const returnOnMargin = cashRequired > 0 ? ((premium * 100) / cashRequired) * 100 : 0

          if (put.daysToExpiration > 0) {
            const annualizedReturn = returnOnMargin * (365 / put.daysToExpiration)

            return (
              <div className="text-xs font-mono text-primary">
                M:${marginRequired.toFixed(0)} C:${cashRequired.toFixed(0)} R:{returnOnMargin.toFixed(1)}% A:
                {annualizedReturn.toFixed(1)}%
              </div>
            )
          }

          return <div className="text-xs text-gray-500">Expired</div>
        },
      },
      {
        Header: "⭐ JSON",
        accessor: "actions",
        Cell: ({ row }: any) => {
          const put = row.original
          const optionKey = generateOptionKey(put, symbol)
          const isStarred = starredOptions[optionKey]

          return (
            <div className="relative group flex items-center space-x-2">
              {/* Star button */}
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  toggleStar(put)
                }}
                className="hover:scale-110 transition-transform duration-200 focus:outline-none"
                title={isStarred ? "Remove from starred" : "Add to starred"}
              >
                {isStarred ? (
                  <span className="text-yellow-500 text-lg">⭐</span>
                ) : (
                  <span className="text-gray-300 hover:text-yellow-400 text-lg">☆</span>
                )}
              </button>

              {/* JSON button */}
              <button
                className="px-1 py-0.5 bg-blue-100 text-blue-800 rounded text-xs hover:bg-blue-200 transition-colors"
                title="View complete data (hover to preview, click to copy)"
                onClick={(e) => {
                  e.preventDefault()
                  const jsonData = JSON.stringify(
                    {
                      ...put,
                      expirationDate: new Date(put.expirationDate).toISOString(),
                      lastTradeDate: put.lastTradeDate ? new Date(put.lastTradeDate).toISOString() : undefined,
                    },
                    null,
                    2,
                  )
                  navigator.clipboard.writeText(jsonData)
                  toast.success(`${symbol} put data copied to clipboard!`)
                }}
              >
                📋
              </button>
              <div className="absolute right-0 top-full mt-1 w-96 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 max-h-64 overflow-auto">
                <div className="font-semibold mb-2 text-blue-300">Complete Put Data (click button to copy):</div>
                <pre className="whitespace-pre-wrap break-words">
                  {JSON.stringify(
                    {
                      ...put,
                      // Convert timestamps to readable dates for better readability
                      expirationDate: new Date(put.expirationDate).toISOString(),
                      lastTradeDate: put.lastTradeDate ? new Date(put.lastTradeDate).toISOString() : undefined,
                    },
                    null,
                    2,
                  )}
                </pre>
              </div>
            </div>
          )
        },
      },
    ],
    [formatCurrency, formatPercent, formatDate, symbol, allPutsQuery.data?.data?.stockPrice, starredOptions],
  )

  return (
    <div className="bg-background border border-border rounded-lg overflow-hidden">
      {/* Collapsible Header */}
      <button
        onClick={onToggle}
        className="w-full p-4 text-left  transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-semibold">{symbol}</span>
              <span className={`transform transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}>▶</span>
            </div>

            {/* Quick Stats Preview */}
            {allPutsQuery.data?.data && (
              <div className="flex items-center space-x-4 text-sm text-primary">
                <span>Stock: {formatCurrency(allPutsQuery.data.data.stockPrice || 0)}</span>
                <span>Total Puts: {allPutsQuery.data.data.totalPuts || 0}</span>
                <span>OTM: {allPutsQuery.data.data.putsOTM || 0}</span>
                {deltaFilterEnabled && deltaFilter !== null && <span>Filtered: {filteredPuts.length}</span>}
              </div>
            )}
          </div>

          {/* Loading/Status Indicator */}
          <div className="flex items-center space-x-2">
            {isExpanded && allPutsQuery.isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            )}
            {isExpanded && allPutsQuery.error && <span className="text-destructive text-sm">Error</span>}
            {isExpanded && allPutsQuery.data && <span className="text-green-600 text-sm">✓</span>}
          </div>
        </div>
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="border-t border-border p-3">
          {allPutsQuery.isLoading ? (
            <div className="text-center py-4 text-sm">Loading puts data for {symbol}...</div>
          ) : allPutsQuery.error ? (
            <div className="text-destructive text-center py-4 text-sm">Error loading puts data for {symbol}</div>
          ) : (
            <div className="space-y-3">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                <div className="bg-blue-50 p-2 rounded">
                  <div className="font-semibold text-primary">Stock Price</div>
                  <div className="text-lg font-bold">{formatCurrency(allPutsQuery.data?.data?.stockPrice || 0)}</div>
                </div>
                <div className="bg-green-50 p-2 rounded">
                  <div className="font-semibold text-primary">Total Puts</div>
                  <div className="text-lg font-bold">{allPutsQuery.data?.data?.totalPuts || 0}</div>
                </div>
                <div className="bg-yellow-50 p-2 rounded">
                  <div className="font-semibold text-primary">With Volume</div>
                  <div className="text-lg font-bold">{allPutsQuery.data?.data?.putsWithVolume || 0}</div>
                </div>
                <div className="bg-purple-50 p-2 rounded">
                  <div className="font-semibold text-primary">OTM Puts</div>
                  <div className="text-lg font-bold">{allPutsQuery.data?.data?.putsOTM || 0}</div>
                </div>
                <div className="bg-red-50 p-2 rounded">
                  <div className="font-semibold text-primary">ITM Puts</div>
                  <div className="text-lg font-bold">{allPutsQuery.data?.data?.putsITM || 0}</div>
                </div>
              </div>

              {/* Puts Table */}
              <ReactTable
                columns={columns}
                data={filteredPuts}
                enableSorting={true}
                enablePagination={true}
                loading={allPutsQuery.isLoading}
                emptyState={
                  <div className="text-center py-4 text-gray-500 text-xs">
                    {deltaFilterEnabled && deltaFilter !== null
                      ? `No puts match delta filter ≈ ${deltaFilter} for ${symbol}`
                      : `No puts data available for ${symbol}`}
                  </div>
                }
                className="bg-background rounded border border-border"
                headerCellClassName="text-xs font-medium text-gray-500 uppercase tracking-wide bg-foregroundx py-1 px-2"
                cellClassName="text-xs py-0.5 px-2"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
