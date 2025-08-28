import { axiosGet, axiosPost } from "@shray/apiutils/src/axios"
import { blg } from "@shray/apiutils/src/logging"
import { getRedisCache, setRedisCache } from "@shray/apiutils/src/redisBase"
import { z } from "zod"

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../lib/trpc"

// Schwab API Base URLs
const SCHWAB_AUTH_BASE_URL = "https://api.schwabapi.com/v1"
const SCHWAB_API_BASE_URL = "https://api.schwabapi.com/trader/v1"

// OAuth2 Token Response Schema
const tokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
  scope: z.string(),
})

// Schwab Account Type Definitions
interface SchwabBalances {
  accruedInterest: number
  availableFunds?: number
  availableFundsNonMarginableTrade: number
  bondValue: number
  buyingPower: number
  buyingPowerNonMarginableTrade?: number
  cashBalance: number
  cashAvailableForTrading: number
  cashReceipts: number
  dayTradingBuyingPower: number
  dayTradingBuyingPowerCall: number
  dayTradingEquityCall: number
  equity: number
  equityPercentage: number
  liquidationValue: number
  longMarginValue: number
  longOptionMarketValue: number
  longStockValue: number
  longMarketValue?: number
  maintenanceCall: number
  maintenanceRequirement: number
  margin: number
  marginBalance: number
  marginEquity: number
  moneyMarketFund: number
  mutualFundValue: number
  regTCall: number
  shortMarginValue: number
  shortOptionMarketValue: number
  shortStockValue: number
  shortMarketValue?: number
  shortBalance: number
  totalCash: number
  isInCall: boolean
  pendingDeposits: number
  accountValue: number
  savings?: number
  sma?: number
  stockBuyingPower?: number
}

interface SchwabProjectedBalances {
  availableFunds: number
  availableFundsNonMarginableTrade: number
  buyingPower: number
  dayTradingBuyingPower: number
  dayTradingBuyingPowerCall: number
  maintenanceCall: number
  regTCall: number
  isInCall: boolean
  stockBuyingPower: number
}

interface SchwabSecuritiesAccount {
  type: string
  accountNumber: string
  roundTrips: number
  isDayTrader: boolean
  isClosingOnlyRestricted: boolean
  pfcbFlag: boolean
  initialBalances: SchwabBalances
  currentBalances: SchwabBalances
  projectedBalances: SchwabProjectedBalances
  positions?: SchwabPosition[]
}

interface SchwabAggregatedBalance {
  currentLiquidationValue: number
  liquidationValue: number
}

interface SchwabAccount {
  securitiesAccount: SchwabSecuritiesAccount
  aggregatedBalance: SchwabAggregatedBalance
}

interface SchwabAccountsResponse {
  accounts: SchwabAccount[]
  metadata: {
    totalAccounts: number
    lastUpdated: number
    loginId?: string
    cached?: boolean
  }
}

// Position Types
interface SchwabInstrument {
  assetType: string
  cusip: string
  symbol: string
  description?: string
  instrumentType?: string
  netChange?: number
  type?: string
}

interface SchwabPosition {
  shortQuantity: number
  averagePrice: number
  currentDayProfitLoss: number
  currentDayProfitLossPercentage: number
  longQuantity: number
  settledLongQuantity: number
  settledShortQuantity: number
  instrument: SchwabInstrument
  marketValue: number
  maintenanceRequirement?: number
  averageLongCost?: number
  taxLotAverageLongCost?: number
  longOpenProfitLoss?: number
  previousSessionLongQuantity?: number
  currentDayCost?: number
}

interface SchwabPositionsResponse {
  securitiesAccount?: {
    type: string
    accountNumber: string
    positions: SchwabPosition[]
  }
}

// Helper function to get user's login list
async function getUserSchwabLoginList(userId: string): Promise<string[]> {
  try {
    const loginsData = await getRedisCache(`schwab_logins_${userId}`)
    return loginsData ? JSON.parse(loginsData) : []
  } catch (error: any) {
    blg.error("Error getting user login list:", { userId, error: error.message })
    return []
  }
}

// Helper function to update user's login list
async function updateUserSchwabLoginList(userId: string, loginIds: string[]) {
  try {
    await setRedisCache(`schwab_logins_${userId}`, JSON.stringify(loginIds), 86400 * 30) // 30 days
    blg.info("Updated user login list", { userId, loginCount: loginIds.length })
  } catch (error: any) {
    blg.error("Error updating user login list:", { userId, error: error.message })
    throw error
  }
}

// Helper function to get selected login ID
async function getSelectedSchwabLogin(userId: string): Promise<string | null> {
  try {
    return await getRedisCache(`schwab_selected_login_${userId}`)
  } catch (error: any) {
    blg.error("Error getting selected login:", { userId, error: error.message })
    return null
  }
}

// Helper function to set selected login ID
async function setSelectedSchwabLogin(userId: string, loginId: string) {
  try {
    await setRedisCache(`schwab_selected_login_${userId}`, loginId, 86400 * 30) // 30 days
    blg.info("Set selected login", { userId, loginId })
  } catch (error: any) {
    blg.error("Error setting selected login:", { userId, loginId, error: error.message })
    throw error
  }
}

// Helper function to store login info
async function storeLoginInfo(userId: string, loginId: string, info: { name: string; createdAt: number }) {
  try {
    await setRedisCache(`schwab_login_info_${userId}_${loginId}`, JSON.stringify(info), 86400 * 30) // 30 days
    blg.info("Stored login info", { userId, loginId, name: info.name })
  } catch (error: any) {
    blg.error("Error storing login info:", { userId, loginId, error: error.message })
    throw error
  }
}

