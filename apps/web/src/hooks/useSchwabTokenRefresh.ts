import { useCallback, useEffect, useRef } from "react"
import toast from "react-hot-toast"

import { trpc } from "../lib/trpc"

interface UseSchwabTokenRefreshOptions {
  loginId?: string
  enabled?: boolean
  onRefreshSuccess?: () => void
  onRefreshError?: (error: string) => void
  onFullReauthRequired?: () => void
}

export function useSchwabTokenRefresh({
  loginId,
  enabled = true,
  onRefreshSuccess,
  onRefreshError,
  onFullReauthRequired,
}: UseSchwabTokenRefreshOptions = {}) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastRefreshRef = useRef<number>(0)

  // Get login details to check token expiry
  const loginDetailsQuery = trpc.schwab.getSchwabLoginDetails.useQuery(
    { loginId },
    {
      enabled: enabled && !!loginId,
      refetchInterval: 30000, // Check every 30 seconds
    },
  )

  // Refresh token mutation
  const refreshTokenMutation = trpc.schwab.refreshToken.useMutation({
    onSuccess: (data) => {
      console.log("Token refresh successful:", data)
      lastRefreshRef.current = Date.now()
      onRefreshSuccess?.()
      toast.success("Schwab token refreshed automatically")
    },
    onError: (error) => {
      console.error("Token refresh failed:", error)
      onRefreshError?.(error.message)

      // Check if this is a full reauth required error
      if (error.message.includes("full OAuth flow") || error.message.includes("Refresh token expired")) {
        onFullReauthRequired?.()
        toast.error("Schwab login expired. Please reconnect your account.")
      } else {
        toast.error(`Token refresh failed: ${error.message}`)
      }
    },
  })

  // Function to check if token needs refresh (with 5-minute buffer)
  const needsRefresh = useCallback(() => {
    if (!loginDetailsQuery.data?.tokenInfo) return false

    const { expiresAt } = loginDetailsQuery.data.tokenInfo
    const now = Date.now()
    const fiveMinutesMs = 5 * 60 * 1000

    // Refresh if token expires within 5 minutes
    return expiresAt && expiresAt - now < fiveMinutesMs
  }, [loginDetailsQuery.data?.tokenInfo])

  // Function to perform refresh
  const performRefresh = useCallback(async () => {
    if (refreshTokenMutation.isLoading) {
      console.log("Refresh already in progress, skipping")
      return
    }

    // Always check if we have valid login details first
    if (!loginDetailsQuery.data) {
      console.log("No login details available, refetching...")
      await loginDetailsQuery.refetch()
      return
    }

    if (!needsRefresh()) {
      console.log("Token still valid, skipping refresh")
      return
    }

    console.log("Performing automatic token refresh for login:", loginId)
    refreshTokenMutation.mutate({ loginId })
  }, [refreshTokenMutation, needsRefresh, loginId, loginDetailsQuery])

  // Manual refresh function for external use
  const manualRefresh = useCallback(() => {
    console.log("Manual token refresh requested")
    refreshTokenMutation.mutate({ loginId })
  }, [refreshTokenMutation, loginId])

  // Set up 25-minute timer
  useEffect(() => {
    if (!enabled || !loginId) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Set up 25-minute interval (25 * 60 * 1000 = 1,500,000ms)
    intervalRef.current = setInterval(performRefresh, 25 * 60 * 1000)

    // Also check immediately if token needs refresh
    const checkNow: ReturnType<typeof setTimeout> = setTimeout(performRefresh, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      clearTimeout(checkNow)
    }
  }, [enabled, loginId, performRefresh])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
    // Status
    isRefreshing: refreshTokenMutation.isLoading,
    lastRefresh: lastRefreshRef.current,
    needsRefresh: needsRefresh(),

    // Token info
    tokenInfo: loginDetailsQuery.data?.tokenInfo,
    isConnected: loginDetailsQuery.data?.isConnected ?? false,

    // Actions
    manualRefresh,

    // Error state
    refreshError: refreshTokenMutation.error?.message,
  }
}
