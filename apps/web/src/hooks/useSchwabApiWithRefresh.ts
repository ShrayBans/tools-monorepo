import { useCallback } from 'react'
import { trpc } from '../lib/trpc'

interface UseSchwabApiWithRefreshOptions {
  loginId?: string
  onFullReauthRequired?: () => void
}

/**
 * Hook that provides Schwab API methods with automatic token refresh before each call
 */
export function useSchwabApiWithRefresh({ 
  loginId, 
  onFullReauthRequired 
}: UseSchwabApiWithRefreshOptions = {}) {
  const utils = trpc.useUtils()
  
  // Get login details to check token expiry
  const loginDetailsQuery = trpc.schwab.getSchwabLoginDetails.useQuery(
    { loginId },
    { enabled: !!loginId }
  )

  // Refresh token mutation
  const refreshTokenMutation = trpc.schwab.refreshToken.useMutation({
    onError: (error) => {
      if (error.message.includes('full OAuth flow') || error.message.includes('Refresh token expired')) {
        onFullReauthRequired?.()
      }
    }
  })

  // Function to check if token needs refresh (with 5-minute buffer)
  const needsRefresh = useCallback(() => {
    if (!loginDetailsQuery.data?.tokenInfo) return false
    
    const { expiresAt } = loginDetailsQuery.data.tokenInfo
    const now = Date.now()
    const fiveMinutesMs = 5 * 60 * 1000
    
    return expiresAt && (expiresAt - now) < fiveMinutesMs
  }, [loginDetailsQuery.data?.tokenInfo])

  // Function to ensure token is fresh before API call
  const ensureFreshToken = useCallback(async () => {
    // Skip if not connected
    if (!loginDetailsQuery.data?.isConnected) {
      throw new Error('Not connected to Schwab. Please authenticate first.')
    }

    // Skip if token is still valid
    if (!needsRefresh()) {
      return
    }

    console.log('Token needs refresh before API call, refreshing...')
    
    try {
      await refreshTokenMutation.mutateAsync({ loginId })
      
      // Invalidate queries to pick up fresh token
      await utils.schwab.getSchwabLoginDetails.invalidate({ loginId })
      
      console.log('Token refreshed successfully before API call')
    } catch (error) {
      console.error('Failed to refresh token before API call:', error)
      throw error
    }
  }, [loginDetailsQuery.data?.isConnected, needsRefresh, refreshTokenMutation, loginId, utils])

  // Wrapped API methods that auto-refresh tokens
  const getAccountsWithRefresh = useCallback(async () => {
    await ensureFreshToken()
    return utils.schwab.getAccounts.fetch()
  }, [ensureFreshToken, utils])

  // getPositions removed - endpoint no longer exists in Schwab API

  const getOrdersWithRefresh = useCallback(async (params: {
    accountId: string
    fromEnteredTime?: string
    toEnteredTime?: string
    maxResults?: number
  }) => {
    await ensureFreshToken()
    return utils.schwab.getOrders.fetch(params)
  }, [ensureFreshToken, utils])

  const getTransactionsWithRefresh = useCallback(async (params: {
    accountHash: string // Changed from accountNumber to accountHash
    startDate: string
    endDate: string
    types?: "TRADE" | "RECEIVE_AND_DELIVER" | "DIVIDEND_OR_INTEREST" | "ACH_RECEIPT" | "ACH_DISBURSEMENT" | "CASH_RECEIPT" | "CASH_DISBURSEMENT" | "ELECTRONIC_FUND" | "WIRE_OUT" | "WIRE_IN" | "JOURNAL" | "MEMORANDUM" | "MARGIN_CALL" | "MONEY_MARKET" | "SMA_ADJUSTMENT"
    symbol?: string
  }) => {
    await ensureFreshToken()
    return utils.schwab.getTransactions.fetch(params)
  }, [ensureFreshToken, utils])

  const getAccountNumbersWithRefresh = useCallback(async () => {
    await ensureFreshToken()
    return utils.schwab.getAccountNumbers.fetch()
  }, [ensureFreshToken, utils])

  return {
    // Status
    isRefreshing: refreshTokenMutation.isLoading,
    isConnected: loginDetailsQuery.data?.isConnected ?? false,
    needsRefresh: needsRefresh(),
    
    // Token info
    tokenInfo: loginDetailsQuery.data?.tokenInfo,
    
    // API methods with automatic refresh
    getAccountsWithRefresh,
    getOrdersWithRefresh,
    getTransactionsWithRefresh,
    getAccountNumbersWithRefresh,
    
    // Manual token management
    ensureFreshToken,
    manualRefresh: () => refreshTokenMutation.mutate({ loginId }),
    
    // Error handling
    refreshError: refreshTokenMutation.error?.message,
  }
}