// Helper function to get login info
async function getSchwabLoginInfo(userId: string, loginId: string) {
  try {
    const infoData = await getRedisCache(`schwab_login_info_${userId}_${loginId}`)
    return infoData ? JSON.parse(infoData) : null
  } catch (error: any) {
    blg.error("Error getting login info:", { userId, loginId, error: error.message })
    return null
  }
}

// Helper function to get stored tokens from Redis (updated for multi-login)
async function getStoredTokens(userId: string, loginId?: string) {
  try {
    // If no loginId provided, use selected login
    if (!loginId) {
      loginId = await getSelectedSchwabLogin(userId)
      if (!loginId) {
        blg.info("No selected login found", { userId })
        return null
      }
    }

    blg.info("Getting stored tokens from Redis", { userId, loginId })
    const tokens = await getRedisCache(`schwab_tokens_${userId}_${loginId}`)
    const result = tokens ? JSON.parse(tokens) : null
    blg.info("Retrieved tokens from Redis", {
      userId,
      loginId,
      hasTokens: !!result,
      hasAccessToken: !!result?.access_token,
      hasRefreshToken: !!result?.refresh_token,
      expiresAt: result?.expires_at,
    })
    return result
  } catch (error: any) {
    blg.error("Error getting stored tokens:", { userId, loginId, error: error.message })
    console.error("Error getting stored tokens:", error)
    return null
  }
}

// Helper function to store tokens in Redis (updated for multi-login)
async function storeTokens(tokens: any, userId: string, loginId: string, loginName?: string) {
  try {
    blg.info("Storing tokens in Redis", {
      userId,
      loginId,
      loginName,
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiresIn: tokens.expires_in,
    })

    const tokenData = {
      ...tokens,
      expires_at: Date.now() + tokens.expires_in * 1000,
    }

    // Store tokens for 7 days (refresh token lifetime), not just access token lifetime
    const sevenDaysInSeconds = 7 * 24 * 60 * 60
    await setRedisCache(`schwab_tokens_${userId}_${loginId}`, JSON.stringify(tokenData), sevenDaysInSeconds)

    // Update login list
    const logins = await getUserSchwabLoginList(userId)
    if (!logins.includes(loginId)) {
      logins.push(loginId)
      await updateUserSchwabLoginList(userId, logins)
    }

    // Store login info
    if (loginName) {
      await storeLoginInfo(userId, loginId, {
        name: loginName,
        createdAt: Date.now(),
      })
    }

    // Set as selected if it's the first login
    const selectedLogin = await getSelectedSchwabLogin(userId)
    if (!selectedLogin) {
      await setSelectedSchwabLogin(userId, loginId)
    }

    blg.info("Successfully stored tokens in Redis", {
      userId,
      loginId,
      expiresAt: tokenData.expires_at,
      cacheExpiry: tokens.expires_in,
    })
    return tokenData
  } catch (error: any) {
    blg.error("Error storing tokens:", { userId, loginId, error: error.message })
    console.error("Error storing tokens:", error)
    throw error
  }
}

