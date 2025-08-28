import { Badge } from "@shray/ui"
import { ReactTable } from "@shray/ui"
import useLocalStorage from "@shray/ui/src/hooks/useLocalStorage"
import { useMemo, useState } from "react"
import toast from "react-hot-toast"

import { trpc } from "../../lib/trpc"

interface OptionsTabProps {
  watchlistQuery: any
  formatCurrency: (value: number) => string
  formatPercent: (value: number) => string
  formatDate: (timestamp: number) => string
}

export default function OptionsTab({ watchlistQuery, formatCurrency, formatPercent, formatDate }: OptionsTabProps) {
  // Option type selection (calls vs puts)
  const [optionType, setOptionType] = useLocalStorage<"calls" | "puts">("options-type-selection", "puts")

  // Multi-symbol selection state (moved from OptionsTradingScreen)
  const [selectedSymbols, setSelectedSymbols] = useLocalStorage<string[]>("options-symbols", ["TSLA", "NVDA", "AAPL"])

  // Global filters with localStorage persistence
  const [deltaStart, setDeltaStart] = useLocalStorage<number>("options-delta-start", optionType === "puts" ? -0.3 : 0.1)
  const [deltaEnd, setDeltaEnd] = useLocalStorage<number>("options-delta-end", optionType === "puts" ? -0.1 : 0.3)
  const selectedExpiration = "" // No expiration filter - show all dates

  // Create dynamic queries for up to 15 symbols (enough for most use cases)
  const symbol0 = selectedSymbols[0] || ""
  const symbol1 = selectedSymbols[1] || ""
  const symbol2 = selectedSymbols[2] || ""
  const symbol3 = selectedSymbols[3] || ""
  const symbol4 = selectedSymbols[4] || ""
  const symbol5 = selectedSymbols[5] || ""
  const symbol6 = selectedSymbols[6] || ""
  const symbol7 = selectedSymbols[7] || ""
  const symbol8 = selectedSymbols[8] || ""
  const symbol9 = selectedSymbols[9] || ""
  const symbol10 = selectedSymbols[10] || ""
  const symbol11 = selectedSymbols[11] || ""
  const symbol12 = selectedSymbols[12] || ""
  const symbol13 = selectedSymbols[13] || ""
  const symbol14 = selectedSymbols[14] || ""

  // Dynamic queries based on option type
  const query0 =
    optionType === "puts"
      ? trpc.options.options.allPuts.useQuery(
          { symbol: symbol0, expiration: selectedExpiration || undefined },
          { enabled: !!symbol0 },
        )
      : trpc.options.options.allCalls.useQuery(
          { symbol: symbol0, expiration: selectedExpiration || undefined },
          { enabled: !!symbol0 },
        )

  const query1 =
    optionType === "puts"
      ? trpc.options.options.allPuts.useQuery(
          { symbol: symbol1, expiration: selectedExpiration || undefined },
          { enabled: !!symbol1 },
        )
      : trpc.options.options.allCalls.useQuery(
          { symbol: symbol1, expiration: selectedExpiration || undefined },
          { enabled: !!symbol1 },
        )

  const query2 =
    optionType === "puts"
      ? trpc.options.options.allPuts.useQuery(
          { symbol: symbol2, expiration: selectedExpiration || undefined },
          { enabled: !!symbol2 },
        )
      : trpc.options.options.allCalls.useQuery(
          { symbol: symbol2, expiration: selectedExpiration || undefined },
          { enabled: !!symbol2 },
        )

  const query3 =
    optionType === "puts"
      ? trpc.options.options.allPuts.useQuery(
          { symbol: symbol3, expiration: selectedExpiration || undefined },
          { enabled: !!symbol3 },
        )
      : trpc.options.options.allCalls.useQuery(
          { symbol: symbol3, expiration: selectedExpiration || undefined },
          { enabled: !!symbol3 },
        )

  const query4 =
    optionType === "puts"
      ? trpc.options.options.allPuts.useQuery(
          { symbol: symbol4, expiration: selectedExpiration || undefined },
          { enabled: !!symbol4 },
        )
      : trpc.options.options.allCalls.useQuery(
          { symbol: symbol4, expiration: selectedExpiration || undefined },
          { enabled: !!symbol4 },
        )

  const query5 =
    optionType === "puts"
      ? trpc.options.options.allPuts.useQuery(
          { symbol: symbol5, expiration: selectedExpiration || undefined },
          { enabled: !!symbol5 },
        )
      : trpc.options.options.allCalls.useQuery(
          { symbol: symbol5, expiration: selectedExpiration || undefined },
          { enabled: !!symbol5 },
        )

  const query6 =
    optionType === "puts"
      ? trpc.options.options.allPuts.useQuery(
          { symbol: symbol6, expiration: selectedExpiration || undefined },
          { enabled: !!symbol6 },
        )
      : trpc.options.options.allCalls.useQuery(
          { symbol: symbol6, expiration: selectedExpiration || undefined },
          { enabled: !!symbol6 },
        )

  const query7 =
    optionType === "puts"
      ? trpc.options.options.allPuts.useQuery(
          { symbol: symbol7, expiration: selectedExpiration || undefined },
          { enabled: !!symbol7 },
        )
      : trpc.options.options.allCalls.useQuery(
          { symbol: symbol7, expiration: selectedExpiration || undefined },
          { enabled: !!symbol7 },
        )

  const query8 =
    optionType === "puts"
      ? trpc.options.options.allPuts.useQuery(
          { symbol: symbol8, expiration: selectedExpiration || undefined },
          { enabled: !!symbol8 },
        )
      : trpc.options.options.allCalls.useQuery(
          { symbol: symbol8, expiration: selectedExpiration || undefined },
          { enabled: !!symbol8 },
        )

  const query9 =
    optionType === "puts"
      ? trpc.options.options.allPuts.useQuery(
          { symbol: symbol9, expiration: selectedExpiration || undefined },
          { enabled: !!symbol9 },
        )
      : trpc.options.options.allCalls.useQuery(
          { symbol: symbol9, expiration: selectedExpiration || undefined },
          { enabled: !!symbol9 },
        )

  const query10 =
    optionType === "puts"
      ? trpc.options.options.allPuts.useQuery(
          { symbol: symbol10, expiration: selectedExpiration || undefined },
          { enabled: !!symbol10 },
        )
      : trpc.options.options.allCalls.useQuery(
          { symbol: symbol10, expiration: selectedExpiration || undefined },
          { enabled: !!symbol10 },
        )

  const query11 =
    optionType === "puts"
      ? trpc.options.options.allPuts.useQuery(
          { symbol: symbol11, expiration: selectedExpiration || undefined },
          { enabled: !!symbol11 },
        )
      : trpc.options.options.allCalls.useQuery(
          { symbol: symbol11, expiration: selectedExpiration || undefined },
          { enabled: !!symbol11 },
        )

  const query12 =
    optionType === "puts"
      ? trpc.options.options.allPuts.useQuery(
          { symbol: symbol12, expiration: selectedExpiration || undefined },
          { enabled: !!symbol12 },
        )
      : trpc.options.options.allCalls.useQuery(
          { symbol: symbol12, expiration: selectedExpiration || undefined },
          { enabled: !!symbol12 },
        )

  const query13 =
    optionType === "puts"
      ? trpc.options.options.allPuts.useQuery(
          { symbol: symbol13, expiration: selectedExpiration || undefined },
          { enabled: !!symbol13 },
        )
      : trpc.options.options.allCalls.useQuery(
          { symbol: symbol13, expiration: selectedExpiration || undefined },
          { enabled: !!symbol13 },
        )

  const query14 =
    optionType === "puts"
      ? trpc.options.options.allPuts.useQuery(
          { symbol: symbol14, expiration: selectedExpiration || undefined },
          { enabled: !!symbol14 },
        )
      : trpc.options.options.allCalls.useQuery(
          { symbol: symbol14, expiration: selectedExpiration || undefined },
          { enabled: !!symbol14 },
        )

  // Combine queries into array for easier processing
  const optionsQueries = [
    { query: query0, symbol: symbol0 },
    { query: query1, symbol: symbol1 },
    { query: query2, symbol: symbol2 },
    { query: query3, symbol: symbol3 },
    { query: query4, symbol: symbol4 },
    { query: query5, symbol: symbol5 },
    { query: query6, symbol: symbol6 },
    { query: query7, symbol: symbol7 },
    { query: query8, symbol: symbol8 },
    { query: query9, symbol: symbol9 },
    { query: query10, symbol: symbol10 },
    { query: query11, symbol: symbol11 },
    { query: query12, symbol: symbol12 },
    { query: query13, symbol: symbol13 },
    { query: query14, symbol: symbol14 },
  ].filter(({ symbol }) => symbol)

  // Advanced filters with localStorage persistence
  const [showAdvancedFilters, setShowAdvancedFilters] = useLocalStorage<boolean>("options-show-advanced", false)
  const [volumeFilter, setVolumeFilter] = useLocalStorage<number>("options-volume-filter", 0)
  const [openInterestFilter, setOpenInterestFilter] = useLocalStorage<number>("options-oi-filter", 0)
  const [maxSpreadFilter, setMaxSpreadFilter] = useLocalStorage<number>("options-spread-filter", 0)
  const [minDaysFilter, setMinDaysFilter] = useLocalStorage<number>("options-min-days", 0)
  const [maxDaysFilter, setMaxDaysFilter] = useLocalStorage<number>("options-max-days", 45)
  const [minIVFilter, setMinIVFilter] = useLocalStorage<number>("options-min-iv", 0)
  const [maxIVFilter, setMaxIVFilter] = useLocalStorage<number>("options-max-iv", 200)
  const [moneynessFilter, setMoneynessFilter] = useLocalStorage<string>("options-moneyness", "all") // "all", "otm", "itm", "atm"
  const [minReturnFilter, setMinReturnFilter] = useLocalStorage<number>("options-min-return", 0)

  // Autocomplete input state (moved from OptionsTradingScreen)
  const [inputValue, setInputValue] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Get available symbols from watchlist query for autocomplete
  const availableSymbols = watchlistQuery.data?.symbols || []

  // Filter suggestions based on input and exclude already selected tickers
  // Only show autocomplete for watchlist symbols, but allow manual entry of any ticker
  const filteredSuggestions = availableSymbols.filter(
    (symbol: string) =>
      symbol.toLowerCase().includes(inputValue.toLowerCase()) &&
      !selectedSymbols.includes(symbol) &&
      inputValue.length > 0,
  )

  // Symbol management functions (moved from OptionsTradingScreen)
  const removeTicker = (tickerToRemove: string) => {
    setSelectedSymbols(selectedSymbols.filter((ticker) => ticker !== tickerToRemove))
    toast.success(`${tickerToRemove} removed from ${optionType} analysis`)
  }

  const addTicker = (ticker: string) => {
    const upperTicker = ticker.toUpperCase().trim()

    // Validate ticker format (at least 2-4 characters, letters only)
    if (upperTicker.length < 2 || upperTicker.length > 5) {
      toast.error("Ticker symbol must be 2-5 characters long")
      return
    }

    if (!/^[A-Z]+$/.test(upperTicker)) {
      toast.error("Ticker symbol must contain only letters")
      return
    }

    if (selectedSymbols.includes(upperTicker)) {
      toast.error(`${upperTicker} is already in the ${optionType} analysis`)
      return
    }

    if (selectedSymbols.length >= 15) {
      toast.error("Maximum 15 symbols allowed")
      return
    }

    // Add the ticker (whether it's in watchlist or not)
    setSelectedSymbols([...selectedSymbols, upperTicker])
    setInputValue("")
    setShowSuggestions(false)

    if (availableSymbols.includes(upperTicker)) {
      toast.success(`${upperTicker} added to ${optionType} analysis`)
    } else {
      toast.success(`${upperTicker} added to ${optionType} analysis (not in watchlist - data may be limited)`)
    }
  }

  // Handle input change
  const handleInputChange = (value: string) => {
    setInputValue(value)
    setShowSuggestions(value.length > 0)
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    addTicker(suggestion)
  }

  // Handle input key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (filteredSuggestions.length > 0) {
        addTicker(filteredSuggestions[0])
      } else if (inputValue.trim()) {
        addTicker(inputValue.trim())
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false)
      setInputValue("")
    }
  }

  // Combine all options data from all symbols into single dataset
  const allOptionsData = useMemo(() => {
    const allOptions: any[] = []
    const dataKey = optionType === "puts" ? "puts" : "calls"

    optionsQueries.forEach(({ query, symbol }) => {
      if (query.data?.data?.[dataKey]) {
        const stockPrice = query.data.data.stockPrice
        const symbolOptions = query.data.data[dataKey].map((option: any) => {
          const mid = option.bid && option.ask ? (option.bid + option.ask) / 2 : 0
          const premiumPercent = option.strike > 0 ? (mid / option.strike) * 100 : 0
          return {
            ...option,
            symbol,
            stockPrice,
            premiumPercent, // Add computed field for sorting
            optionType, // Add option type for clarity
          }
        })
        allOptions.push(...symbolOptions)
      }
    })

    return allOptions
  }, [optionsQueries, selectedSymbols, optionType])

  // Apply comprehensive filtering to combined dataset
  const filteredOptions = useMemo(() => {
    return allOptionsData.filter((option: any) => {
      // Delta range filter - always enabled now
      if (option.delta === undefined || option.delta === null) return true // Include options without delta data

      const deltaInRange = option.delta >= deltaStart && option.delta <= deltaEnd
      if (!deltaInRange) return false

      // Volume filter
      if (volumeFilter > 0 && (option.volume || 0) < volumeFilter) return false

      // Open Interest filter
      if (openInterestFilter > 0 && (option.openInterest || 0) < openInterestFilter) return false

      // Bid-Ask Spread filter
      if (maxSpreadFilter > 0 && option.bid && option.ask) {
        const spread = option.ask - option.bid
        if (spread > maxSpreadFilter) return false
      }

      // Days to expiration filter
      if (option.daysToExpiration) {
        if (option.daysToExpiration < minDaysFilter || option.daysToExpiration > maxDaysFilter) return false
      }

      // IV filter (convert percentage to decimal for comparison)
      if (option.impliedVolatility) {
        const ivPercent = option.impliedVolatility * 100
        if (ivPercent < minIVFilter || ivPercent > maxIVFilter) return false
      }

      // Moneyness filter (adjusted for calls vs puts)
      if (moneynessFilter !== "all" && option.stockPrice > 0) {
        let isITM, isOTM
        if (optionType === "puts") {
          isITM = option.strike >= option.stockPrice
          isOTM = option.strike < option.stockPrice
        } else {
          isITM = option.strike <= option.stockPrice
          isOTM = option.strike > option.stockPrice
        }
        const distanceFromStock = Math.abs((option.stockPrice - option.strike) / option.stockPrice) * 100
        const isATM = distanceFromStock <= 2

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

      // Minimum annualized return filter (only applicable for puts)
      if (
        optionType === "puts" &&
        minReturnFilter > 0 &&
        option.stockPrice > 0 &&
        option.bid &&
        option.ask &&
        option.daysToExpiration
      ) {
        const premium = (option.bid + option.ask) / 2
        const otmAmount = Math.max(0, option.stockPrice - option.strike)
        const margin1 = (0.2 * option.stockPrice - otmAmount + premium) * 100
        const margin2 = 0.1 * option.strike * 100
        const marginRequired = Math.max(margin1, margin2)
        const cashRequired = marginRequired - premium * 100

        if (cashRequired > 0) {
          const returnOnMargin = ((premium * 100) / cashRequired) * 100
          const annualizedReturn = returnOnMargin * (365 / option.daysToExpiration)
          if (annualizedReturn < minReturnFilter) return false
        }
      }

      return true
    })
  }, [
    allOptionsData,
    deltaStart,
    deltaEnd,
    optionType,
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

  // Define columns for unified table
  const columns = useMemo(
    () => [
      {
        Header: "Symbol",
        accessor: "symbol",
        Cell: ({ getValue }: any) => <div className="text-xs font-semibold text-blue-600">{getValue()}</div>,
      },
      {
        Header: "Stock Price",
        accessor: "stockPrice",
        Cell: ({ getValue }: any) => (
          <div className="text-xs font-mono font-medium">{formatCurrency(getValue() || 0)}</div>
        ),
      },
      {
        Header: "Strike",
        accessor: "strike",
        Cell: ({ getValue }: any) => <div className="text-xs font-mono font-medium">{formatCurrency(getValue())}</div>,
      },
      {
        Header: "Status",
        accessor: "inTheMoney",
        Cell: ({ row }: any) => {
          const { inTheMoney, strike, stockPrice, optionType } = row.original
          const distance = stockPrice > 0 ? ((stockPrice - strike) / stockPrice) * 100 : 0

          // Color coding: ITM = red (risky), OTM = green (safer for selling)
          const colorClass = inTheMoney ? "bg-red-100 text-destructive" : "bg-green-100 text-green-800"

          // Calculate percentage to display for OTM options
          let percentageToShow = null
          if (!inTheMoney && stockPrice > 0) {
            if (optionType === "puts") {
              // For puts: show how far above the strike the stock is
              percentageToShow = distance > 0 ? distance : null
            } else {
              // For calls: show how far below the strike the stock is (absolute value)
              percentageToShow = distance < 0 ? Math.abs(distance) : null
            }
          }

          return (
            <div className="text-xs text-center">
              <span className={`px-1 py-0.5 rounded text-xs font-medium ${colorClass}`}>
                {inTheMoney ? "ITM" : "OTM"}
              </span>
              {percentageToShow && <div className="text-gray-500 mt-0.5">{percentageToShow.toFixed(1)}%</div>}
            </div>
          )
        },
      },
      {
        Header: "Bid/Ask",
        accessor: "premiumPercent", // Sort by premiumPercent field we added
        minWidth: 120,
        width: 120,
        Cell: ({ row }: any) => {
          const { bid, ask, premiumPercent } = row.original
          const mid = (bid + ask) / 2
          return (
            <div className="text-xs text-center" style={{ minWidth: 120 }}>
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
              Δ:{delta?.toFixed(3) || "N/A"}
              {/* Γ:{gamma?.toFixed(4) || "N/A"} Θ:{theta?.toFixed(3) || "N/A"} ν: {vega?.toFixed(3) || "N/A"} */}
            </div>
          )
        },
      },
      {
        Header: "Expiration Date",
        accessor: "daysToExpiration",
        Cell: ({ row }: any) => {
          const { daysToExpiration, expirationDate } = row.original
          const expDate = new Date(expirationDate)
          const formattedDate = expDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
          return (
            <div className="text-xs text-center font-mono">
              <div className="font-medium">{formattedDate}</div>
              <div className="text-gray-500">({daysToExpiration || "N/A"}d)</div>
            </div>
          )
        },
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
        Header: optionType === "puts" ? "Margin" : "Break Even",
        accessor: "analysis",
        Cell: ({ row }: any) => {
          const option = row.original
          const { stockPrice } = option

          if (!stockPrice || !option.bid || !option.ask) {
            return <div className="text-xs text-gray-500">N/A</div>
          }

          const premium = (option.bid + option.ask) / 2

          if (optionType === "puts") {
            // Put selling margin analysis
            const otmAmount = Math.max(0, stockPrice - option.strike)
            const margin1 = (0.2 * stockPrice - otmAmount + premium) * 100
            const margin2 = 0.1 * option.strike * 100
            const marginRequired = Math.max(margin1, margin2)
            const cashRequired = marginRequired - premium * 100
            const returnOnMargin = cashRequired > 0 ? ((premium * 100) / cashRequired) * 100 : 0

            if (option.daysToExpiration > 0) {
              const annualizedReturn = returnOnMargin * (365 / option.daysToExpiration)

              return (
                <div className="text-xs font-mono text-primary">
                  <span title="Margin Required: Total margin needed to sell this put">
                    M:${marginRequired.toFixed(0)}
                  </span>{" "}
                  {/* <span title="Cash Required: Net cash needed (margin minus premium received)">C:${cashRequired.toFixed(0)}</span>{" "} */}
                  {/* <span title="Return on Margin: Premium collected as % of cash required">R:{returnOnMargin.toFixed(1)}%</span>{" "} */}
                  {/* <span title="Annualized Return: Return on margin projected annually">A:{annualizedReturn.toFixed(1)}%</span> */}
                </div>
              )
            }
          } else {
            // Call break-even analysis
            const breakEven = option.strike + premium
            const breakEvenPercent = stockPrice > 0 ? ((breakEven - stockPrice) / stockPrice) * 100 : 0
            const toBreakEven = breakEven - stockPrice

            return (
              <div className="text-xs font-mono text-primary">
                BE:${breakEven.toFixed(2)} ({breakEvenPercent >= 0 ? "+" : ""}
                {breakEvenPercent.toFixed(1)}%)
                <div className="text-gray-500">Need: ${toBreakEven.toFixed(2)}</div>
              </div>
            )
          }

          return <div className="text-xs text-gray-500">Expired</div>
        },
      },
      {
        Header: "JSON",
        accessor: "actions",
        Cell: ({ row }: any) => {
          const option = row.original
          return (
            <div className="relative group">
              <button
                className="px-1 py-0.5 bg-blue-100 text-blue-800 rounded text-xs hover:bg-blue-200 transition-colors"
                title="View complete data (hover to preview, click to copy)"
                onClick={(e) => {
                  e.preventDefault()
                  const jsonData = JSON.stringify(
                    {
                      ...option,
                      expirationDate: new Date(option.expirationDate).toISOString(),
                      lastTradeDate: option.lastTradeDate ? new Date(option.lastTradeDate).toISOString() : undefined,
                    },
                    null,
                    2,
                  )
                  navigator.clipboard.writeText(jsonData)
                  toast.success(`${option.symbol} ${optionType.slice(0, -1)} data copied to clipboard!`)
                }}
              >
                📋
              </button>
              <div className="absolute right-0 top-full mt-1 w-96 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 max-h-64 overflow-auto">
                <div className="font-semibold mb-2 text-blue-300">
                  Complete {optionType.charAt(0).toUpperCase() + optionType.slice(1)} Data (click button to copy):
                </div>
                <pre className="whitespace-pre-wrap break-words">
                  {JSON.stringify(
                    {
                      ...option,
                      expirationDate: new Date(option.expirationDate).toISOString(),
                      lastTradeDate: option.lastTradeDate ? new Date(option.lastTradeDate).toISOString() : undefined,
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
    [formatCurrency, formatPercent, formatDate],
  )

  // Check if any queries are loading
  const isLoading = optionsQueries.some(({ query }) => query.isLoading)
  const hasError = optionsQueries.some(({ query }) => query.error)
  const totalOptionsCount = optionsQueries.reduce((sum, { query }) => {
    const dataKey = optionType === "puts" ? "totalPuts" : "totalCalls"
    return sum + (query.data?.data?.[dataKey] || 0)
  }, 0)

  // Get all available expiration dates from all symbols
  const availableExpirations = useMemo(() => {
    const allExpirations = new Set<number>()

    optionsQueries.forEach(({ query }) => {
      if (query.data?.data?.expirations) {
        query.data.data.expirations.forEach((exp: number) => allExpirations.add(exp))
      }
    })

    // Convert to array and sort by date
    return Array.from(allExpirations).sort((a, b) => a - b)
  }, [optionsQueries])

  // Update delta range when option type changes
  const handleOptionTypeChange = (newType: "calls" | "puts") => {
    setOptionType(newType)
    // Set appropriate default delta range for option type
    if (newType === "puts") {
      setDeltaStart(-0.3)
      setDeltaEnd(-0.1)
    } else {
      setDeltaStart(0.1)
      setDeltaEnd(0.3)
    }
  }

  return (
    <div className="space-y-4">
      {/* Symbol Management & Global Filters */}
      <div className="bg-background border border-border rounded-lg p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {optionType === "puts" ? "📉" : "📈"} Multi-Symbol{" "}
              {optionType.charAt(0).toUpperCase() + optionType.slice(1)} Analysis
            </h2>

            {/* Calls/Puts Toggle */}
            <div className="flex items-center space-x-1 bg-foregroundx rounded-lg p-1">
              <button
                onClick={() => handleOptionTypeChange("puts")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  optionType === "puts" ? "bg-background  shadow-sm" : "text-primary hover:"
                }`}
              >
                📉 Puts
              </button>
              <button
                onClick={() => handleOptionTypeChange("calls")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  optionType === "calls" ? "bg-background  shadow-sm" : "text-primary hover:"
                }`}
              >
                📈 Calls
              </button>
            </div>
          </div>

          {/* Symbol Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-primary">Selected Symbols:</span>

              {/* Add Symbol Input */}
              <div className="relative">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    id="symbolInput"
                    aria-label="Add symbol to analysis"
                    value={inputValue}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={handleKeyPress}
                    onFocus={() => setShowSuggestions(inputValue.length > 0)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Add any ticker..."
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-24"
                  />
                  {inputValue && (
                    <button
                      onClick={() => addTicker(inputValue)}
                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Add
                    </button>
                  )}
                </div>

                {/* Autocomplete Suggestions */}
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-40 overflow-y-auto">
                    {filteredSuggestions.slice(0, 8).map((suggestion: string) => (
                      <button
                        key={suggestion}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full px-3 py-2 text-sm text-left  transition-colors first:rounded-t-md last:rounded-b-md"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Symbol Badges */}
              {selectedSymbols.map((symbol) => {
                const isInWatchlist = availableSymbols.includes(symbol)
                return (
                  <Badge
                    key={symbol}
                    variant="secondary"
                    className={`flex items-center gap-1 pr-1 ${
                      isInWatchlist ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                    }`}
                    title={isInWatchlist ? "In watchlist" : "Not in watchlist - options data may be limited"}
                  >
                    {symbol}
                    {!isInWatchlist && <span className="text-xs">⚠️</span>}
                    <button
                      onClick={() => removeTicker(symbol)}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5 transition-colors"
                      aria-label={`Remove ${symbol} from analysis`}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </Badge>
                )
              })}
            </div>

            {/* Help Text */}
            <div className="text-xs text-gray-500 mt-1">
              💡 You can add any ticker (2-5 characters). Green badges = in watchlist, Yellow badges = not in watchlist
              (limited data).
            </div>
          </div>

          {/* Global Filters */}
          <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-border">
            <span className="text-sm font-medium text-primary">Global Filters:</span>

            {/* Delta Range Filter */}
            <div className="flex items-center space-x-3">
              <label className="text-sm font-medium">Delta Range:</label>

              {/* Start Value */}
              <div className="flex items-center space-x-1">
                <span className="text-xs text-gray-500">From:</span>
                <button
                  onClick={() => setDeltaStart(Math.round((deltaStart - 0.05) * 100) / 100)}
                  className="px-1 py-0.5 text-xs bg-foregroundx  rounded border"
                  title="Decrease start by 0.05"
                >
                  −
                </button>
                <div className="text-xs font-mono bg-blue-50 px-2 py-1 rounded border min-w-[3rem] text-center">
                  {deltaStart.toFixed(2)}
                </div>
                <button
                  onClick={() => setDeltaStart(Math.round((deltaStart + 0.05) * 100) / 100)}
                  className="px-1 py-0.5 text-xs bg-foregroundx  rounded border"
                  title="Increase start by 0.05"
                >
                  +
                </button>
              </div>

              {/* End Value */}
              <div className="flex items-center space-x-1">
                <span className="text-xs text-gray-500">To:</span>
                <button
                  onClick={() => setDeltaEnd(Math.round((deltaEnd - 0.05) * 100) / 100)}
                  className="px-1 py-0.5 text-xs bg-foregroundx  rounded border"
                  title="Decrease end by 0.05"
                >
                  −
                </button>
                <div className="text-xs font-mono bg-blue-50 px-2 py-1 rounded border min-w-[3rem] text-center">
                  {deltaEnd.toFixed(2)}
                </div>
                <button
                  onClick={() => setDeltaEnd(Math.round((deltaEnd + 0.05) * 100) / 100)}
                  className="px-1 py-0.5 text-xs bg-foregroundx  rounded border"
                  title="Increase end by 0.05"
                >
                  +
                </button>
              </div>
            </div>

            {/* Advanced Filters Toggle */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                  showAdvancedFilters
                    ? "bg-blue-100 border-blue-300 text-blue-800"
                    : "bg-foregroundx border-gray-300 text-primary "
                }`}
              >
                {showAdvancedFilters ? "📊 Hide Advanced" : "⚙️ Advanced Filters"}
              </button>
            </div>
          </div>

          {/* Advanced Filters Dropdown */}
          {showAdvancedFilters && (
            <div className="mt-4 p-4 bg-foregroundx border border-border rounded-lg space-y-4">
              <div className="text-sm font-semibold text-primary mb-3">Advanced Filtering Options</div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Volume Filter */}
                <div className="space-y-1">
                  <label htmlFor="volumeFilter" className="text-xs font-medium text-primary">
                    Min Volume
                  </label>
                  <input
                    type="number"
                    id="volumeFilter"
                    value={volumeFilter}
                    onChange={(e) => setVolumeFilter(Number(e.target.value))}
                    placeholder="0"
                    min="0"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Open Interest Filter */}
                <div className="space-y-1">
                  <label htmlFor="openInterestFilter" className="text-xs font-medium text-primary">
                    Min Open Interest
                  </label>
                  <input
                    type="number"
                    id="openInterestFilter"
                    value={openInterestFilter}
                    onChange={(e) => setOpenInterestFilter(Number(e.target.value))}
                    placeholder="0"
                    min="0"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Max Bid-Ask Spread */}
                <div className="space-y-1">
                  <label htmlFor="maxSpreadFilter" className="text-xs font-medium text-primary">
                    Max Bid-Ask Spread ($)
                  </label>
                  <input
                    type="number"
                    id="maxSpreadFilter"
                    value={maxSpreadFilter}
                    onChange={(e) => setMaxSpreadFilter(Number(e.target.value))}
                    placeholder="0 (no limit)"
                    min="0"
                    step="0.05"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Days to Expiration Range */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-primary">Days to Expiration</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      aria-label="Minimum days to expiration"
                      value={minDaysFilter}
                      onChange={(e) => setMinDaysFilter(Number(e.target.value))}
                      placeholder="1"
                      min="1"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-500">to</span>
                    <input
                      type="number"
                      aria-label="Maximum days to expiration"
                      value={maxDaysFilter}
                      onChange={(e) => setMaxDaysFilter(Number(e.target.value))}
                      placeholder="45"
                      min="1"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* IV Range */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-primary">IV Range (%)</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      aria-label="Minimum implied volatility percentage"
                      value={minIVFilter}
                      onChange={(e) => setMinIVFilter(Number(e.target.value))}
                      placeholder="0"
                      min="0"
                      step="5"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-500">to</span>
                    <input
                      type="number"
                      aria-label="Maximum implied volatility percentage"
                      value={maxIVFilter}
                      onChange={(e) => setMaxIVFilter(Number(e.target.value))}
                      placeholder="200"
                      min="0"
                      step="5"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Moneyness Filter */}
                <div className="space-y-1">
                  <label htmlFor="moneynessFilter" className="text-xs font-medium text-primary">
                    Moneyness
                  </label>
                  <select
                    id="moneynessFilter"
                    value={moneynessFilter}
                    onChange={(e) => setMoneynessFilter(e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All Options</option>
                    <option value="otm">OTM Only</option>
                    <option value="itm">ITM Only</option>
                    <option value="atm">Near ATM (±2%)</option>
                  </select>
                </div>

                {/* Min Annualized Return */}
                <div className="space-y-1">
                  <label htmlFor="minReturnFilter" className="text-xs font-medium text-primary">
                    Min Annualized Return (%)
                  </label>
                  <input
                    type="number"
                    id="minReturnFilter"
                    value={minReturnFilter}
                    onChange={(e) => setMinReturnFilter(Number(e.target.value))}
                    placeholder="0"
                    min="0"
                    step="1"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="text-xs text-primary">Filters are applied to all symbol sections below</div>
                <div className="space-x-2">
                  <button
                    onClick={() => {
                      setVolumeFilter(0)
                      setOpenInterestFilter(0)
                      setMaxSpreadFilter(0)
                      setMinDaysFilter(1)
                      setMaxDaysFilter(45)
                      setMinIVFilter(0)
                      setMaxIVFilter(200)
                      setMoneynessFilter("all")
                      setMinReturnFilter(0)
                      toast.success("Advanced filters cleared")
                    }}
                    className="px-3 py-1 text-xs bg-foregroundx text-primary rounded hover:bg-gray-300 transition-colors"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => {
                      if (optionType === "puts") {
                        // Set conservative put selling filters
                        setVolumeFilter(50)
                        setOpenInterestFilter(100)
                        setMaxSpreadFilter(0.25)
                        setMinDaysFilter(14)
                        setMaxDaysFilter(45)
                        setMoneynessFilter("otm")
                        setMinReturnFilter(10)
                        toast.success("Applied conservative put selling filters")
                      } else {
                        // Set conservative call buying filters
                        setVolumeFilter(100)
                        setOpenInterestFilter(200)
                        setMaxSpreadFilter(0.5)
                        setMinDaysFilter(7)
                        setMaxDaysFilter(30)
                        setMoneynessFilter("otm")
                        setMinReturnFilter(0)
                        toast.success("Applied conservative call buying filters")
                      }
                    }}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    {optionType === "puts" ? "Put Selling" : "Call Buying"} Preset
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Unified Options Table */}
      <div className="bg-background border border-border rounded-lg overflow-hidden">
        {selectedSymbols.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-primary">No symbols selected for {optionType} analysis.</p>
            <p className="text-sm text-gray-500 mt-1">Add symbols using the input above to get started.</p>
          </div>
        ) : (
          <div className="p-4">
            {/* Summary Stats */}
            <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-blue-50 p-3 rounded">
                <div className="font-semibold text-primary">Total Symbols</div>
                <div className="text-xl font-bold">{selectedSymbols.length}</div>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <div className="font-semibold text-primary">
                  Total {optionType.charAt(0).toUpperCase() + optionType.slice(1)}
                </div>
                <div className="text-xl font-bold">{totalOptionsCount}</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded">
                <div className="font-semibold text-primary">
                  Filtered {optionType.charAt(0).toUpperCase() + optionType.slice(1)}
                </div>
                <div className="text-xl font-bold">{filteredOptions.length}</div>
              </div>
              <div className="bg-purple-50 p-3 rounded">
                <div className="font-semibold text-primary">Status</div>
                <div className="text-sm">
                  {isLoading ? (
                    <span className="text-blue-600">Loading...</span>
                  ) : hasError ? (
                    <span className="text-destructive">Error</span>
                  ) : (
                    <span className="text-green-600">✓ Ready</span>
                  )}
                </div>
              </div>
            </div>

            {/* Unified Table */}
            <ReactTable
              columns={columns}
              data={filteredOptions}
              enableSorting={true}
              enablePagination={true}
              loading={isLoading}
              emptyState={
                <div className="text-center py-8 text-gray-500">
                  {isLoading
                    ? `Loading ${optionType} data...`
                    : hasError
                      ? `Error loading ${optionType} data`
                      : allOptionsData.length === 0
                        ? `No ${optionType} data available for selected symbols`
                        : `No ${optionType} match the current filters`}
                </div>
              }
              className="bg-background rounded border border-border"
              headerCellClassName="text-xs font-medium text-gray-500 uppercase tracking-wide bg-foregroundx py-2 px-3"
              cellClassName="text-xs py-2 px-3"
            />
          </div>
        )}
      </div>
    </div>
  )
}
