import { getRedisCache, setRedisCache } from "@shray/apiutils/src/redisBase"
import { reportErrorToSentry } from "@shray/apiutils/src/sentry"
import yahooFinance from "yahoo-finance2"

import { OptionsEnhancer } from "./greeksCalculator"
import { MarginSecuredPut, OptionData, OptionsChainData, PutSellingOpportunity, StockData, UnusualActivity } from "./types"

// Hardcoded watchlist as requested
export const WATCHLIST = [
  "SPY",
  "QQQ",
  "VTI",
  "USD",
  "TECL",
  "MAGS",
  "BAI",
  "ITA",
  "TMFC",
  "AVGO",
  "PANW",
  "AAPL",
  "MSFT",
  "NVDA",
  "TSLA",
  "AMZN",
  "META",
  "GOOGL",
  "GOOG",
  "AMD",
  "NFLX",
  "BABA",
  "BAC",
  "JPM",
  "WFC",
  "PLTR",
  "SOFI",
  "C",
  "F",
  "GM",
  "RIVN",
  "NIO",
  "LCID",
  "SHOP",
  "SNOW",
  "COIN",
  "PYPL",
  "SQ",
  "CRM",
  "INTC",
  "MU",
  "TSM",
  "T",
  "VZ",
  "XOM",
  "CVX",
  "PFE",
  "MRNA",
  "UNH",
  "MRK",
  "BA",
  "LLY",
  "ABBV",
  "COST",
  "WMT",
  "DIS",
  "UBER",
  "LYFT",
  "PANW",
  "ZM",
  "DKNG",
]

const CACHE_DURATION = 60 * 60 // 1 hour in seconds

// Initialize options enhancer with current risk-free rate (10-year Treasury ~4.8%)
const optionsEnhancer = new OptionsEnhancer(0.048)

/**
 * Fetch stock quotes for a list of symbols with caching
 */
export async function getStockQuotes(
  symbols: string[] = WATCHLIST,
  useCache: boolean = true,
): Promise<Map<string, StockData>> {
  const cacheKey = `options:quotes:${symbols.join(",")}`

  // Try to get from cache first
  if (useCache) {
    try {
      const cached = await getRedisCache(cacheKey)
      if (cached) {
        const stockMap = new Map<string, StockData>()
        Object.entries(cached).forEach(([symbol, data]) => {
          stockMap.set(symbol, data as StockData)
        })
        return stockMap
      }
    } catch (error) {
      console.warn("Redis cache miss for stock quotes:", error)
    }
  }

  const quotes = new Map<string, StockData>()

  try {
    // Fetch quotes for all symbols
    const results = await yahooFinance.quote(symbols)
    const timestamp = Date.now()

    if (Array.isArray(results)) {
      results.forEach((quote) => {
        if (quote.symbol) {
          quotes.set(quote.symbol, {
            symbol: quote.symbol,
            price: quote.regularMarketPrice || 0,
            change: quote.regularMarketChange || 0,
            changePercent: quote.regularMarketChangePercent || 0,
            volume: quote.regularMarketVolume || 0,
            marketCap: quote.marketCap,
            lastUpdated: timestamp,
          })
        }
      })
    } else if (results && typeof results === "object" && "symbol" in results) {
      // Single result case
      const quote = results as any
      quotes.set(quote.symbol, {
        symbol: quote.symbol,
        price: quote.regularMarketPrice || 0,
        change: quote.regularMarketChange || 0,
        changePercent: quote.regularMarketChangePercent || 0,
        volume: quote.regularMarketVolume || 0,
        marketCap: quote.marketCap,
        lastUpdated: timestamp,
      })
    }

    // Cache the results
    if (quotes.size > 0) {
      const cacheData = Object.fromEntries(quotes)
      await setRedisCache(cacheKey, cacheData, CACHE_DURATION)
    }
  } catch (error) {
    reportErrorToSentry(error, "getStockQuotes", { symbols })
    console.error("Error fetching quotes:", error)
  }

  return quotes
}

/**
 * Fetch options chain for a specific symbol with caching and Greeks calculation
 */
