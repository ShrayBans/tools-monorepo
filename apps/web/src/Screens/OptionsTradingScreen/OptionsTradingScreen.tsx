import { Badge } from "@shray/ui"
import useLocalStorage from "@shray/ui/src/hooks/useLocalStorage"
import { formatNumberWithCommas } from "@shray/ui/src/lib/formatNumber"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"

import { trpc } from "../../lib/trpc"
import DebugSchwabTab from "./DebugSchwabTab"
import DebugTab from "./DebugTab"
import MoversTab from "./MoversTab"
import OptionsTab from "./PutsTab"
import SchwabTab from "./SchwabTab"
import SchwabTransactionsTab from "./SchwabTransactionsTab"
import StarredOptionsTab from "./StarredOptionsTab"
import WatchlistTab from "./WatchlistTab"

interface StockData {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap?: number
  lastUpdated: number
}

interface PutOpportunity {
  symbol: string
  strike: number
  expirationDate: number
  premium: number
  impliedVolatility: number
  distanceFromStrike: number
  annualizedReturn: number
  probabilityOTM: number
}

interface UnusualActivity {
  symbol: string
  optionType: "call" | "put"
  strike: number
  expirationDate: number
  volume: number
  openInterest: number
  volumeOIRatio: number
  lastPrice: number
  impliedVolatility: number
}