// Helper function to refresh access token
async function refreshAccessToken(refreshToken: string, appKey: string, appSecret: string) {
  try {
    blg.info("Starting token refresh", { hasRefreshToken: !!refreshToken })

    const tokenResponse = await axiosPost<any>(
      `${SCHWAB_AUTH_BASE_URL}/oauth/token`,
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
      {
        Authorization: `Basic ${Buffer.from(`${appKey}:${appSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      "schwab-refresh-token",
      { timeout: 30000 },
    )

    blg.info("Token refresh successful", {
      hasResponse: !!tokenResponse,
      responseKeys: tokenResponse ? Object.keys(tokenResponse) : [],
    })

    return tokenResponseSchema.parse(tokenResponse)
  } catch (error: any) {
    blg.error("Error refreshing token", { error: error.message })
    console.error("Error refreshing token:", error)
    throw error
  }
}

// Helper function to get valid access token (refresh if needed)
async function getValidAccessToken(userId: string, loginId?: string) {
  const storedTokens = await getStoredTokens(userId, loginId)

  if (!storedTokens) {
    return null
  }

  // Check if token is expired (with 5 minute buffer)
  const isExpired = Date.now() > storedTokens.expires_at - 300000 // 5 minutes buffer

  if (!isExpired) {
    return storedTokens.access_token
  }

  // Token is expired, try to refresh
  if (!storedTokens.refresh_token) {
    return null
  }

  try {
    const appKey = process.env.SCHWAB_APP_KEY
    const appSecret = process.env.SCHWAB_APP_SECRET

    if (!appKey || !appSecret) {
      throw new Error("Schwab app credentials not configured")
    }

    // Get the actual loginId if not provided
    const actualLoginId = loginId || (await getSelectedSchwabLogin(userId))
    if (!actualLoginId) {
      throw new Error("No login selected")
    }

    const newTokens = await refreshAccessToken(storedTokens.refresh_token, appKey, appSecret)
    const updatedTokens = await storeTokens(newTokens, userId, actualLoginId)

    return updatedTokens.access_token
  } catch (error: any) {
    console.error("Token refresh failed:", error)
    return null
  }
}

// Helper function to make authenticated Schwab API calls
async function makeSchwabApiCall<T>(endpoint: string, userId: string, loginId?: string): Promise<T> {
  const accessToken = await getValidAccessToken(userId, loginId)

  if (!accessToken) {
    throw new Error("No valid access token available. Please re-authenticate.")
  }

  // Get the actual loginId if not provided
  const actualLoginId = loginId || (await getSelectedSchwabLogin(userId))
  if (!actualLoginId) {
    throw new Error("No login selected")
  }

  try {
    const response = await axiosGet<T>(
      `${SCHWAB_API_BASE_URL}${endpoint}`,
      {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      `schwab-api-${endpoint.replace(/\//g, "-")}`,
      { timeout: 30000 },
    )

    return response
  } catch (error: any) {
    if (error.response?.status === 401) {
      // Token might be invalid, clear stored tokens for this specific login
      try {
        await setRedisCache(`schwab_tokens_${userId}_${actualLoginId}`, "", 1) // Delete by setting short expiry
      } catch (clearError: any) {
        console.error("Error clearing invalid tokens:", clearError)
      }
      throw new Error("Authentication expired. Please re-authenticate.")
    }
    console.error(`Schwab API call error for ${endpoint}:`, error)
    throw error
  }
}

export const schwabRouter = createTRPCRouter({
  // Debug endpoint to get curl commands for API testing
  getDebugCurlCommands: protectedProcedure
    .input(
      z.object({
        accountNumber: z.string(),
        loginId: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      try {
        const { accountNumber, loginId } = input
        const userId = ctx.user.id

        // Get fresh access token
        const accessToken = await getValidAccessToken(userId, loginId)
        if (!accessToken) {
          throw new Error("No valid access token available")
        }

        // Get account numbers with encrypted hashes
        const actualLoginId = loginId || (await getSelectedSchwabLogin(userId))
        const accountNumbersData = await makeSchwabApiCall<Array<{
          accountNumber: string;
          hashValue: string;
        }>>("/accounts/accountNumbers", userId, actualLoginId)

        // Find the hash value for the current account number
        const accountHashData = accountNumbersData?.find(acc => acc.accountNumber === accountNumber)
        const accountHash = accountHashData?.hashValue || "{ENCRYPTED_HASH_NOT_FOUND}"

        const baseUrl = "https://api.schwabapi.com/trader/v1"

        // Default date range (last 30 days, within 60 day limit)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const fromDate = thirtyDaysAgo.toISOString()
        const toDate = new Date().toISOString()

        // Generate curl commands for each endpoint
        const curlCommands = {
          accounts: `curl -X GET "${baseUrl}/accounts?fields=positions" \\
  -H "Authorization: Bearer ${accessToken}" \\
  -H "Accept: application/json"`,

          accountNumbers: `curl -X GET "${baseUrl}/accounts/accountNumbers" \\
  -H "Authorization: Bearer ${accessToken}" \\
  -H "Accept: application/json"`,

          orders: `curl -X GET "${baseUrl}/orders?fromEnteredTime=${fromDate}&toEnteredTime=${toDate}&maxResults=100" \\
  -H "Authorization: Bearer ${accessToken}" \\
  -H "Accept: application/json"`,

          transactions: `curl -X GET "${baseUrl}/accounts/${accountHash}/transactions?startDate=${fromDate}&endDate=${toDate}" \\
  -H "Authorization: Bearer ${accessToken}" \\
  -H "Accept: application/json"

  # Account: ${accountNumber} → Hash: ${accountHash}`,
        }

        return {
          accountNumber,
          accountHash,
          accessToken: accessToken.substring(0, 20) + "...", // Truncated for display
          curlCommands,
          fullAccessToken: accessToken, // For actual use
        }
      } catch (error: any) {
        throw new Error(`Failed to generate curl commands: ${error.message}`)
      }
    }),

  // Debug endpoint to check account ID mapping
  debugAccountId: protectedProcedure.input(z.object({ accountId: z.string() })).query(async ({ input, ctx }) => {
    try {
      const { accountId } = input

      // Get accounts to find the real account number
      const accountsData = await makeSchwabApiCall<SchwabAccount[]>("/accounts?fields=positions", ctx.user.id)
      const realAccountNumbers = accountsData?.map((acc) => acc.securitiesAccount?.accountNumber).filter(Boolean) || []

      const isLoginId = accountId.startsWith("schwab_")
      const isValidAccountNumber = realAccountNumbers.includes(accountId)

      return {
        providedAccountId: accountId,
        isLoginId,
        isValidAccountNumber,
        realAccountNumbers,
        recommendation: isLoginId
          ? `Use account number: ${realAccountNumbers[0] || "Unknown"}`
          : isValidAccountNumber
            ? "Account ID is correct"
            : "Account ID not found",
      }
    } catch (error: any) {
      return {
        providedAccountId: input.accountId,
        isLoginId: input.accountId.startsWith("schwab_"),
        isValidAccountNumber: false,
        realAccountNumbers: [],
        error: error.message,
      }
    }
  }),

  // Refresh access token using refresh token (30-minute refresh)
  refreshToken: protectedProcedure
    .input(z.object({ loginId: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = ctx.user.id
        const loginId = input.loginId || (await getSelectedSchwabLogin(userId))

        if (!loginId) {
          throw new Error("No login specified and no login selected")
        }

        blg.info("Starting manual token refresh", { userId, loginId })

        // Get current tokens
        const storedTokens = await getStoredTokens(userId, loginId)
        if (!storedTokens) {
          throw new Error("No tokens found for this login")
        }

        if (!storedTokens.refresh_token) {
          throw new Error("No refresh token available. Please re-authenticate.")
        }

        // Check if refresh token itself might be expired (7 days)
        const refreshTokenAge = Date.now() - (storedTokens.expires_at - storedTokens.expires_in * 1000)
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000

        if (refreshTokenAge > sevenDaysMs) {
          blg.warn("Refresh token likely expired", { userId, loginId, refreshTokenAge })
          throw new Error("Refresh token expired. Please re-authenticate through full OAuth flow.")
        }

        const appKey = process.env.SCHWAB_APP_KEY
        const appSecret = process.env.SCHWAB_APP_SECRET

        if (!appKey || !appSecret) {
          throw new Error("Schwab app credentials not configured")
        }

        // Refresh the token
        const newTokens = await refreshAccessToken(storedTokens.refresh_token, appKey, appSecret)
        const updatedTokens = await storeTokens(newTokens, userId, loginId)

        blg.info("Manual token refresh successful", {
          userId,
          loginId,
          newExpiresAt: updatedTokens.expires_at,
        })

        return {
          success: true,
          tokenInfo: {
            access_token: "refreshed",
            refresh_token: "refreshed",
            expires_at: updatedTokens.expires_at,
            expires_in: newTokens.expires_in,
          },
        }
      } catch (error: any) {
        blg.error("Manual token refresh failed", {
          userId: ctx.user.id,
          loginId: input.loginId,
          error: error.message,
        })

        // If refresh fails, it might be because refresh token is expired
        if (error.message.includes("invalid") || error.message.includes("expired")) {
          throw new Error("Refresh token expired. Please re-authenticate through full OAuth flow.")
        }

        throw new Error(`Token refresh failed: ${error.message}`)
      }
    }),

  // Get OAuth2 authorization URL
  getAuthUrl: publicProcedure.query(async ({ ctx }) => {
    try {
      const appKey = process.env.SCHWAB_APP_KEY

      if (!appKey) {
        throw new Error("Schwab app key not configured")
      }

      const redirectUri = "https://agent.shraylabs.co/schwab/callback"
      const scope = "readonly" // For account data access
      const state = "shray_schwab_auth" // CSRF protection

      const authUrl =
        `${SCHWAB_AUTH_BASE_URL}/oauth/authorize?` +
        `client_id=${encodeURIComponent(appKey)}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `state=${encodeURIComponent(state)}`

      return { authUrl }
    } catch (error: any) {
      console.error("Error generating auth URL:", error)
      throw new Error("Failed to generate auth URL")
    }
  }),

  // Handle OAuth2 callback and exchange code for tokens
  handleCallback: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        state: z.string().optional(),
        accountName: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { code, state, accountName } = input

        blg.info("Starting Schwab OAuth callback handling", {
          hasCode: !!code,
          codeLength: code?.length,
          state: state || "missing",
          requestId: ctx.requestId,
        })

        // Verify state parameter for CSRF protection
        if (state !== "shray_schwab_auth") {
          blg.error("Invalid state parameter in callback", {
            expected: "shray_schwab_auth",
            received: state,
            requestId: ctx.requestId,
          })
          throw new Error("Invalid state parameter")
        }

        const appKey = process.env.SCHWAB_APP_KEY
        const appSecret = process.env.SCHWAB_APP_SECRET

        if (!appKey || !appSecret) {
          blg.error("Schwab app credentials not configured", { requestId: ctx.requestId })
          throw new Error("Schwab app credentials not configured")
        }

        blg.info("Schwab credentials configured, exchanging code for tokens", {
          hasAppKey: !!appKey,
          hasAppSecret: !!appSecret,
          requestId: ctx.requestId,
        })

        const redirectUri = "https://agent.shraylabs.co/schwab/callback"

        // Exchange authorization code for access token
        blg.info("Making token exchange request to Schwab", {
          url: `${SCHWAB_AUTH_BASE_URL}/oauth/token`,
          redirectUri,
          requestId: ctx.requestId,
        })

        const tokenResponse = await axiosPost<any>(
          `${SCHWAB_AUTH_BASE_URL}/oauth/token`,
          new URLSearchParams({
            grant_type: "authorization_code",
            code: code,
            redirect_uri: redirectUri,
          }),
          {
            Authorization: `Basic ${Buffer.from(`${appKey}:${appSecret}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          "schwab-token-exchange",
          { timeout: 30000 },
        )

        blg.info("Received token response from Schwab", {
          hasResponse: !!tokenResponse,
          responseKeys: tokenResponse ? Object.keys(tokenResponse) : [],
          requestId: ctx.requestId,
        })

        const tokens = tokenResponseSchema.parse(tokenResponse)
        blg.info("Successfully parsed tokens", {
          hasAccessToken: !!tokens.access_token,
          hasRefreshToken: !!tokens.refresh_token,
          tokenType: tokens.token_type,
          expiresIn: tokens.expires_in,
          requestId: ctx.requestId,
        })

        // Generate unique login ID
        const loginId = `schwab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const finalLoginName = accountName || `Schwab Login ${new Date().toLocaleDateString()}`

        const storedTokens = await storeTokens(tokens, ctx.user.id, loginId, finalLoginName)

        blg.info("Successfully completed Schwab OAuth callback", {
          expiresAt: storedTokens.expires_at,
          requestId: ctx.requestId,
        })

        return {
          success: true,
          tokenInfo: {
            access_token: "present",
            refresh_token: tokens.refresh_token ? "present" : "missing",
            expires_at: storedTokens.expires_at,
          },
        }
      } catch (error: any) {
        blg.error("Error handling Schwab callback", {
          error: error.message,
          stack: error.stack,
          requestId: ctx.requestId,
        })
        console.error("Error handling callback:", error)
        throw new Error(`Failed to exchange code for tokens: ${error.message}`)
      }
    }),

  // Check authentication status
  getAuthStatus: protectedProcedure.query(async ({ ctx }) => {
    try {
      blg.info("Checking Schwab authentication status", { requestId: ctx.requestId })

      const storedTokens = await getStoredTokens(ctx.user.id)

      if (!storedTokens) {
        blg.info("No stored tokens found", { requestId: ctx.requestId })
        return { isAuthenticated: false }
      }

      const isExpired = Date.now() > storedTokens.expires_at
      const timeUntilExpiry = storedTokens.expires_at - Date.now()

      blg.info("Found stored tokens", {
        isExpired,
        timeUntilExpiryMs: timeUntilExpiry,
        timeUntilExpiryMins: Math.round(timeUntilExpiry / 60000),
        hasRefreshToken: !!storedTokens.refresh_token,
        requestId: ctx.requestId,
      })

      if (isExpired && !storedTokens.refresh_token) {
        blg.info("Tokens expired and no refresh token available", { requestId: ctx.requestId })
        return { isAuthenticated: false }
      }

      const result = {
        isAuthenticated: true,
        tokenInfo: {
          access_token: storedTokens.access_token ? "present" : "missing",
          refresh_token: storedTokens.refresh_token ? "present" : "missing",
          expires_at: storedTokens.expires_at,
        },
      }

      blg.info("Authentication status determined", {
        isAuthenticated: result.isAuthenticated,
        hasAccessToken: result.tokenInfo.access_token === "present",
        hasRefreshToken: result.tokenInfo.refresh_token === "present",
        requestId: ctx.requestId,
      })

      return result
    } catch (error: any) {
      blg.error("Error getting auth status", {
        error: error.message,
        requestId: ctx.requestId,
      })
      console.error("Error getting auth status:", error)
      return { isAuthenticated: false }
    }
  }),

  // Get user accounts (with caching per login)
  getAccounts: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = ctx.user.id
      const selectedLoginId = await getSelectedSchwabLogin(userId)

      if (!selectedLoginId) {
        throw new Error("No login selected")
      }

      // Check cache first
      const cacheKey = `schwab_accounts_${userId}_${selectedLoginId}`
      const cachedData = await getRedisCache(cacheKey)

      if (cachedData) {
        blg.info("Returning cached Schwab accounts", {
          userId,
          loginId: selectedLoginId,
          requestId: ctx.requestId,
        })
        const parsedData = JSON.parse(cachedData)
        parsedData.metadata.cached = true
        return parsedData
      }

      blg.info("Fetching fresh Schwab accounts", {
        userId,
        loginId: selectedLoginId,
        requestId: ctx.requestId,
      })

      const accountsData = await makeSchwabApiCall<SchwabAccount[]>(
        "/accounts?fields=positions",
        userId,
        selectedLoginId,
      )

      blg.info("Successfully fetched accounts", {
        accountCount: accountsData?.length || 0,
        loginId: selectedLoginId,
        requestId: ctx.requestId,
      })

      const response: SchwabAccountsResponse = {
        accounts: accountsData || [],
        metadata: {
          totalAccounts: accountsData?.length || 0,
          lastUpdated: Date.now(),
          loginId: selectedLoginId,
          cached: false,
        },
      }

      // Cache for 5 minutes (300 seconds) - balances change frequently but don't need real-time updates
      await setRedisCache(cacheKey, JSON.stringify(response), 300)

      return response
    } catch (error: any) {
      blg.error("Error getting accounts", {
        error: error.message,
        requestId: ctx.requestId,
      })
      console.error("Error getting accounts:", error)
      throw new Error(`Failed to fetch accounts: ${error.message}`)
    }
  }),

  // Get account numbers with hash values (for transactions endpoint)
  getAccountNumbers: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = ctx.user.id
      const selectedLoginId = await getSelectedSchwabLogin(userId)

      if (!selectedLoginId) {
        throw new Error("No login selected")
      }

      // Check cache first
      const cacheKey = `schwab_account_numbers_${userId}_${selectedLoginId}`
      const cachedData = await getRedisCache(cacheKey)

      if (cachedData) {
        blg.info("Returning cached Schwab account numbers", {
          userId,
          loginId: selectedLoginId,
          requestId: ctx.requestId,
        })
        const parsedData = JSON.parse(cachedData)
        parsedData.metadata.cached = true
        return parsedData
      }

      blg.info("Fetching fresh Schwab account numbers with hashes", {
        userId,
        loginId: selectedLoginId,
        requestId: ctx.requestId,
      })

      const accountNumbersData = await makeSchwabApiCall<Array<{
        accountNumber: string;
        hashValue: string;
      }>>("/accounts/accountNumbers", userId, selectedLoginId)

      blg.info("Successfully fetched account numbers", {
        accountCount: accountNumbersData?.length || 0,
        loginId: selectedLoginId,
        requestId: ctx.requestId,
      })

      const response = {
        accountNumbers: accountNumbersData || [],
        metadata: {
          totalAccounts: accountNumbersData?.length || 0,
          lastUpdated: Date.now(),
          loginId: selectedLoginId,
          cached: false,
        },
      }

      // Cache for 1 hour (3600 seconds) - account numbers don't change frequently
      await setRedisCache(cacheKey, JSON.stringify(response), 3600)

      return response
    } catch (error: any) {
      blg.error("Error getting account numbers", {
        error: error.message,
        requestId: ctx.requestId,
      })
      console.error("Error getting account numbers:", error)
      throw new Error(`Failed to fetch account numbers: ${error.message}`)
    }
  }),

  // Get all orders for all accounts
  getOrders: protectedProcedure
    .input(
      z.object({
        fromEnteredTime: z.string().optional(),
        toEnteredTime: z.string().optional(),
        maxResults: z.number().optional(),
        status: z
          .enum([
            "AWAITING_PARENT_ORDER",
            "AWAITING_CONDITION",
            "AWAITING_STOP_CONDITION",
            "AWAITING_MANUAL_REVIEW",
            "ACCEPTED",
            "AWAITING_UR_OUT",
            "PENDING_ACTIVATION",
            "QUEUED",
            "WORKING",
            "REJECTED",
            "PENDING_CANCEL",
            "CANCELED",
            "PENDING_REPLACE",
            "REPLACED",
            "FILLED",
            "EXPIRED",
            "NEW",
            "AWAITING_RELEASE_TIME",
            "PENDING_ACKNOWLEDGEMENT",
            "PENDING_RECALL",
            "UNKNOWN",
          ])
          .optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      try {
        const { fromEnteredTime, toEnteredTime, maxResults, status } = input
        const userId = ctx.user.id

        // Default to last 30 days if no date range specified (within 60 days limit)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const ytdStart = fromEnteredTime || thirtyDaysAgo.toISOString()
        const today = toEnteredTime || new Date().toISOString()

        // Create cache key based on parameters
        const cacheKey = `schwab_orders_${userId}_${ytdStart}_${today}_${maxResults || 'all'}_${status || 'all'}`

        // Check cache first
        const cachedData = await getRedisCache(cacheKey)
        if (cachedData) {
          blg.info("Returning cached Schwab orders", {
            userId,
            requestId: ctx.requestId,
          })
          const parsedData = JSON.parse(cachedData)
          parsedData.cached = true
          return parsedData
        }

        blg.info("Orders API date range", {
          ytdStart,
          today,
          maxResults,
          status,
        })

        let endpoint = `/orders`
        const params = new URLSearchParams({
          fromEnteredTime: ytdStart,
          toEnteredTime: today,
        })

        if (maxResults) {
          params.append("maxResults", maxResults.toString())
        }

        if (status) {
          params.append("status", status)
        }

        endpoint += `?${params.toString()}`

        blg.info("Fetching orders for all accounts", {
          endpoint,
          requestId: ctx.requestId,
        })

        const ordersData = await makeSchwabApiCall<any>(endpoint, ctx.user.id)
        const orders = Array.isArray(ordersData) ? ordersData : []

        // Filter and categorize orders
        const filledOrders = orders.filter((order: any) => order.status === "FILLED")
        const optionsOrders = orders.filter((order: any) =>
          order.orderLegCollection?.some(
            (leg: any) => leg.instrument?.instrumentType === "OPTION" || leg.instrument?.assetType === "OPTION",
          ),
        )

        // Group orders by account
        const ordersByAccount = orders.reduce((acc: any, order: any) => {
          const accountNumber = order.accountNumber
          if (!acc[accountNumber]) {
            acc[accountNumber] = []
          }
          acc[accountNumber].push(order)
          return acc
        }, {})

        // Get recent orders (last 10)
        const recentOrders = orders
          .sort((a: any, b: any) => new Date(b.enteredTime).getTime() - new Date(a.enteredTime).getTime())
          .slice(0, 10)

        blg.info("Orders categorized", {
          totalOrders: orders.length,
          filledCount: filledOrders.length,
          optionsOrdersCount: optionsOrders.length,
          accountCount: Object.keys(ordersByAccount).length,
          requestId: ctx.requestId,
        })

        const response = {
          orders,
          recentOrders,
          filledCount: filledOrders.length,
          optionsOrdersCount: optionsOrders.length,
          totalOrdersCount: orders.length,
          ordersByAccount,
          accountCount: Object.keys(ordersByAccount).length,
          metadata: {
            dateRange: { from: ytdStart, to: today },
            totalOrders: orders.length,
            lastUpdated: Date.now(),
            status: status || "ALL",
            maxResults: maxResults || 3000,
          },
          cached: false,
        }

        // Cache for 2 minutes (120 seconds) - orders don't change that frequently but we want recent data
        await setRedisCache(cacheKey, JSON.stringify(response), 120)

        return response
      } catch (error: any) {
        console.error("Error getting orders:", error)
        throw new Error(`Failed to fetch orders: ${error.message}`)
      }
    }),

  // Get account transactions (uses encrypted account hash)
  getTransactions: protectedProcedure
    .input(
      z.object({
        accountHash: z.string(), // Changed from accountNumber to accountHash
        startDate: z.string(),
        endDate: z.string(),
        types: z
          .enum([
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
          ])
          .optional(),
        symbol: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      try {
        const { accountHash, startDate, endDate, types, symbol } = input

        blg.info("Transactions API request", {
          accountHash,
          startDate,
          endDate,
          types,
          symbol,
        })

        // Use the encrypted account hash in the endpoint
        let endpoint = `/accounts/${accountHash}/transactions`
        const params = new URLSearchParams({
          startDate,
          endDate,
        })

        if (types) {
          params.append("types", types)
        }

        if (symbol) {
          params.append("symbol", symbol)
        }

        endpoint += `?${params.toString()}`

        const transactionsData = await makeSchwabApiCall<any>(endpoint, ctx.user.id)
        const transactions = Array.isArray(transactionsData) ? transactionsData : []

        // Filter options-related transactions
        const optionsTransactions = transactions.filter(
          (txn: any) =>
            txn.transactionItem?.instrument?.instrumentType === "OPTION" ||
            txn.transactionItem?.instrument?.assetType === "OPTION",
        )

        // Calculate realized P&L from closed positions (simplified calculation)
        const realizedPnL = transactions
          .filter((txn: any) => txn.type === "TRADE" && txn.netAmount)
          .reduce((total: number, txn: any) => total + (txn.netAmount || 0), 0)

        // Get recent transactions (last 10)
        const recentTransactions = transactions
          .sort((a: any, b: any) => new Date(b.settlementDate).getTime() - new Date(a.settlementDate).getTime())
          .slice(0, 10)
          .map((txn: any) => ({
            type: txn.type,
            symbol: txn.transactionItem?.instrument?.symbol || "N/A",
            netAmount: txn.netAmount || 0,
            settlementDate: txn.settlementDate,
            description: txn.description,
          }))

        return {
          transactions,
          recentTransactions,
          optionsTransactionsCount: optionsTransactions.length,
          ytdTransactionsCount: transactions.length,
          realizedPnL,
          metadata: {
            accountHash, // Return the hash that was used
            dateRange: { from: startDate, to: endDate },
            totalTransactions: transactions.length,
            lastUpdated: Date.now(),
          },
        }
      } catch (error: any) {
        console.error("Error getting transactions:", error)
        throw new Error(`Failed to fetch transactions: ${error.message}`)
      }
    }),

  // Login Management  Procedures

  // List all user's Schwab logins
  listSchwabLogins: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = ctx.user.id
      const loginIds = await getUserSchwabLoginList(userId)
      const selectedLoginId = await getSelectedSchwabLogin(userId)
      blg.info("Listing Schwab logins", { userId, loginIds, selectedLoginId })

      const schwabLogins = await Promise.all(
        loginIds.map(async (loginId) => {
          const info = await getSchwabLoginInfo(userId, loginId)
          const tokens = await getStoredTokens(userId, loginId)

          return {
            id: loginId,
            name: info?.name || `Login ${loginId}`,
            createdAt: info?.createdAt || Date.now(),
            isSelected: loginId === selectedLoginId,
            isConnected: !!tokens && tokens.expires_at > Date.now(),
            expiresAt: tokens?.expires_at,
          }
        }),
      )

      return {
        schwabLogins: schwabLogins.sort((a, b) => b.createdAt - a.createdAt),
        accounts: schwabLogins.sort((a, b) => b.createdAt - a.createdAt), // Backward compatibility
        selectedSchwabLoginId: selectedLoginId,
        totalAccounts: schwabLogins.length,
      }
    } catch (error: any) {
      blg.error("Error listing logins:", { userId: ctx.user.id, error: error.message })
      throw new Error(`Failed to list logins: ${error.message}`)
    }
  }),

  // New login-based procedures for frontend compatibility
  selectSchwabLogin: protectedProcedure.input(z.object({ loginId: z.string() })).mutation(async ({ input, ctx }) => {
    try {
      const { loginId } = input
      const userId = ctx.user.id

      // Verify login exists and belongs to user
      const loginIds = await getUserSchwabLoginList(userId)
      if (!loginIds.includes(loginId)) {
        throw new Error("Login not found or does not belong to user")
      }

      // Verify login has valid tokens
      const tokens = await getStoredTokens(userId, loginId)
      if (!tokens) {
        throw new Error("Login is not connected. Please re-authenticate.")
      }

      await setSelectedSchwabLogin(userId, loginId)

      blg.info("Login selected successfully", { userId, loginId })

      return {
        success: true,
        selectedLoginId: loginId,
      }
    } catch (error: any) {
      blg.error("Error selecting login:", { userId: ctx.user.id, loginId: input.loginId, error: error.message })
      throw new Error(`Failed to select login: ${error.message}`)
    }
  }),

  deleteSchwabLogin: protectedProcedure.input(z.object({ loginId: z.string() })).mutation(async ({ input, ctx }) => {
    try {
      const { loginId } = input
      const userId = ctx.user.id

      // Verify login exists and belongs to user
      const loginIds = await getUserSchwabLoginList(userId)
      if (!loginIds.includes(loginId)) {
        throw new Error("Login not found or does not belong to user")
      }

      // Remove from login list
      const updatedLoginIds = loginIds.filter((id) => id !== loginId)
      await updateUserSchwabLoginList(userId, updatedLoginIds)

      // Delete login data from Redis
      await Promise.all([
        // Delete tokens - use 1 second expiry instead of 0
        setRedisCache(`schwab_tokens_${userId}_${loginId}`, "", 1),
        // Delete login info - use 1 second expiry instead of 0
        setRedisCache(`schwab_login_info_${userId}_${loginId}`, "", 1),
      ])

      // If this was the selected login, select another one or clear selection
      const selectedLoginId = await getSelectedSchwabLogin(userId)
      if (selectedLoginId === loginId) {
        if (updatedLoginIds.length > 0) {
          await setSelectedSchwabLogin(userId, updatedLoginIds[0])
        } else {
          await setRedisCache(`schwab_selected_login_${userId}`, "", 1)
        }
      }

      blg.info("Login deleted successfully", { userId, loginId, remainingLogins: updatedLoginIds.length })

      return {
        success: true,
        deletedLoginId: loginId,
        remainingLogins: updatedLoginIds.length,
        newSelectedLoginId:
          updatedLoginIds.length > 0 ? (selectedLoginId === loginId ? updatedLoginIds[0] : selectedLoginId) : null,
      }
    } catch (error: any) {
      blg.error("Error deleting login:", { userId: ctx.user.id, loginId: input.loginId, error: error.message })
      throw new Error(`Failed to delete login: ${error.message}`)
    }
  }),

  getSchwabLoginDetails: protectedProcedure
    .input(z.object({ loginId: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      try {
        const userId = ctx.user.id
        const loginId = input.loginId || (await getSelectedSchwabLogin(userId))

        if (!loginId) {
          throw new Error("No login specified and no login selected")
        }

        // Verify login belongs to user
        const loginIds = await getUserSchwabLoginList(userId)
        if (!loginIds.includes(loginId)) {
          throw new Error("Login not found or does not belong to user")
        }

        const info = await getSchwabLoginInfo(userId, loginId)
        const tokens = await getStoredTokens(userId, loginId)
        const selectedLoginId = await getSelectedSchwabLogin(userId)

        return {
          id: loginId,
          name: info?.name || `Login ${loginId}`,
          createdAt: info?.createdAt || Date.now(),
          isSelected: loginId === selectedLoginId,
          isConnected: !!tokens && tokens.expires_at > Date.now(),
          expiresAt: tokens?.expires_at,
          tokenInfo: tokens
            ? {
                hasAccessToken: !!tokens.access_token,
                hasRefreshToken: !!tokens.refresh_token,
                expiresAt: tokens.expires_at,
                isExpired: Date.now() > tokens.expires_at,
              }
            : null,
        }
      } catch (error: any) {
        blg.error("Error getting login details:", {
          userId: ctx.user.id,
          loginId: input.loginId,
          error: error.message,
        })
        throw new Error(`Failed to get login details: ${error.message}`)
      }
    }),

  // Account nickname management

  // Get account nicknames for a login
  getAccountNicknames: protectedProcedure
    .input(z.object({ loginId: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      try {
        const userId = ctx.user.id
        const loginId = input.loginId || (await getSelectedSchwabLogin(userId))

        if (!loginId) {
          throw new Error("No login specified and no login selected")
        }

        const cacheKey = `schwab-nicknames:${loginId}`
        const nicknames = await getRedisCache(cacheKey)

        return {
          loginId,
          nicknames: nicknames ? JSON.parse(nicknames) : {},
        }
      } catch (error: any) {
        blg.error("Error getting account nicknames", {
          userId: ctx.user.id,
          loginId: input.loginId,
          error: error.message,
        })
        throw new Error(`Failed to get account nicknames: ${error.message}`)
      }
    }),

  // Set account nickname for a specific account in a login
  setAccountNickname: protectedProcedure
    .input(
      z.object({
        loginId: z.string().optional(),
        accountNumber: z.string(),
        nickname: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = ctx.user.id
        const { accountNumber, nickname } = input
        const loginId = input.loginId || (await getSelectedSchwabLogin(userId))

        if (!loginId) {
          throw new Error("No login specified and no login selected")
        }

        // Verify login belongs to user
        const loginIds = await getUserSchwabLoginList(userId)
        if (!loginIds.includes(loginId)) {
          throw new Error("Login not found or does not belong to user")
        }

        const cacheKey = `schwab-nicknames:${loginId}`

        // Get existing nicknames
        const existingNicknames = await getRedisCache(cacheKey)
        const nicknames = existingNicknames ? JSON.parse(existingNicknames) : {}

        // Update nickname for the account
        nicknames[accountNumber] = { nickname }

        // Store indefinitely (no TTL)
        await setRedisCache(cacheKey, JSON.stringify(nicknames))

        blg.info("Account nickname set successfully", {
          userId,
          loginId,
          accountNumber,
          nickname,
        })

        return {
          success: true,
          loginId,
          accountNumber,
          nickname,
        }
      } catch (error: any) {
        blg.error("Error setting account nickname", {
          userId: ctx.user.id,
          loginId: input.loginId,
          accountNumber: input.accountNumber,
          error: error.message,
        })
        throw new Error(`Failed to set account nickname: ${error.message}`)
      }
    }),

  // Update Schwab login name
  updateSchwabLoginName: protectedProcedure
    .input(
      z.object({
        loginId: z.string(),
        newName: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = ctx.user.id
        const { loginId, newName } = input

        // Verify login belongs to user
        const loginIds = await getUserSchwabLoginList(userId)
        if (!loginIds.includes(loginId)) {
          throw new Error("Login not found or does not belong to user")
        }

        // Get existing login info
        const existingInfo = await getSchwabLoginInfo(userId, loginId)

        // Update login info with new name
        const updatedInfo = {
          name: newName.trim(),
          createdAt: existingInfo?.createdAt || Date.now(),
        }

        await storeLoginInfo(userId, loginId, updatedInfo)

        blg.info("Schwab login name updated successfully", {
          userId,
          loginId,
          oldName: existingInfo?.name,
          newName: newName.trim(),
        })

        return {
          success: true,
          loginId,
          newName: newName.trim(),
        }
      } catch (error: any) {
        blg.error("Error updating Schwab login name", {
          userId: ctx.user.id,
          loginId: input.loginId,
          error: error.message,
        })
        throw new Error(`Failed to update login name: ${error.message}`)
      }
    }),

  // Clear all Schwab caches for the user
  clearSchwabCache: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const userId = ctx.user.id
      blg.info("Clearing Schwab caches", { userId })

      // Get all user's login IDs
      const loginIds = await getUserSchwabLoginList(userId)
      let clearedCaches = 0

      // Clear account caches for each login
      for (const loginId of loginIds) {
        try {
          const accountCacheKey = `schwab_accounts_${userId}_${loginId}`
          await setRedisCache(accountCacheKey, "", 1) // Delete by setting short expiry
          clearedCaches++
          blg.info("Cleared account cache", { userId, loginId, cacheKey: accountCacheKey })
        } catch (error: any) {
          blg.error("Error clearing account cache", { userId, loginId, error: error.message })
        }

        try {
          const accountNumbersCacheKey = `schwab_account_numbers_${userId}_${loginId}`
          await setRedisCache(accountNumbersCacheKey, "", 1) // Delete by setting short expiry
          clearedCaches++
          blg.info("Cleared account numbers cache", { userId, loginId, cacheKey: accountNumbersCacheKey })
        } catch (error: any) {
          blg.error("Error clearing account numbers cache", { userId, loginId, error: error.message })
        }
      }

      blg.info("Completed clearing Schwab caches", {
        userId,
        totalLogins: loginIds.length,
        clearedCaches,
      })

      return {
        success: true,
        clearedCaches,
        totalLogins: loginIds.length,
        message: `Cleared ${clearedCaches} Schwab account caches`,
      }
    } catch (error: any) {
      blg.error("Error clearing Schwab caches", {
        userId: ctx.user.id,
        error: error.message,
      })
      throw new Error(`Failed to clear Schwab caches: ${error.message}`)
    }
  }),
})