export async function getOptionsChain(
  symbol: string,
  expiration?: Date,
  useCache: boolean = true,
): Promise<OptionsChainData> {
  const expirationStr = expiration ? expiration.toISOString().split("T")[0] : "default"
  const cacheKey = `options:chain:${symbol}:${expirationStr}`

  // Try to get from cache first
  if (useCache) {
    try {
      const cached = await getRedisCache(cacheKey)
      if (cached) {
        return cached as OptionsChainData
      }
    } catch (error) {
      console.warn("Redis cache miss for options chain:", error)
    }
  }

  try {
    // console.log(`🔍 Fetching options for ${symbol}`, { expiration })

    // Get current stock price for Greeks calculation
    const stockQuotes = await getStockQuotes([symbol], false) // Don't use cache for real-time Greeks
    const currentPrice = stockQuotes.get(symbol)?.price || 0

    if (currentPrice === 0) {
      throw new Error(`Could not get current price for ${symbol}`)
    }

    // Call Yahoo Finance API - don't pass date parameter if undefined
    const optionsParams = expiration ? { date: expiration } : {}
    // console.log(`📊 Yahoo Finance options params:`, optionsParams)

    const options = await yahooFinance.options(symbol, optionsParams)
    // console.log(`✅ Raw Yahoo Finance response structure:`, {
    //   hasOptions: !!options.options,
    //   optionsLength: options.options?.length || 0,
    //   hasExpirationDates: !!options.expirationDates,
    //   expirationDatesLength: options.expirationDates?.length || 0,
    //   topLevelKeys: Object.keys(options),
    //   firstOptionKeys: options.options?.[0] ? Object.keys(options.options[0]) : [],
    // })

    const timestamp = Date.now()

    // Handle the case where options might be nested in an options array
    const optionsData = (options as any).options?.[0] || options
    const calls = (optionsData as any).calls || []
    const puts = (optionsData as any).puts || []
    const expirationDates = (options as any).expirationDates || []

    // console.log(`📈 Parsed options data:`, {
    //   callsLength: calls.length,
    //   putsLength: puts.length,
    //   expirationDatesLength: expirationDates.length,
    //   currentPrice,
    // })

    // Process calls with Greeks calculation
    const enhancedCalls = calls.map((call: any) => {
      const baseOption = {
        strike: call.strike,
        lastPrice: call.lastPrice || 0,
        bid: call.bid || 0,
        ask: call.ask || 0,
        volume: call.volume || 0,
        openInterest: call.openInterest || 0,
        impliedVolatility: call.impliedVolatility || 0.3,
        inTheMoney: call.inTheMoney || false,
        expirationDate: call.expiration ? call.expiration.getTime() : timestamp,

        // Additional pricing data
        intrinsicValue: call.intrinsicValue || undefined,
        timeValue: call.timeValue || undefined,
        percentChange: call.percentChange || undefined,
        change: call.change || undefined,

        // Contract details
        contractSymbol: call.contractSymbol || undefined,
        contractSize: call.contractSize || undefined,
        currency: call.currency || undefined,
        lastTradeDate: call.lastTradeDate ? call.lastTradeDate.getTime() : undefined,
      }

      // Calculate Greeks using Black-Scholes
      return optionsEnhancer.enhanceOption(baseOption, currentPrice, "call")
    })

    // Process puts with Greeks calculation
    const enhancedPuts = puts.map((put: any) => {
      const baseOption = {
        strike: put.strike,
        lastPrice: put.lastPrice || 0,
        bid: put.bid || 0,
        ask: put.ask || 0,
        volume: put.volume || 0,
        openInterest: put.openInterest || 0,
        impliedVolatility: put.impliedVolatility || 0.3,
        inTheMoney: put.inTheMoney || false,
        expirationDate: put.expiration ? put.expiration.getTime() : timestamp,

        // Additional pricing data
        intrinsicValue: put.intrinsicValue || undefined,
        timeValue: put.timeValue || undefined,
        percentChange: put.percentChange || undefined,
        change: put.change || undefined,

        // Contract details
        contractSymbol: put.contractSymbol || undefined,
        contractSize: put.contractSize || undefined,
        currency: put.currency || undefined,
        lastTradeDate: put.lastTradeDate ? put.lastTradeDate.getTime() : undefined,
      }

      // Calculate Greeks using Black-Scholes
      const enhancedOption = optionsEnhancer.enhanceOption(baseOption, currentPrice, "put")

      // Debug log for first few puts to see what's happening with Greeks
      // if (puts.indexOf(put) < 3) {
      //   console.log(`🧮 Enhanced put for ${symbol}:`, {
      //     strike: enhancedOption.strike,
      //     currentPrice,
      //     impliedVolatility: enhancedOption.impliedVolatility,
      //     daysToExpiration: enhancedOption.daysToExpiration,
      //     timeToExpiration: enhancedOption.timeToExpiration,
      //     delta: enhancedOption.delta,
      //     gamma: enhancedOption.gamma,
      //     theta: enhancedOption.theta,
      //     vega: enhancedOption.vega,
      //     rho: enhancedOption.rho,
      //   })
      // }

      return enhancedOption
    })

    const result: OptionsChainData = {
      symbol,
      calls: enhancedCalls,
      puts: enhancedPuts,
      expirations: expirationDates.map((date: Date) => date.getTime()),
      lastUpdated: timestamp,
    }

    // Cache the results
    await setRedisCache(cacheKey, result, CACHE_DURATION)

    return result
  } catch (error) {
    console.error(`❌ Error fetching options for ${symbol}:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      symbol,
      expiration,
    })
    reportErrorToSentry(error, "getOptionsChain", { symbol, expiration })
    return {
      symbol,
      calls: [],
      puts: [],
      expirations: [],
      lastUpdated: Date.now(),
    }
  }
}

/**
 * Get top movers from the watchlist
 */
export async function getTopMovers(limit: number = 5): Promise<StockData[]> {
  const quotes = await getStockQuotes()
  const sortedQuotes = Array.from(quotes.values()).sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))

  return sortedQuotes.slice(0, limit)
}

/**
 * Find unusual options activity for a symbol
 */
export async function findUnusualOptionsActivity(symbol: string): Promise<UnusualActivity[]> {
  try {
    const optionsChain = await getOptionsChain(symbol)
    const { calls, puts } = optionsChain

    const unusualActivity: UnusualActivity[] = []

    // Process calls
    calls.forEach((option) => {
      const volumeOIRatio = option.openInterest > 0 ? option.volume / option.openInterest : 0

      if (option.volume > 100 && volumeOIRatio > 0.5) {
        unusualActivity.push({
          symbol,
          optionType: "call",
          strike: option.strike,
          expirationDate: option.expirationDate,
          volume: option.volume,
          openInterest: option.openInterest,
          volumeOIRatio,
          lastPrice: option.lastPrice,
          impliedVolatility: option.impliedVolatility,
        })
      }
    })

    // Process puts
    puts.forEach((option) => {
      const volumeOIRatio = option.openInterest > 0 ? option.volume / option.openInterest : 0

      if (option.volume > 100 && volumeOIRatio > 0.5) {
        unusualActivity.push({
          symbol,
          optionType: "put",
          strike: option.strike,
          expirationDate: option.expirationDate,
          volume: option.volume,
          openInterest: option.openInterest,
          volumeOIRatio,
          lastPrice: option.lastPrice,
          impliedVolatility: option.impliedVolatility,
        })
      }
    })

    return unusualActivity.sort((a, b) => b.volume - a.volume)
  } catch (error) {
    reportErrorToSentry(error, "findUnusualOptionsActivity", { symbol })
    console.error(`Error finding unusual activity for ${symbol}:`, error)
    return []
  }
}

/**
 * Find good put selling opportunities (focus on puts as requested)
 */
export async function findPutSellingOpportunities(
  symbol: string,
  maxDaysToExpiration: number = 45,
): Promise<PutSellingOpportunity[]> {
  try {
    const [stockQuotes, optionsChain] = await Promise.all([getStockQuotes([symbol]), getOptionsChain(symbol)])

    const stockData = stockQuotes.get(symbol)
    if (!stockData) {
      throw new Error(`No stock data found for ${symbol}`)
    }

    const currentPrice = stockData.price
    const opportunities: PutSellingOpportunity[] = []

    optionsChain.puts.forEach((put) => {
      const daysToExpiration = put.daysToExpiration

      // Filter for reasonable expiration dates
      if (daysToExpiration < 7 || daysToExpiration > maxDaysToExpiration) {
        return
      }

      // Filter for out-of-the-money puts (below current price)
      if (put.strike >= currentPrice) {
        return
      }

      // Calculate metrics
      const distanceFromStrike = ((currentPrice - put.strike) / currentPrice) * 100
      const premium = (put.bid + put.ask) / 2 // Use mid price
      const annualizedReturn = (premium / put.strike) * (365 / daysToExpiration) * 100

      // Rough probability estimate (simplified)
      const probabilityOTM = Math.max(50, 100 - distanceFromStrike * 2)

      // Only include if there's decent premium and liquidity
      if (premium > 0.1 && put.volume > 10 && put.openInterest > 50) {
        opportunities.push({
          symbol,
          strike: put.strike,
          expirationDate: put.expirationDate,
          premium,
          impliedVolatility: put.impliedVolatility,
          distanceFromStrike,
          annualizedReturn,
          probabilityOTM,
          delta: put.delta,
          daysToExpiration: put.daysToExpiration,
          volume: put.volume,
          openInterest: put.openInterest,
          bid: put.bid,
          ask: put.ask,
        })
      }
    })

    // Sort by annualized return descending
    return opportunities.sort((a, b) => b.annualizedReturn - a.annualizedReturn)
  } catch (error) {
    reportErrorToSentry(error, "findPutSellingOpportunities", { symbol })
    console.error(`Error finding put opportunities for ${symbol}:`, error)
    return []
  }
}

/**
 * Scan for margin-secured put opportunities across multiple symbols
 */
export async function scanMarginSecuredPuts(
  symbols: string[] = WATCHLIST,
  targetDelta: number = 0.2,
  maxDaysToExpiration: number = 45,
): Promise<MarginSecuredPut[]> {
  const results: MarginSecuredPut[] = []

  for (const symbol of symbols) {
    try {
      const [stockQuotes, optionsChain] = await Promise.all([
        getStockQuotes([symbol], false), // Use fresh data for Greeks
        getOptionsChain(symbol),
      ])

      const stockData = stockQuotes.get(symbol)
      if (!stockData) {
        console.warn(`No stock data found for ${symbol}`)
        continue
      }

      const currentPrice = stockData.price

      // Process each put option
      for (const put of optionsChain.puts) {
        const daysToExpiration = put.daysToExpiration

        // Filter for reasonable expiration dates
        if (daysToExpiration < 7 || daysToExpiration > maxDaysToExpiration) {
          continue
        }

        // Check if delta is near our target (puts have negative delta)
        if (Math.abs(Math.abs(put.delta) - targetDelta) > 0.05) {
          continue
        }

        // Use mid price for premium
        const premium = (put.bid + put.ask) / 2

        // Skip if no real market or insufficient liquidity
        if (premium === 0 || !put.bid || !put.ask || put.volume < 10 || put.openInterest < 50) {
          continue
        }

        // Calculate margin requirements
        const { MarginCalculator } = await import("./greeksCalculator")
        const marginCalc = MarginCalculator.calculatePutMargin(currentPrice, put.strike, premium)

        // Calculate returns
        const premiumYield = (premium / currentPrice) * 100
        const annualizedReturn = marginCalc.returnOnMargin * (365 / daysToExpiration)

        // Only include if margin required is reasonable
        if (marginCalc.cashRequired > 0) {
          results.push({
            symbol,
            currentPrice,
            strike: put.strike,
            premium,
            delta: put.delta,
            daysToExpiration,
            impliedVolatility: put.impliedVolatility,
            marginRequired: marginCalc.cashRequired,
            returnOnMargin: marginCalc.returnOnMargin,
            premiumYield,
            annualizedReturn,
            volume: put.volume,
            openInterest: put.openInterest,
            bid: put.bid,
            ask: put.ask,
            gamma: put.gamma,
            theta: put.theta,
            vega: put.vega,
            rho: put.rho,
          })
        }
      }
    } catch (error) {
      reportErrorToSentry(error, "scanMarginSecuredPuts", { symbol })
      console.error(`Error processing ${symbol}:`, error)
    }
  }

  // Sort by annualized return on margin
  return results.sort((a, b) => b.annualizedReturn - a.annualizedReturn)
}

/**
 * Find best margin-secured put opportunities by different criteria
 */
export async function analyzeMarginPutStrategies(
  symbols: string[] = WATCHLIST,
  targetDelta: number = 0.2,
): Promise<{
  bestROM: MarginSecuredPut[]
  safestPlays: MarginSecuredPut[]
  weeklyPlays: MarginSecuredPut[]
  highIV: MarginSecuredPut[]
  targetDelta: MarginSecuredPut[]
}> {
  const allPuts = await scanMarginSecuredPuts(symbols, targetDelta)

  // Highest return on margin
  const bestROM = allPuts.slice(0, 10)

  // Safest plays (furthest OTM with decent premium)
  const safestPlays = allPuts
    .filter((p) => p.strike / p.currentPrice < 0.95) // 5%+ OTM
    .filter((p) => p.premiumYield > 0.5) // Still decent yield
    .slice(0, 10)

  // Weekly income (7-14 days)
  const weeklyPlays = allPuts.filter((p) => p.daysToExpiration >= 7 && p.daysToExpiration <= 14).slice(0, 10)

  // High IV plays
  const highIV = allPuts.filter((p) => p.impliedVolatility > 0.4).slice(0, 10)

  // Target delta plays
  const targetDeltaPlays = allPuts.filter((p) => Math.abs(Math.abs(p.delta) - targetDelta) <= 0.02).slice(0, 10)

  return {
    bestROM,
    safestPlays,
    weeklyPlays,
    highIV,
    targetDelta: targetDeltaPlays,
  }
}

/**
 * Clear cache for fresh data
 */
export async function clearOptionsCache(): Promise<void> {
  // This is a simplified version - in a real implementation you'd want to track all cache keys
  // For now, we'll just clear the main watchlist cache
  try {
    const cacheKey = `options:quotes:${WATCHLIST.join(",")}`
    await setRedisCache(cacheKey, null, 1) // Set to expire immediately
  } catch (error) {
    reportErrorToSentry(error, "clearOptionsCache")
    console.error("Error clearing options cache:", error)
  }
}