export default function OptionsTradingScreen() {
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as { tab?: string }

  const [activeTab, setActiveTab] = useState<
    "watchlist" | "puts" | "movers" | "starred" | "debug" | "schwab" | "schwab-debug" | "schwab-transactions"
  >("puts")
  const [selectedSymbol, setSelectedSymbol] = useState<string>("AAPL")
  const [debugSymbol, setDebugSymbol] = useState<string>("AAPL")

  // Watchlist filter using local storage - only for watchlist tab now
  const [watchlistFilter, setWatchlistFilter] = useLocalStorage<string[]>("options-watchlist-filter", [
    "TSLA",
    "NVDA",
    "AAPL",
  ])

  // Initialize tab from URL search params
  useEffect(() => {
    const tabFromUrl = search.tab as
      | "watchlist"
      | "puts"
      | "movers"
      | "starred"
      | "debug"
      | "schwab"
      | "schwab-debug"
      | "schwab-transactions"
    if (
      tabFromUrl &&
      ["watchlist", "puts", "movers", "starred", "debug", "schwab", "schwab-debug", "schwab-transactions"].includes(
        tabFromUrl,
      )
    ) {
      setActiveTab(tabFromUrl)
    }
  }, [search.tab])

  // Update URL when tab changes
  const handleTabChange = (
    newTab: "watchlist" | "puts" | "movers" | "starred" | "debug" | "schwab" | "schwab-debug" | "schwab-transactions",
  ) => {
    setActiveTab(newTab)
    // @ts-ignore
    navigate({
      // @ts-ignore
      search: (prev) => ({ ...prev, tab: newTab }),
      // @ts-ignore
      replace: true,
    })
  }

  // Remove ticker from watchlist filter
  const removeTicker = (tickerToRemove: string) => {
    setWatchlistFilter(watchlistFilter.filter((ticker) => ticker !== tickerToRemove))
    toast.success(`${tickerToRemove} removed from watchlist filter`)
  }

  // API calls
  const watchlistQuery = trpc.options.watchlist.get.useQuery({ useCache: true })
  const topMoversQuery = trpc.options.analysis.topMovers.useQuery({ limit: 10 })
  const putOpportunitiesQuery = trpc.options.analysis.scanPutOpportunities.useQuery({
    maxDaysToExpiration: 45,
    minAnnualizedReturn: 10,
  })
  const unusualActivityQuery = trpc.options.options.unusualActivity.useQuery({
    symbol: selectedSymbol,
  })

  // Functions for watchlist tab only
  const addTicker = (ticker: string) => {
    const upperTicker = ticker.toUpperCase()
    const availableSymbols = watchlistQuery.data?.symbols || []
    if (!watchlistFilter.includes(upperTicker) && availableSymbols.includes(upperTicker)) {
      setWatchlistFilter([...watchlistFilter, upperTicker])
      toast.success(`${upperTicker} added to watchlist filter`)
    } else if (watchlistFilter.includes(upperTicker)) {
      toast.error(`${upperTicker} is already in the watchlist filter`)
    } else {
      toast.error(`${upperTicker} is not available in the watchlist`)
    }
  }

  // Debug queries
  const debugWatchlistQuery = trpc.options.debug.debugWatchlist.useQuery(undefined, {
    enabled: activeTab === "debug",
  })
  const debugOptionsChainQuery = trpc.options.debug.rawOptionsChain.useQuery(
    {
      symbol: debugSymbol,
    },
    {
      enabled: activeTab === "debug",
    },
  )
  const debugPutOpportunitiesQuery = trpc.options.debug.rawPutOpportunities.useQuery(
    {
      symbol: debugSymbol,
      maxDaysToExpiration: 45,
    },
    {
      enabled: activeTab === "debug",
    },
  )
  const testYahooApiQuery = trpc.options.debug.testYahooApi.useQuery(
    {
      symbol: debugSymbol,
    },
    {
      enabled: activeTab === "debug",
    },
  )

  // Mutations
  const clearCacheMutation = trpc.options.cache.clear.useMutation()
  const clearSchwabCacheMutation = trpc.schwab.clearSchwabCache.useMutation({
    onSuccess: (result) => {
      toast.success(`Refreshed Schwab data (${result.clearedCaches} caches cleared)`)
    },
    onError: (error) => {
      toast.error(`Failed to refresh Schwab data: ${error.message}`)
    },
  })

  const handleRefresh = async () => {
    try {
      await clearCacheMutation.mutateAsync()

      // Refetch all queries
      watchlistQuery.refetch()
      topMoversQuery.refetch()
      putOpportunitiesQuery.refetch()
      unusualActivityQuery.refetch()

      // Refetch debug queries if on debug tab
      if (activeTab === "debug") {
        debugWatchlistQuery.refetch()
        debugOptionsChainQuery.refetch()
        debugPutOpportunitiesQuery.refetch()
        testYahooApiQuery.refetch()
      }

      toast.success("Data refreshed successfully!")
    } catch (error) {
      toast.error("Failed to refresh data")
      console.error("Refresh error:", error)
    }
  }

  const formatCurrency = (value: number) => `$${formatNumberWithCommas(Number(value.toFixed(2)))}`
  const formatPercent = (value: number) => `${value.toFixed(2)}%`
  const formatDate = (timestamp: number) => new Date(timestamp).toLocaleDateString("en-US", { timeZone: "UTC" })
  const formatDateTime = (timestamp: number) => new Date(timestamp).toLocaleString()

  const tabs = [
    { id: "puts", label: "Options", icon: "📈" },
    // { id: "watchlist", label: "Watchlist", icon: "📊" },
    // { id: "movers", label: "Top Movers", icon: "🎯" },
    // { id: "starred", label: "Pinned Options", icon: "⭐" },
    { id: "schwab", label: "Schwab Accounts", icon: "🏦" },
    { id: "schwab-transactions", label: "Schwab Transactions", icon: "💰" },
    { id: "schwab-debug", label: "Schwab Debug", icon: "🔧" },
    { id: "debug", label: "Debug Data", icon: "🔍" },
  ]

  return (
    <div className="min-h-screen">
      {/* Fixed Header */}
      <div className="bg-background border-b border-border sticky top-0 z-10">
        <div className="px-2 pt-2 pb-0">
          <div className="flex justify-between items-center mb-0">
            <h1 className="text-3xl font-bold text-primary">Options Trading Dashboard</h1>
            <div className="flex items-center space-x-4">
              {watchlistQuery.data?.lastUpdated && (
                <span className="text-sm text-primary">
                  Last updated: {formatDateTime(watchlistQuery.data.lastUpdated)}
                </span>
              )}
              <div className="flex flex-col space-y-1">
                <button
                  onClick={handleRefresh}
                  disabled={clearCacheMutation.isLoading}
                  className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs rounded border border-blue-300 disabled:opacity-50"
                >
                  {clearCacheMutation.isLoading ? "Refreshing..." : "🔄 Refresh Yahoo"}
                </button>
                <button
                  onClick={() => clearSchwabCacheMutation.mutate()}
                  disabled={clearSchwabCacheMutation.isLoading}
                  className="px-2 py-1 bg-green-100 hover:bg-green-200 text-green-700 text-xs rounded border border-green-300 disabled:opacity-50"
                >
                  {clearSchwabCacheMutation.isLoading ? "Refreshing..." : "🔄 Refresh Schwab"}
                </button>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-border">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as any)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-primary hover:border-gray-300"
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6">
        {/* Watchlist Tab */}
        {activeTab === "watchlist" && (
          <WatchlistTab
            watchlistQuery={watchlistQuery}
            formatCurrency={formatCurrency}
            formatPercent={formatPercent}
            setSelectedSymbol={setSelectedSymbol}
          />
        )}

        {/* Options Tab (Calls & Puts) */}
        {activeTab === "puts" && (
          <OptionsTab
            watchlistQuery={watchlistQuery}
            formatCurrency={formatCurrency}
            formatPercent={formatPercent}
            formatDate={formatDate}
          />
        )}

        {/* Top Movers Tab */}
        {activeTab === "movers" && <MoversTab formatCurrency={formatCurrency} formatPercent={formatPercent} />}

        {/* Starred Options Tab */}
        {activeTab === "starred" && (
          <StarredOptionsTab
            formatCurrency={formatCurrency}
            formatPercent={formatPercent}
            formatDate={formatDate}
            formatDateTime={formatDateTime}
          />
        )}

        {activeTab === "debug" && (
          <DebugTab
            debugSymbol={debugSymbol}
            setDebugSymbol={setDebugSymbol}
            watchlistQuery={watchlistQuery}
            formatDateTime={formatDateTime}
            formatCurrency={formatCurrency}
            formatPercent={formatPercent}
          />
        )}

        {/* Schwab Accounts Tab */}
        {activeTab === "schwab" && (
          <SchwabTab formatDateTime={formatDateTime} formatCurrency={formatCurrency} formatPercent={formatPercent} />
        )}

        {/* Schwab Transactions Tab */}
        {activeTab === "schwab-transactions" && (
          <SchwabTransactionsTab
            formatDateTime={formatDateTime}
            formatCurrency={formatCurrency}
            formatPercent={formatPercent}
          />
        )}

        {/* Schwab Debug Tab */}
        {activeTab === "schwab-debug" && (
          <DebugSchwabTab
            formatDateTime={formatDateTime}
            formatCurrency={formatCurrency}
            formatPercent={formatPercent}
          />
        )}
      </div>
    </div>
  )
}
