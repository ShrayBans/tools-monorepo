import { createFuseSearch, searchTokenizedFuse } from "@shray/crossutils"
import { ReactTable } from "@shray/ui"
import { formatNumberWithCommas } from "@shray/ui/src/lib/formatNumber"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@shray/ui/src/shadcnBase/ShadcnAccordion"
import { split } from "lodash-es"
import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"

import { useSchwabTokenRefresh } from "../../hooks/useSchwabTokenRefresh"
import { trpc } from "../../lib/trpc"

interface SchwabTabProps {
  formatDateTime: (timestamp: number) => string
  formatCurrency: (value: number) => string
  formatPercent: (value: number) => string
}

export default function SchwabTab({ formatDateTime, formatCurrency, formatPercent }: SchwabTabProps) {
  // Helper function to format quantities with commas
  const formatQuantity = (value: number): string => {
    return formatNumberWithCommas(value)
  }

  const [expandedAll, setExpandedAll] = useState(true)
  const [expandedLogins, setExpandedLogins] = useState<string[]>([])
  const [expandedAccounts, setExpandedAccounts] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  // Nickname editing state
  const [editingAccount, setEditingAccount] = useState<{ loginId: string; accountNumber: string } | null>(null)
  const [nicknameInput, setNicknameInput] = useState("")

  // View toggle state
  const [viewMode, setViewMode] = useState<"hierarchy" | "table">("hierarchy")

  // Global filter state
  const [gainLossFilter, setGainLossFilter] = useState<"all" | "gainers" | "losers">("all")
  const [gainLossThreshold, setGainLossThreshold] = useState(0)
  const [positionSizeFilter, setPositionSizeFilter] = useState<"all" | "10k" | "25k" | "50k" | "1k">("all")
  const [assetTypeFilter, setAssetTypeFilter] = useState<
    "all" | "stocks" | "etfs" | "mutual_funds" | "options" | "cash"
  >("all")

  const schwabLoginListQuery = trpc.schwab.listSchwabLogins.useQuery()

  const hasAuthenticatedLogin = schwabLoginListQuery.data?.schwabLogins?.some((acc) => acc.isConnected) ?? false

  const accountsQuery = trpc.schwab.getAccounts.useQuery(undefined, {
    enabled: hasAuthenticatedLogin,
  })

  // Get account nicknames
  const accountNicknamesQuery = trpc.schwab.getAccountNicknames.useQuery(
    {},
    {
      enabled: hasAuthenticatedLogin,
    },
  )

  // Mutations for nickname management
  const setAccountNicknameMutation = trpc.schwab.setAccountNickname.useMutation({
    onSuccess: () => {
      toast.success("Account nickname updated")
      accountNicknamesQuery.refetch()
      setEditingAccount(null)
      setNicknameInput("")
    },
    onError: (error) => {
      toast.error(`Failed to update nickname: ${error.message}`)
    },
  })

  // Clear Schwab cache mutation
  const clearSchwabCacheMutation = trpc.schwab.clearSchwabCache.useMutation({
    onSuccess: (result) => {
      toast.success(`Refreshed Schwab data (${result.clearedCaches} caches cleared)`)
      // Invalidate and refetch account data
      accountsQuery.refetch()
    },
    onError: (error) => {
      toast.error(`Failed to refresh Schwab data: ${error.message}`)
    },
  })

  // Data variables
  const accounts = accountsQuery.data?.accounts || []
  const schwabLogins = schwabLoginListQuery.data?.schwabLogins || []
  const accountNicknames = accountNicknamesQuery.data?.nicknames || {}

  // Get nickname for an account
  const getAccountNickname = (accountNumber: string) => {
    return accountNicknames[accountNumber]?.nickname || ""
  }

  // Parse option details for cleaner display
  const parseOptionDetails = (instrument: any) => {
    if (instrument.assetType !== "OPTION") return null

    const description = instrument.description || ""
    const symbol = split(instrument.symbol, " ")[0] || ""

    // Try to extract date and strike from description
    // Example: "PROSHR SEMICNDCT 2X 08/15/2025 $78 Put"
    const dateMatch = description.match(/(\d{2}\/\d{2}\/\d{4})/)
    const strikeMatch = description.match(/\$(\d+(?:\.\d{2})?)/)
    const typeMatch = description.match(/(Put|Call)$/i)

    const expDate = dateMatch ? dateMatch[1] : "Unknown"
    const strike = strikeMatch ? `$${strikeMatch[1]}` : "Unknown"
    const optionType = typeMatch ? typeMatch[1] : instrument.putCall || "Unknown"

    return {
      formatted: `${symbol}: ${expDate} - ${strike} ${optionType}`,
      raw: description,
      expDate,
      strike,
      type: optionType,
    }
  }

  // Define columns for positions table
  const positionsColumns = useMemo(
    () => [
      {
        Header: "Symbol",
        accessor: "customSymbol", // Use computed property for sorting
        Cell: ({ row }: any) => {
          const instrument = row.original.instrument
          const isOption = instrument.assetType === "OPTION"
          const optionDetails = parseOptionDetails(instrument)

          if (isOption && optionDetails) {
            return (
              <div className="text-xs">
                <div className="font-semibold text-purple-600 cursor-help" title={optionDetails.raw}>
                  {optionDetails.formatted}
                </div>
              </div>
            )
          }

          return (
            <div className="text-xs">
              <div className="font-semibold text-blue-600">{instrument.symbol}</div>
            </div>
          )
        },
      },
      {
        Header: "Description",
        accessor: "description",
        Cell: ({ row }: any) => (
          <div className="text-xs text-primary max-w-[200px] truncate">{row.original.instrument.description}</div>
        ),
      },
      {
        Header: "Quantity",
        accessor: "quantity",
        Cell: ({ row }: any) => {
          const position = row.original
          const isShort = position.shortQuantity > 0
          const quantity = isShort ? -position.shortQuantity : position.longQuantity
          return (
            <div className="text-xs text-center">
              <div className="font-semibold">
                {quantity > 0 ? "+" : ""}
                {formatQuantity(Math.abs(quantity))}
              </div>
              <div className={`text-xs ${isShort ? "text-destructive" : "text-green-500"}`}>
                {isShort ? "Short" : "Long"}
              </div>
            </div>
          )
        },
      },
      {
        Header: "Market Value",
        accessor: "marketValue",
        Cell: ({ getValue }: any) => (
          <div className="text-xs text-center font-mono font-semibold">{formatCurrency(getValue())}</div>
        ),
      },
      {
        Header: "Avg Price",
        accessor: "averagePrice",
        Cell: ({ getValue }: any) => <div className="text-xs text-center font-mono">{formatCurrency(getValue())}</div>,
      },
      {
        Header: "Day P&L",
        accessor: "currentDayProfitLoss",
        Cell: ({ row }: any) => {
          const { currentDayProfitLoss, currentDayProfitLossPercentage } = row.original
          const isPositive = currentDayProfitLoss >= 0
          return (
            <div className="text-xs text-center">
              <div className={`font-semibold ${isPositive ? "text-green-600" : "text-destructive"}`}>
                {formatCurrency(currentDayProfitLoss)}
              </div>
              <div className={`text-xs ${isPositive ? "text-green-500" : "text-destructive"}`}>
                {formatPercent(currentDayProfitLossPercentage)}
              </div>
            </div>
          )
        },
      },
      {
        Header: "Unrealized P&L",
        accessor: "longOpenProfitLoss",
        Cell: ({ getValue }: any) => {
          const value = getValue() || 0
          const isPositive = value >= 0
          return (
            <div className={`text-xs text-center font-semibold ${isPositive ? "text-green-600" : "text-destructive"}`}>
              {formatCurrency(value)}
            </div>
          )
        },
      },
      {
        Header: "Option Details",
        accessor: "optionDetails",
        Cell: ({ row }: any) => {
          const instrument = row.original.instrument
          const isOption = instrument.assetType === "OPTION"
          if (!isOption) return <div className="text-xs text-gray-400">-</div>

          return (
            <div className="text-xs text-primary">
              <div>
                <span className="font-medium">Underlying:</span> {instrument.underlyingSymbol || "N/A"}
              </div>
              <div>
                <span className="font-medium">Type:</span> {instrument.putCall || "N/A"}
              </div>
            </div>
          )
        },
      },
    ],
    [formatCurrency, formatPercent],
  )

  // Define columns for flat table view (includes login and account info)
  const flatTableColumns = useMemo(
    () => [
      {
        Header: "Login",
        accessor: "loginName",
        Cell: ({ getValue }: any) => (
          <div
            className="text-xs font-medium text-blue-600"
            style={{ maxWidth: "20px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {getValue()}
          </div>
        ),
      },
      {
        Header: "Account",
        accessor: "accountNumber",
        Cell: ({ row }: any) => {
          const accountNumber = row.original.accountNumber
          const nickname = getAccountNickname(accountNumber)
          return (
            <div className="text-xs">
              <div className="font-medium">{accountNumber}</div>
              {nickname && <div className="text-gray-500 italic">{nickname}</div>}
            </div>
          )
        },
      },
      {
        Header: "Symbol",
        accessor: "symbol",
        Cell: ({ row }: any) => {
          const instrument = row.original.instrument
          const isOption = instrument.assetType === "OPTION"
          const optionDetails = parseOptionDetails(instrument)

          if (isOption && optionDetails) {
            return (
              <div className="flex items-center space-x-1">
                <div className="font-semibold text-purple-600 cursor-help" title={optionDetails.raw}>
                  {optionDetails.formatted}
                </div>
              </div>
            )
          }

          return (
            <div className="flex items-center space-x-1">
              <div className="font-semibold text-blue-600">{instrument.symbol}</div>
            </div>
          )
        },
      },
      {
        Header: "Description",
        accessor: "description",
        Cell: ({ row }: any) => (
          <div className="text-xs text-primary max-w-[200px] truncate">{row.original.instrument.description}</div>
        ),
      },
      {
        Header: "Type",
        accessor: "accountType",
        Cell: ({ getValue }: any) => <div className="text-xs text-center">{getValue()}</div>,
      },
      {
        Header: "Quantity",
        accessor: "quantity",
        Cell: ({ row }: any) => {
          const position = row.original
          const isShort = position.shortQuantity > 0
          const quantity = isShort ? -position.shortQuantity : position.longQuantity
          return (
            <div className="text-xs text-center">
              <div className="font-semibold">
                {quantity > 0 ? "+" : ""}
                {formatQuantity(Math.abs(quantity))}
              </div>
              <div className={`text-xs ${isShort ? "text-destructive" : "text-green-500"}`}>
                {isShort ? "Short" : "Long"}
              </div>
            </div>
          )
        },
      },
      {
        Header: "Market Value",
        accessor: "marketValue",
        Cell: ({ getValue }: any) => (
          <div className="text-xs text-center font-mono font-semibold">{formatCurrency(getValue())}</div>
        ),
      },
      {
        Header: "Avg Price",
        accessor: "averagePrice",
        Cell: ({ getValue }: any) => <div className="text-xs text-center font-mono">{formatCurrency(getValue())}</div>,
      },
      {
        Header: "Day P&L",
        accessor: "currentDayProfitLoss",
        Cell: ({ row }: any) => {
          const { currentDayProfitLoss, currentDayProfitLossPercentage } = row.original
          const isPositive = currentDayProfitLoss >= 0
          return (
            <div className="text-xs text-center">
              <div className={`font-semibold ${isPositive ? "text-green-600" : "text-destructive"}`}>
                {formatCurrency(currentDayProfitLoss)}
              </div>
              <div className={`text-xs ${isPositive ? "text-green-500" : "text-destructive"}`}>
                {formatPercent(currentDayProfitLossPercentage)}
              </div>
            </div>
          )
        },
      },
      {
        Header: "Unrealized P&L",
        accessor: "longOpenProfitLoss",
        Cell: ({ getValue }: any) => {
          const value = getValue() || 0
          const isPositive = value >= 0
          return (
            <div className={`text-xs text-center font-semibold ${isPositive ? "text-green-600" : "text-destructive"}`}>
              {formatCurrency(value)}
            </div>
          )
        },
      },
      {
        Header: "Option Details",
        accessor: "optionDetails",
        Cell: ({ row }: any) => {
          const instrument = row.original.instrument
          const isOption = instrument.assetType === "OPTION"
          if (!isOption) return <div className="text-xs text-gray-400">-</div>

          return (
            <div className="text-xs text-primary">
              <div>
                <span className="font-medium">Underlying:</span> {instrument.underlyingSymbol || "N/A"}
              </div>
              <div>
                <span className="font-medium">Type:</span> {instrument.putCall || "N/A"}
              </div>
            </div>
          )
        },
      },
    ],
    [formatCurrency, formatPercent, accountNicknames],
  )

  // Helper functions for nickname editing
  const handleEditClick = (loginId: string, accountNumber: string, currentNickname?: string) => {
    setEditingAccount({ loginId, accountNumber })
    setNicknameInput(currentNickname || "")
  }

  const handleSaveNickname = () => {
    if (!editingAccount) return

    setAccountNicknameMutation.mutate({
      loginId: editingAccount.loginId,
      accountNumber: editingAccount.accountNumber,
      nickname: nicknameInput.trim(),
    })
  }

  const handleCancelEdit = () => {
    setEditingAccount(null)
    setNicknameInput("")
  }

  // Group accounts by login (for now, we'll treat all accounts as under a single login since we only have one login)
  const loginGroups = schwabLogins
    .filter((login) => login.isConnected)
    .map((login) => ({
      login,
      accounts: accounts, // For now all accounts belong to the connected login
    }))

  // Create searchable positions data with computed properties
  const allPositions = useMemo(() => {
    return loginGroups.flatMap((group) =>
      group.accounts.flatMap((account) =>
        (account.securitiesAccount.positions || []).map((position) => ({
          ...position,
          loginName: group.login.name,
          accountNumber: account.securitiesAccount.accountNumber,
          accountType: account.securitiesAccount.type,
          customSymbol: position.instrument.symbol, // Add computed property for sorting
        })),
      ),
    )
  }, [loginGroups])

  // Fuse search setup
  const fuseKeys = [
    "instrument.symbol",
    "instrument.description",
    "instrument.underlyingSymbol",
    "loginName",
    "accountNumber",
    "accountType",
  ]
  const fuseData = useMemo(() => createFuseSearch(fuseKeys, allPositions), [allPositions])

  // Apply global filters to positions
  const applyGlobalFilters = (positions: any[]) => {
    return positions.filter((position) => {
      // Gain/Loss filter
      if (gainLossFilter === "gainers") {
        const performance = getPositionPerformance(position)
        if (performance <= gainLossThreshold) return false
      } else if (gainLossFilter === "losers") {
        const performance = getPositionPerformance(position)
        if (performance >= -gainLossThreshold) return false
      }

      // Position Size filter
      const marketValue = Math.abs(position.marketValue)
      if (positionSizeFilter === "1k" && marketValue >= 1000) return false
      if (positionSizeFilter === "10k" && marketValue < 10000) return false
      if (positionSizeFilter === "25k" && marketValue < 25000) return false
      if (positionSizeFilter === "50k" && marketValue < 50000) return false

      // Asset Type filter
      if (assetTypeFilter !== "all") {
        const assetType = getAssetTypeCategory(position.instrument)
        if (assetType !== assetTypeFilter) return false
      }

      return true
    })
  }

  // Helper function to get position performance based on time filter
  const getPositionPerformance = (position: any) => {
    // Use currentDayProfitLossPercentage as the primary metric
    return position.currentDayProfitLossPercentage || 0
  }

  // Helper function to categorize asset types
  const getAssetTypeCategory = (instrument: any) => {
    const assetType = instrument.assetType?.toLowerCase()
    const symbol = instrument.symbol?.toLowerCase() || ""

    if (assetType === "option") return "options"
    if (assetType === "equity") {
      // Simple heuristic for ETFs (usually 3-4 letters and common patterns)
      if (symbol.length <= 4 && (symbol.includes("spy") || symbol.includes("qqq") || symbol.includes("etf"))) {
        return "etfs"
      }
      return "stocks"
    }
    if (assetType === "mutual_fund") return "mutual_funds"
    if (assetType === "cash") return "cash"

    return "stocks" // Default fallback
  }

  // Filter positions based on search and global filters
  const filteredPositions = useMemo(() => {
    let positions = allPositions

    // Apply global filters first
    positions = applyGlobalFilters(positions)

    // Then apply search
    if (!searchQuery.trim()) return positions
    return searchTokenizedFuse(searchQuery, positions, fuseData, fuseKeys)
  }, [searchQuery, allPositions, fuseData, gainLossFilter, gainLossThreshold, positionSizeFilter, assetTypeFilter])

  // Create filtered login groups - always apply both global filters and search
  const filteredLoginGroups = useMemo(() => {
    return loginGroups
      .map((group) => ({
        ...group,
        accounts: group.accounts
          .map((account) => ({
            ...account,
            securitiesAccount: {
              ...account.securitiesAccount,
              positions: (account.securitiesAccount.positions || []).filter((position) =>
                filteredPositions.some(
                  (fp) =>
                    fp.instrument.symbol === position.instrument.symbol &&
                    fp.accountNumber === account.securitiesAccount.accountNumber,
                ),
              ),
            },
          }))
          .filter((account) => account.securitiesAccount.positions.length > 0),
      }))
      .filter((group) => group.accounts.length > 0)
  }, [loginGroups, filteredPositions])

  // Auto-expand all items when data loads for the first time
  useEffect(() => {
    if (filteredLoginGroups.length > 0 && expandedLogins.length === 0 && expandedAccounts.length === 0) {
      const loginValues = filteredLoginGroups.map((_, idx) => `login-${idx}`)
      const accountValues = filteredLoginGroups.flatMap((group, loginIdx) =>
        group.accounts.map((_, accIdx) => `account-${loginIdx}-${accIdx}`),
      )
      setExpandedLogins(loginValues)
      setExpandedAccounts(accountValues)
    }
  }, [filteredLoginGroups.length])

  const toggleExpandAll = () => {
    const isCurrentlyExpanded = expandedLogins.length > 0 || expandedAccounts.length > 0

    if (isCurrentlyExpanded) {
      setExpandedLogins([])
      setExpandedAccounts([])
      setExpandedAll(false)
    } else {
      const loginValues = filteredLoginGroups.map((_, idx) => `login-${idx}`)
      const accountValues = filteredLoginGroups.flatMap((group, loginIdx) =>
        group.accounts.map((_, accIdx) => `account-${loginIdx}-${accIdx}`),
      )
      setExpandedLogins(loginValues)
      setExpandedAccounts(accountValues)
      setExpandedAll(true)
    }
  }

  if (!hasAuthenticatedLogin) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">No Schwab accounts connected. Please connect a Schwab account first.</div>
      </div>
    )
  }

  if (accountsQuery.isLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">Loading accounts and positions...</div>
      </div>
    )
  }

  if (accountsQuery.error) {
    return (
      <div className="text-center py-8">
        <div className="text-destructive">Error: {accountsQuery.error.message}</div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold">📊 Schwab Accounts & Positions</h2>
          {accountsQuery.data?.metadata?.cached && (
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
              Cached data: {formatDateTime(accountsQuery.data.metadata.lastUpdated)}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => clearSchwabCacheMutation.mutate()}
            disabled={clearSchwabCacheMutation.isLoading}
            className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs rounded border border-blue-300 disabled:opacity-50"
          >
            {clearSchwabCacheMutation.isLoading ? "Refreshing..." : "🔄 Refresh Schwab"}
          </button>
          <button onClick={toggleExpandAll} className="px-2 py-1 bg-foregroundx  text-primary text-xs rounded border">
            {expandedLogins.length > 0 || expandedAccounts.length > 0 ? "Collapse All" : "Expand All"}
          </button>
          <div className="text-xs text-primary">
            {accounts.length} acc •{" "}
            {accounts.reduce((sum, acc) => sum + (acc.securitiesAccount.positions?.length || 0), 0)} pos
          </div>
        </div>
      </div>

      {/* Global Filters */}
      <div className="bg-foregroundx border border-border rounded p-3 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Gain/Loss Filter */}
          <div className="space-y-2">
            <div className="font-medium text-primary">Performance</div>
            <div className="flex space-x-1">
              <button
                onClick={() => setGainLossFilter("all")}
                className={`px-2 py-1 rounded border text-xs ${
                  gainLossFilter === "all"
                    ? "bg-blue-100 border-blue-300 text-blue-700"
                    : "bg-background border-gray-300 text-primary "
                }`}
              >
                All
              </button>
              <button
                onClick={() => setGainLossFilter("gainers")}
                className={`px-2 py-1 rounded border text-xs ${
                  gainLossFilter === "gainers"
                    ? "bg-green-100 border-green-300 text-green-700"
                    : "bg-background border-gray-300 text-primary "
                }`}
              >
                Gainers ↑
              </button>
              <button
                onClick={() => setGainLossFilter("losers")}
                className={`px-2 py-1 rounded border text-xs ${
                  gainLossFilter === "losers"
                    ? "bg-red-100 border-red-300 text-destructive"
                    : "bg-background border-gray-300 text-primary "
                }`}
              >
                Losers ↓
              </button>
            </div>
            {gainLossFilter !== "all" && (
              <div className="space-y-1">
                <label className="text-xs text-primary">Threshold: {gainLossThreshold}%</label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="1"
                  value={gainLossThreshold}
                  onChange={(e) => setGainLossThreshold(Number(e.target.value))}
                  className="w-full h-1 bg-foregroundx rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Position Size Filter */}
          <div className="space-y-2">
            <div className="font-medium text-primary">Position Size</div>
            <div className="flex flex-wrap gap-1">
              {[
                { key: "all", label: "All" },
                { key: "1k", label: "<$1k" },
                { key: "10k", label: ">$10k" },
                { key: "25k", label: ">$25k" },
                { key: "50k", label: ">$50k" },
              ].map((option) => (
                <button
                  key={option.key}
                  onClick={() => setPositionSizeFilter(option.key as any)}
                  className={`px-2 py-1 rounded border text-xs ${
                    positionSizeFilter === option.key
                      ? "bg-blue-100 border-blue-300 text-blue-700"
                      : "bg-background border-gray-300 text-primary "
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Asset Type Filter */}
          <div className="space-y-2">
            <div className="font-medium text-primary">Asset Type</div>
            <div className="flex flex-wrap gap-1">
              {[
                { key: "all", label: "All" },
                { key: "stocks", label: "Stocks" },
                { key: "etfs", label: "ETFs" },
                { key: "options", label: "Options" },
                { key: "mutual_funds", label: "Mutual Funds" },
                { key: "cash", label: "Cash" },
              ].map((option) => (
                <button
                  key={option.key}
                  onClick={() => setAssetTypeFilter(option.key as any)}
                  className={`px-2 py-1 rounded border text-xs ${
                    assetTypeFilter === option.key
                      ? "bg-blue-100 border-blue-300 text-blue-700"
                      : "bg-background border-gray-300 text-primary "
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active Filters Summary */}
        <div className="flex items-center space-x-2 text-xs text-primary">
          <span>Active filters:</span>
          {gainLossFilter !== "all" && (
            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
              {gainLossFilter === "gainers" ? `Gainers >${gainLossThreshold}%` : `Losers <-${gainLossThreshold}%`}
            </span>
          )}
          {positionSizeFilter !== "all" && (
            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
              {positionSizeFilter === "1k" ? "<$1k" : `>$${positionSizeFilter}`}
            </span>
          )}
          {assetTypeFilter !== "all" && (
            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded capitalize">
              {assetTypeFilter.replace("_", " ")}
            </span>
          )}
          {(gainLossFilter !== "all" || positionSizeFilter !== "all" || assetTypeFilter !== "all") && (
            <button
              onClick={() => {
                setGainLossFilter("all")
                setGainLossThreshold(0)
                setPositionSizeFilter("all")
                setAssetTypeFilter("all")
              }}
              className="px-1.5 py-0.5 bg-foregroundx  text-primary rounded"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Search Bar and View Toggle */}
      <div className="flex items-center justify-between space-x-4 mb-4">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search symbols, descriptions, accounts..."
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
          {searchQuery && (
            <div className="text-xs text-primary">
              {filteredPositions.length} match{filteredPositions.length !== 1 ? "es" : ""}
            </div>
          )}
        </div>

        {/* View Toggle */}
        <div className="flex border border-gray-300 rounded overflow-hidden">
          <button
            onClick={() => setViewMode("hierarchy")}
            className={`px-3 py-1.5 text-xs font-medium ${
              viewMode === "hierarchy" ? "bg-blue-500 text-white" : "bg-background text-primary "
            }`}
          >
            📁 Hierarchy
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`px-3 py-1.5 text-xs font-medium border-l border-gray-300 ${
              viewMode === "table" ? "bg-blue-500 text-white" : "bg-background text-primary "
            }`}
          >
            📊 Table
          </button>
        </div>
      </div>

      {/* Content Views */}
      {filteredLoginGroups.length === 0 ? (
        <div className="text-center py-4">
          <div className="text-gray-500 text-sm">
            {searchQuery ? "No positions match your search." : "No connected Schwab logins found."}
          </div>
        </div>
      ) : viewMode === "table" ? (
        /* Table View - All positions in single table */
        <div className="mt-4 overflow-x-auto">
          <ReactTable
            columns={[
              {
                Header: "Account",
                accessor: "accountInfo",
                Cell: ({ row }: any) => {
                  const accountNumber = row.original.accountNumber
                  const nickname = getAccountNickname(accountNumber)
                  const loginName = row.original.loginName
                  return (
                    <div className="text-xs w-24 min-w-[96px]">
                      <div className="font-medium text-blue-600 truncate">{loginName}</div>
                      <div className="font-medium truncate">{accountNumber}</div>
                      {nickname && <div className="text-gray-500 italic truncate">{nickname}</div>}
                    </div>
                  )
                },
              },
              {
                Header: "Symbol",
                accessor: "customSymbol", // Use computed property for sorting
                Cell: ({ row }: any) => {
                  const instrument = row.original.instrument
                  const isOption = instrument.assetType === "OPTION"
                  const optionDetails = parseOptionDetails(instrument)

                  if (isOption && optionDetails) {
                    return (
                      <div className="text-xs w-44 min-w-[176px]">
                        <div className="font-semibold text-purple-600 cursor-help truncate" title={optionDetails.raw}>
                          {optionDetails.formatted}
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div className="text-xs w-16 min-w-[64px]">
                      <div className="font-semibold text-blue-600">{instrument.symbol}</div>
                    </div>
                  )
                },
              },
              {
                Header: "Qty",
                accessor: "quantity",
                Cell: ({ row }: any) => {
                  const position = row.original
                  const isShort = position.shortQuantity > 0
                  const quantity = isShort ? -position.shortQuantity : position.longQuantity
                  return (
                    <div className="text-xs text-center w-12 min-w-[48px]">
                      <div className="font-semibold">
                        {quantity > 0 ? "+" : ""}
                        {formatQuantity(Math.abs(quantity))}
                      </div>
                      <div className={`text-xs ${isShort ? "text-destructive" : "text-green-500"}`}>
                        {isShort ? "S" : "L"}
                      </div>
                    </div>
                  )
                },
              },
              {
                Header: "Market Value",
                accessor: "marketValue",
                Cell: ({ getValue }: any) => (
                  <div className="text-xs text-right font-mono font-semibold w-20 min-w-[80px]">
                    {formatCurrency(getValue())}
                  </div>
                ),
              },
              {
                Header: "Day P&L",
                accessor: "currentDayProfitLoss",
                Cell: ({ row }: any) => {
                  const { currentDayProfitLoss, currentDayProfitLossPercentage } = row.original
                  const isPositive = currentDayProfitLoss >= 0
                  return (
                    <div className="text-xs text-right w-20 min-w-[80px]">
                      <div className={`font-semibold ${isPositive ? "text-green-600" : "text-destructive"}`}>
                        {formatCurrency(currentDayProfitLoss)}
                      </div>
                      <div className={`text-xs ${isPositive ? "text-green-500" : "text-destructive"}`}>
                        {formatPercent(currentDayProfitLossPercentage)}
                      </div>
                    </div>
                  )
                },
              },
              {
                Header: "Unrealized P&L",
                accessor: "longOpenProfitLoss",
                Cell: ({ getValue }: any) => {
                  const value = getValue() || 0
                  const isPositive = value >= 0
                  return (
                    <div
                      className={`text-xs text-right font-semibold w-20 min-w-[80px] ${isPositive ? "text-green-600" : "text-destructive"}`}
                    >
                      {formatCurrency(value)}
                    </div>
                  )
                },
              },
            ]}
            data={filteredPositions}
            enableSorting={true}
            enablePagination={true}
            initialState={{
              sortBy: [{ id: "customSymbol", desc: false }], // Default sort by symbol alphabetically
            }}
            className="border border-border rounded w-full"
            headerCellClassName="text-xs font-medium text-gray-500 uppercase tracking-wide bg-foregroundx py-2 px-2"
            cellClassName="text-xs py-2 px-1"
            emptyState={<div className="text-center py-8 text-gray-500">No positions found</div>}
          />
        </div>
      ) : (
        /* Hierarchy View - Existing accordion structure */
        <Accordion type="multiple" value={expandedLogins} onValueChange={setExpandedLogins} className="space-y-2">
          {filteredLoginGroups.map((group, loginIndex) => {
            const totalValue = group.accounts.reduce(
              (sum, acc) => sum + acc.securitiesAccount.currentBalances.liquidationValue,
              0,
            )
            const totalPositions = group.accounts.reduce(
              (sum, acc) => sum + (acc.securitiesAccount.positions?.length || 0),
              0,
            )
            const totalDayPL = group.accounts.reduce(
              (sum, acc) =>
                sum +
                (acc.securitiesAccount.positions?.reduce((pSum, pos) => pSum + (pos.currentDayProfitLoss || 0), 0) ||
                  0),
              0,
            )

            return (
              <AccordionItem
                key={group.login.id}
                value={`login-${loginIndex}`}
                className="border border-border rounded bg-background"
              >
                <AccordionTrigger className="px-4 py-2 hover:no-underline">
                  <div className="flex items-center justify-between w-full mr-4">
                    <div className="flex items-center space-x-2">
                      <div className="text-sm font-semibold ">🏦 {group.login.name}</div>
                      <div className="flex items-center space-x-1">
                        <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded">Connected</span>
                        {group.login.isSelected && (
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">Selected</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{formatCurrency(totalValue)}</div>
                      <div className="text-xs text-primary">
                        {group.accounts.length} account{group.accounts.length !== 1 ? "s" : ""} • {totalPositions}{" "}
                        positions
                      </div>
                      <div className={`text-xs font-medium ${totalDayPL >= 0 ? "text-green-600" : "text-destructive"}`}>
                        Day P&L: {formatCurrency(totalDayPL)}
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-2">
                  <Accordion
                    type="multiple"
                    value={expandedAccounts}
                    onValueChange={setExpandedAccounts}
                    className="space-y-1"
                  >
                    {group.accounts.map((account, accountIndex) => {
                      const securitiesAccount = account.securitiesAccount
                      const positions = securitiesAccount.positions || []
                      const currentBalances = securitiesAccount.currentBalances

                      const accountDayPL = positions.reduce((sum, pos) => sum + (pos.currentDayProfitLoss || 0), 0)
                      const accountUnrealizedPL = positions.reduce((sum, pos) => sum + (pos.longOpenProfitLoss || 0), 0)

                      return (
                        <AccordionItem
                          key={securitiesAccount.accountNumber}
                          value={`account-${loginIndex}-${accountIndex}`}
                          className="border border-gray-100 rounded"
                        >
                          <AccordionTrigger className="px-3 py-1.5 hover:no-underline">
                            <div className="flex items-center justify-between w-full mr-4">
                              <div className="flex items-center space-x-2">
                                <div className="flex items-center space-x-2">
                                  <div className="text-sm font-semibold ">
                                    {getAccountNickname(securitiesAccount.accountNumber)
                                      ? getAccountNickname(securitiesAccount.accountNumber)
                                      : `${securitiesAccount.type} - ${securitiesAccount.accountNumber}`}
                                  </div>
                                  {/* Edit Pen */}
                                  <div className="relative">
                                    {editingAccount?.accountNumber === securitiesAccount.accountNumber ? (
                                      <div className="flex items-center space-x-1">
                                        <input
                                          type="text"
                                          value={nicknameInput}
                                          onChange={(e) => setNicknameInput(e.target.value)}
                                          placeholder="Enter nickname"
                                          className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                          style={{ width: "120px" }}
                                          autoFocus
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") handleSaveNickname()
                                            if (e.key === "Escape") handleCancelEdit()
                                          }}
                                        />
                                        <button
                                          onClick={handleSaveNickname}
                                          disabled={setAccountNicknameMutation.isLoading}
                                          className="px-1.5 py-1 bg-green-100 hover:bg-green-200 text-green-700 text-xs rounded disabled:opacity-50"
                                        >
                                          ✓
                                        </button>
                                        <button
                                          onClick={handleCancelEdit}
                                          className="px-1.5 py-1 bg-foregroundx  text-primary text-xs rounded"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleEditClick(
                                            group.login.id,
                                            securitiesAccount.accountNumber,
                                            getAccountNickname(securitiesAccount.accountNumber),
                                          )
                                        }}
                                        className="p-1 text-gray-400 hover:text-primary text-xs"
                                        title="Edit account nickname"
                                      >
                                        ✏️
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <div className="text-xs text-gray-500">{positions.length} pos</div>
                                {getAccountNickname(securitiesAccount.accountNumber) && (
                                  <div className="text-xs text-gray-400">
                                    ({securitiesAccount.type} - {securitiesAccount.accountNumber})
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-semibold">
                                  {formatCurrency(currentBalances.liquidationValue)}
                                </div>
                                <div
                                  className={`text-xs font-medium ${accountDayPL >= 0 ? "text-green-600" : "text-destructive"}`}
                                >
                                  {formatCurrency(accountDayPL)}
                                </div>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-3 pb-2">
                            {/* Account Summary Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 mb-2">
                              <div className="bg-blue-50 p-1.5 rounded text-center">
                                <div className="text-xs font-medium text-blue-800">Buying Power</div>
                                <div className="text-xs font-semibold">
                                  {formatCurrency(currentBalances.buyingPower)}
                                </div>
                              </div>
                              <div className="bg-green-50 p-1.5 rounded text-center">
                                <div className="text-xs font-medium text-green-800">Cash</div>
                                <div className="text-xs font-semibold">
                                  {formatCurrency(currentBalances.cashBalance)}
                                </div>
                              </div>
                              <div
                                className={`p-1.5 rounded text-center ${accountDayPL >= 0 ? "bg-green-50" : "bg-red-50"}`}
                              >
                                <div
                                  className={`text-xs font-medium ${accountDayPL >= 0 ? "text-green-800" : "text-destructive"}`}
                                >
                                  Day P&L
                                </div>
                                <div
                                  className={`text-xs font-semibold ${accountDayPL >= 0 ? "text-green-600" : "text-destructive"}`}
                                >
                                  {formatCurrency(accountDayPL)}
                                </div>
                              </div>
                              <div
                                className={`p-1.5 rounded text-center ${accountUnrealizedPL >= 0 ? "bg-green-50" : "bg-red-50"}`}
                              >
                                <div
                                  className={`text-xs font-medium ${accountUnrealizedPL >= 0 ? "text-green-800" : "text-destructive"}`}
                                >
                                  Unrealized P&L
                                </div>
                                <div
                                  className={`text-xs font-semibold ${accountUnrealizedPL >= 0 ? "text-green-600" : "text-destructive"}`}
                                >
                                  {formatCurrency(accountUnrealizedPL)}
                                </div>
                              </div>
                            </div>

                            {/* Positions Table */}
                            {positions.length === 0 ? (
                              <div className="text-center py-2 text-gray-500 text-xs">No positions in this account</div>
                            ) : (
                              <ReactTable
                                columns={positionsColumns}
                                data={positions}
                                enableSorting={true}
                                enablePagination={false}
                                initialState={{
                                  sortBy: [{ id: "customSymbol", desc: false }], // Default sort by symbol alphabetically
                                }}
                                className="border border-border rounded"
                                headerCellClassName="text-xs font-medium text-gray-500 uppercase tracking-wide bg-foregroundx py-1 px-2"
                                cellClassName="text-xs py-1 px-2"
                                emptyState={
                                  <div className="text-center py-2 text-gray-500 text-xs">No positions found</div>
                                }
                              />
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      )
                    })}
                  </Accordion>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      )}
    </div>
  )
}
