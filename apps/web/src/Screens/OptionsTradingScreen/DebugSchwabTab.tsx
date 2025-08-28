import { useMemo, useState } from "react"
import toast from "react-hot-toast"

import { SchwabReauthModal } from "../../components/SchwabReauthModal"
import { useSchwabTokenRefresh } from "../../hooks/useSchwabTokenRefresh"
import { trpc } from "../../lib/trpc"

interface DebugSchwabTabProps {
  formatDateTime: (timestamp: number) => string
  formatCurrency: (value: number) => string
  formatPercent: (value: number) => string
}

export default function DebugSchwabTab({ formatDateTime, formatCurrency, formatPercent }: DebugSchwabTabProps) {
  const [schwabLoginId, setSelectedSchwabLoginId] = useState<string>("")
  const [accountName, setSchwabLoginName] = useState<string>("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [showReauthModal, setShowReauthModal] = useState(false)
  const [expiredLoginName, setExpiredLoginName] = useState<string>("")

  // Login name editing state
  const [editingLogin, setEditingLogin] = useState<string | null>(null)
  const [loginNameInput, setLoginNameInput] = useState("")

  // Authentication query
  const authUrlQuery = trpc.schwab.getAuthUrl.useQuery()

  // Check auth status query - only poll when connecting
  const authStatusQuery = trpc.schwab.getAuthStatus.useQuery(undefined, {
    refetchInterval: isConnecting ? 2000 : false, // Only poll when connecting
    enabled: false, // Disable by default, we'll use listSchwabLogins instead
  })

  // SchwabLogin management queries - smart polling
  const schwabLoginListQuery = trpc.schwab.listSchwabLogins.useQuery(undefined, {
    refetchInterval: (data) => {
      // Poll more frequently if connecting or if we have accounts that might expire soon
      if (isConnecting) return 2000 // Poll every 2 seconds when connecting
      if (data?.schwabLogins?.some((acc) => acc.isConnected && acc.expiresAt && acc.expiresAt < Date.now() + 300000)) {
        return 10000 // Poll every 10 seconds if any account expires within 5 minutes
      }
      return data?.schwabLogins?.length === 0 ? false : 60000 // Don't poll if no accounts, otherwise every 60 seconds
    },
  })

  // SchwabLogin management mutations
  const selectSchwabLoginMutation = trpc.schwab.selectSchwabLogin.useMutation({
    onSuccess: () => {
      toast.success("SchwabLogin selected successfully")
      schwabLoginListQuery.refetch()
    },
    onError: (error) => {
      toast.error(`Failed to select account: ${error.message}`)
    },
  })

  // Force refresh mutation for disconnected accounts
  const forceRefreshMutation = trpc.schwab.refreshToken.useMutation({
    onSuccess: (data, variables) => {
      const loginId = variables && typeof variables === "object" ? variables.loginId || "" : ""
      const account = schwabLoginListQuery.data?.schwabLogins?.find((acc) => acc.id === loginId)
      toast.success(`Token refreshed for ${account?.name || loginId}`)
      schwabLoginListQuery.refetch()
    },
    onError: (error, variables) => {
      const loginId = variables && typeof variables === "object" ? variables.loginId || "" : ""
      const account = schwabLoginListQuery.data?.schwabLogins?.find((acc) => acc.id === loginId)

      if (error.message.includes("full OAuth flow") || error.message.includes("Refresh token expired")) {
        setExpiredLoginName(account?.name || "Unknown Login")
        setShowReauthModal(true)
        toast.error("Login expired. Please reconnect your account.")
      } else {
        toast.error(`Refresh failed: ${error.message}`)
      }
    },
  })

  const deleteSchwabLoginMutation = trpc.schwab.deleteSchwabLogin.useMutation({
    onSuccess: (data) => {
      toast.success("SchwabLogin deleted successfully")
      if (data.newSelectedLoginId) {
        setSelectedSchwabLoginId(data.newSelectedLoginId)
      } else {
        setSelectedSchwabLoginId("")
      }
      schwabLoginListQuery.refetch()
    },
    onError: (error) => {
      toast.error(`Failed to delete login: ${error.message}`)
    },
  })

  // Login name update mutation
  const updateLoginNameMutation = trpc.schwab.updateSchwabLoginName.useMutation({
    onSuccess: () => {
      toast.success("Login name updated")
      schwabLoginListQuery.refetch()
      setEditingLogin(null)
      setLoginNameInput("")
    },
    onError: (error) => {
      toast.error(`Failed to update login name: ${error.message}`)
    },
  })

  // Handle callback mutation with account name
  const handleCallbackMutation = trpc.schwab.handleCallback.useMutation({
    onSuccess: () => {
      toast.success("Successfully connected Schwab account!")
      setIsConnecting(false)
      setSchwabLoginName("")
      schwabLoginListQuery.refetch()
    },
    onError: (error) => {
      toast.error(`Failed to connect: ${error.message}`)
      setIsConnecting(false)
    },
  })

  // Derive authentication status from accounts list
  const hasAuthenticatedLogin = schwabLoginListQuery.data?.schwabLogins?.some((acc) => acc.isConnected) ?? false
  const schwabLogin = schwabLoginListQuery.data?.schwabLogins?.find((acc) => acc.isSelected)
  const actualSelectedSchwabLogin = schwabLogin?.id || schwabLoginId

  // Token refresh hook for automatic refresh
  const tokenRefresh = useSchwabTokenRefresh({
    loginId: schwabLogin?.id,
    enabled: hasAuthenticatedLogin && !!schwabLogin?.id,
    onRefreshSuccess: () => {
      // Refresh queries after successful token refresh
      schwabLoginListQuery.refetch()
    },
    onFullReauthRequired: () => {
      setExpiredLoginName(schwabLogin?.name || "Unknown Login")
      setShowReauthModal(true)
    },
  })

  // Accounts query - only run if authenticated
  const accountsQuery = trpc.schwab.getAccounts.useQuery(undefined, {
    enabled: hasAuthenticatedLogin,
  })

  // Account numbers query - only run if authenticated
  const accountNumbersQuery = trpc.schwab.getAccountNumbers.useQuery(undefined, {
    enabled: hasAuthenticatedLogin,
  })

  // Memoize date calculations to prevent unnecessary re-renders
  const orderDateRange = useMemo(() => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return {
      fromEnteredTime: thirtyDaysAgo.toISOString(),
      toEnteredTime: new Date().toISOString(),
    }
  }, []) // Empty dependency array means this only calculates once

  // Orders query - only run if authenticated (no longer needs account selection)
  const ordersQuery = trpc.schwab.getOrders.useQuery(
    {
      maxResults: 100, // Limit to 100 orders for UI display
      ...orderDateRange,
    },
    {
      enabled: hasAuthenticatedLogin,
      staleTime: 2 * 60 * 1000, // 2 minutes - consider data fresh for 2 minutes
      cacheTime: 5 * 60 * 1000, // 5 minutes - keep in cache for 5 minutes
      refetchOnWindowFocus: false, // Don't refetch when window gains focus
      refetchOnMount: false, // Don't refetch on component mount if data exists
    },
  )

  // Transactions query - only run if authenticated and account hash available
  const transactionsQuery = trpc.schwab.getTransactions.useQuery(
    {
      accountHash: accountNumbersQuery.data?.accountNumbers?.[0]?.hashValue || "",
      startDate: (() => {
        const currentYear = new Date().getFullYear()
        const defaultStartYear = currentYear >= 2025 ? 2024 : currentYear // Use 2024 if we're in 2025
        return new Date(defaultStartYear, 0, 1).toISOString().split("T")[0]
      })(),
      endDate: new Date().toISOString().split("T")[0],
    },
    {
      enabled: hasAuthenticatedLogin && !!accountNumbersQuery.data?.accountNumbers?.[0]?.hashValue,
    },
  )

  // Debug query to check account ID validity
  const debugAccountQuery = trpc.schwab.debugAccountId.useQuery(
    { accountId: actualSelectedSchwabLogin },
    {
      enabled: hasAuthenticatedLogin && !!actualSelectedSchwabLogin,
    },
  )

  // Curl commands query for debugging
  const curlCommandsQuery = trpc.schwab.getDebugCurlCommands.useQuery(
    { accountNumber: accountsQuery.data?.accounts?.[0]?.securitiesAccount?.accountNumber || "" },
    {
      enabled: hasAuthenticatedLogin && !!accountsQuery.data?.accounts?.[0]?.securitiesAccount?.accountNumber,
    },
  )

  const handleAuthenticate = () => {
    if (authUrlQuery.data?.authUrl) {
      // Store account name in localStorage for the callback to use
      if (accountName.trim()) {
        localStorage.setItem("schwab_pending_account_name", accountName.trim())
      }

      setIsConnecting(true)
      window.open(authUrlQuery.data.authUrl, "_blank")
      toast.success("Opening Schwab authentication window...")
    }
  }

  const handleSelectSchwabLogin = (loginId: string) => {
    selectSchwabLoginMutation.mutate({ loginId })
  }

  const handleDeleteSchwabLogin = (loginId: string) => {
    if (confirm("Are you sure you want to delete this login? This action cannot be undone.")) {
      deleteSchwabLoginMutation.mutate({ loginId })
    }
  }

  // Helper functions for login name editing
  const handleEditLoginClick = (loginId: string, currentName: string) => {
    setEditingLogin(loginId)
    setLoginNameInput(currentName)
  }

  const handleSaveLoginName = () => {
    if (!editingLogin || !loginNameInput.trim()) return

    updateLoginNameMutation.mutate({
      loginId: editingLogin,
      newName: loginNameInput.trim(),
    })
  }

  const handleCancelLoginEdit = () => {
    setEditingLogin(null)
    setLoginNameInput("")
  }

  return (
    <div className="space-y-6">
      {/* SchwabLogin Management Section */}
      <div className="bg-background border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">🏦 Schwab Login Management</h2>
          <div className="flex items-center space-x-4">
            {schwabLoginListQuery.data?.schwabLogins?.some((acc) => acc.isConnected) ? (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-green-700 font-semibold">
                  {schwabLoginListQuery.data.schwabLogins.filter((acc) => acc.isConnected).length} Connected
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-destructive font-semibold">No Schwab Logins Connected</span>
              </div>
            )}
          </div>
        </div>

        {/* Token Status & Refresh Section */}
        {hasAuthenticatedLogin && schwabLogin && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-blue-800 mb-2">🔄 Token Status - {schwabLogin.name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Status:</span>{" "}
                    {tokenRefresh.isConnected ? (
                      <span className="text-green-700">✅ Connected</span>
                    ) : (
                      <span className="text-destructive">❌ Disconnected</span>
                    )}
                  </div>
                  <div>
                    <span className="font-medium">Token Expires:</span>{" "}
                    {tokenRefresh.tokenInfo?.expiresAt ? (
                      <span className={tokenRefresh.needsRefresh ? "text-orange-700" : "text-green-700"}>
                        {formatDateTime(tokenRefresh.tokenInfo.expiresAt)}
                      </span>
                    ) : (
                      "Unknown"
                    )}
                  </div>
                  <div>
                    <span className="font-medium">Auto Refresh:</span>{" "}
                    {tokenRefresh.needsRefresh ? (
                      <span className="text-orange-700">🔄 Needed</span>
                    ) : (
                      <span className="text-green-700">✅ Active</span>
                    )}
                  </div>
                </div>
                {tokenRefresh.lastRefresh > 0 && (
                  <div className="text-sm text-blue-600 mt-2">
                    Last refresh: {formatDateTime(tokenRefresh.lastRefresh)}
                  </div>
                )}

                {/* Enhanced Debug Info */}
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs text-blue-600 hover:text-blue-800">
                    🔍 Debug Token Details
                  </summary>
                  <div className="mt-2 p-2 bg-background border rounded text-xs space-y-1">
                    <div>
                      <strong>Current Time:</strong> {formatDateTime(Date.now())}
                    </div>
                    <div>
                      <strong>Token Expires At:</strong>{" "}
                      {tokenRefresh.tokenInfo?.expiresAt ? formatDateTime(tokenRefresh.tokenInfo.expiresAt) : "N/A"}
                    </div>
                    <div>
                      <strong>Time Until Expiry:</strong>{" "}
                      {tokenRefresh.tokenInfo?.expiresAt
                        ? `${Math.round((tokenRefresh.tokenInfo.expiresAt - Date.now()) / (60 * 1000))} minutes`
                        : "N/A"}
                    </div>
                    <div>
                      <strong>Is Expired:</strong> {tokenRefresh.tokenInfo?.isExpired ? "❌ Yes" : "✅ No"}
                    </div>
                    <div>
                      <strong>Needs Refresh (5min buffer):</strong> {tokenRefresh.needsRefresh ? "❌ Yes" : "✅ No"}
                    </div>
                    <div>
                      <strong>Has Access Token:</strong> {tokenRefresh.tokenInfo?.hasAccessToken ? "✅ Yes" : "❌ No"}
                    </div>
                    <div>
                      <strong>Has Refresh Token:</strong> {tokenRefresh.tokenInfo?.hasRefreshToken ? "✅ Yes" : "❌ No"}
                    </div>
                    <div>
                      <strong>Auto Refresh Enabled:</strong> {schwabLogin?.id ? "✅ Yes" : "❌ No"} (Login ID:{" "}
                      {schwabLogin?.id})
                    </div>
                    <div>
                      <strong>Last Refresh Time:</strong>{" "}
                      {tokenRefresh.lastRefresh > 0 ? formatDateTime(tokenRefresh.lastRefresh) : "Never"}
                    </div>
                    {tokenRefresh.refreshError && (
                      <div className="text-destructive">
                        <strong>Refresh Error:</strong> {tokenRefresh.refreshError}
                      </div>
                    )}
                  </div>
                </details>
              </div>
              <div className="ml-4">
                <button
                  onClick={tokenRefresh.manualRefresh}
                  disabled={tokenRefresh.isRefreshing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                >
                  {tokenRefresh.isRefreshing ? "Refreshing..." : "Manual Refresh"}
                </button>
              </div>
            </div>
            {tokenRefresh.refreshError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-destructive text-sm">
                ⚠️ Refresh Error: {tokenRefresh.refreshError}
              </div>
            )}
          </div>
        )}

        {/* Add New SchwabLogin Section */}
        <div className="space-y-4 border-b border-border pb-6 mb-6">
          <h3 className="text-lg font-semibold">Add New Schwab Login</h3>
          <div className="flex space-x-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-primary mb-1">SchwabLogin Name (Optional)</label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setSchwabLoginName(e.target.value)}
                placeholder="e.g., My Trading SchwabLogin"
                className="border border-gray-300 rounded-md px-3 py-2 w-full"
                disabled={isConnecting}
              />
            </div>
            <button
              onClick={handleAuthenticate}
              disabled={authUrlQuery.isLoading || isConnecting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isConnecting ? "Connecting..." : authUrlQuery.isLoading ? "Loading..." : "Connect New Schwab Login"}
            </button>
          </div>
          {isConnecting && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-blue-800 text-sm">
                🔄 Authentication window opened. Please complete the login process in the popup window.
              </div>
            </div>
          )}
        </div>

        {/* Connected Schwab Logins List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Connected Schwab Logins</h3>
          {schwabLoginListQuery.isLoading ? (
            <div className="text-center py-4">Loading schwab logins...</div>
          ) : schwabLoginListQuery.error ? (
            <div className="text-destructive">Error: {schwabLoginListQuery.error.message}</div>
          ) : schwabLoginListQuery.data?.schwabLogins?.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              No schwab logins connected yet. Add your first schwab login above.
            </div>
          ) : (
            <div className="space-y-3">
              {schwabLoginListQuery.data?.schwabLogins?.map((account) => (
                <div
                  key={account.id}
                  className={`border rounded-lg p-4 ${account.isSelected ? "border-blue-500 bg-blue-50" : "border-border"}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          {editingLogin === account.id ? (
                            <div className="flex items-center space-x-1">
                              <input
                                type="text"
                                value={loginNameInput}
                                onChange={(e) => setLoginNameInput(e.target.value)}
                                placeholder="Enter login name"
                                className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                style={{ width: "180px" }}
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveLoginName()
                                  if (e.key === "Escape") handleCancelLoginEdit()
                                }}
                              />
                              <button
                                onClick={handleSaveLoginName}
                                disabled={updateLoginNameMutation.isLoading}
                                className="px-1.5 py-1 bg-green-100 hover:bg-green-200 text-green-700 text-xs rounded disabled:opacity-50"
                              >
                                ✓
                              </button>
                              <button
                                onClick={handleCancelLoginEdit}
                                className="px-1.5 py-1 bg-foregroundx  text-primary text-xs rounded"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold">{account.name}</h4>
                              <button
                                onClick={() => handleEditLoginClick(account.id, account.name)}
                                className="p-1 text-gray-400 hover:text-primary text-xs"
                                title="Edit login name"
                              >
                                ✏️
                              </button>
                            </div>
                          )}
                        </div>
                        {account.isSelected && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Selected</span>
                        )}
                        {account.isConnected ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Connected</span>
                        ) : (
                          <span className="px-2 py-1 bg-red-100 text-destructive text-xs rounded-full">
                            Disconnected
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-primary mt-1">
                        <div>ID: {account.id}</div>
                        <div>Added: {formatDateTime(account.createdAt)}</div>
                        {account.expiresAt && <div>Expires: {formatDateTime(account.expiresAt)}</div>}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {!account.isSelected && account.isConnected && (
                        <button
                          onClick={() => handleSelectSchwabLogin(account.id)}
                          disabled={selectSchwabLoginMutation.isLoading}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          Select
                        </button>
                      )}
                      {/* Force Refresh button - always visible for disconnected accounts */}
                      {!account.isConnected && (
                        <button
                          onClick={() => {
                            console.log("Force refreshing token for login:", account.id)
                            forceRefreshMutation.mutate({ loginId: account.id })
                          }}
                          disabled={forceRefreshMutation.isLoading}
                          className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 disabled:opacity-50"
                        >
                          {forceRefreshMutation.isLoading ? "Refreshing..." : "🔄 Force Refresh"}
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteSchwabLogin(account.id)}
                        disabled={deleteSchwabLoginMutation.isLoading}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Accounts Section */}
      {hasAuthenticatedLogin && (
        <div className="bg-background border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">📊 Schwab Accounts</h3>
          {accountsQuery.isLoading ? (
            <div className="text-center py-4">Loading accounts...</div>
          ) : accountsQuery.error ? (
            <div className="text-destructive">Error: {accountsQuery.error.message}</div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded">
                  <div className="font-semibold">Total Accounts</div>
                  <div className="text-xl">{accountsQuery.data?.accounts?.length || 0}</div>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <div className="font-semibold">Selected Account</div>
                  <div className="text-sm">{schwabLogin?.name || "None selected"}</div>
                </div>
              </div>

              {accountsQuery.data?.accounts && accountsQuery.data.accounts.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">Select Account:</label>

                  {/* Debug Info Panel */}
                  <div className="mb-4 p-3 bg-foregroundx border rounded-lg text-xs space-y-2">
                    <div>
                      <strong>🔍 Debug Info:</strong>
                    </div>
                    <div>
                      <strong>Selected Login ID:</strong> {schwabLogin?.id || "None"}
                    </div>
                    <div>
                      <strong>Selected Account ID:</strong> {schwabLoginId || "None"}
                    </div>
                    <div>
                      <strong>Actual Account Number:</strong>{" "}
                      {accountsQuery.data.accounts[0]?.securitiesAccount?.accountNumber || "None"}
                    </div>
                    <div>
                      <strong>Using for API calls:</strong> {actualSelectedSchwabLogin || "None"}
                    </div>

                    {schwabLoginId !== accountsQuery.data.accounts[0]?.securitiesAccount?.accountNumber && (
                      <div className="text-destructive">
                        ⚠️ <strong>Issue:</strong> You're using login ID instead of account number for API calls!
                      </div>
                    )}
                  </div>

                  <select
                    value={schwabLoginId}
                    onChange={(e) => setSelectedSchwabLoginId(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 w-full max-w-md"
                  >
                    <option value="">Select an account...</option>
                    {accountsQuery.data.accounts.map((account: any, index: number) => {
                      const accountNumber = account.securitiesAccount?.accountNumber
                      const accountType = account.securitiesAccount?.type
                      const balance = account.aggregatedBalance?.currentLiquidationValue

                      return (
                        <option key={accountNumber || index} value={accountNumber}>
                          {accountType} - {accountNumber}
                          {balance ? ` ($${balance.toLocaleString()})` : ""}
                        </option>
                      )
                    })}
                  </select>

                  {/* Auto-select first account button */}
                  {accountsQuery.data.accounts.length > 0 && !schwabLoginId && (
                    <button
                      onClick={() =>
                        setSelectedSchwabLoginId(accountsQuery.data.accounts[0].securitiesAccount?.accountNumber)
                      }
                      className="mt-2 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      Auto-select First Account
                    </button>
                  )}
                </div>
              )}

              <details className="mt-4">
                <summary className="cursor-pointer font-semibold text-blue-600 hover:text-blue-800">
                  View Raw Accounts JSON Data
                </summary>
                <div className="mt-2 relative">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(accountsQuery.data, null, 2))
                      toast.success("Accounts data copied to clipboard!")
                    }}
                    className="absolute top-2 right-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  >
                    Copy
                  </button>
                  <pre className="p-4 bg-foregroundx rounded-lg text-xs overflow-auto max-h-96 pr-16">
                    {JSON.stringify(accountsQuery.data, null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          )}
        </div>
      )}

      {/* Orders Section */}
      {hasAuthenticatedLogin && (
        <div className="bg-background border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">📋 All Account Orders (Last 30 Days)</h3>
            <div className="text-xs bg-blue-50 px-2 py-1 rounded">Max Results: 100 | Status: ALL</div>
          </div>
          {ordersQuery.isLoading ? (
            <div className="text-center py-4">Loading orders...</div>
          ) : ordersQuery.error ? (
            <div className="text-destructive">Error: {ordersQuery.error.message}</div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-blue-50 p-3 rounded">
                  <div className="font-semibold">Total Orders</div>
                  <div className="text-xl">{ordersQuery.data?.totalOrdersCount || 0}</div>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <div className="font-semibold">Filled Orders</div>
                  <div className="text-xl">{ordersQuery.data?.filledCount || 0}</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded">
                  <div className="font-semibold">Options Orders</div>
                  <div className="text-xl">{ordersQuery.data?.optionsOrdersCount || 0}</div>
                </div>
                <div className="bg-purple-50 p-3 rounded">
                  <div className="font-semibold">Accounts</div>
                  <div className="text-xl">{ordersQuery.data?.accountCount || 0}</div>
                </div>
              </div>

              {/* Show orders by account breakdown */}
              {ordersQuery.data?.ordersByAccount && Object.keys(ordersQuery.data.ordersByAccount).length > 0 && (
                <div className="bg-foregroundx p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-3">📊 Orders by Account:</h4>
                  <div className="space-y-2">
                    {Object.entries(ordersQuery.data.ordersByAccount).map(([accountNumber, orders]: [string, any]) => (
                      <div key={accountNumber} className="bg-background p-3 rounded border text-sm">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-semibold">Account:</span> {accountNumber}
                          </div>
                          <div>
                            <span className="font-semibold">Orders:</span> {orders.length}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {ordersQuery.data?.recentOrders && ordersQuery.data.recentOrders.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-3">📊 Recent Orders (Last 10):</h4>
                  <div className="space-y-2">
                    {ordersQuery.data.recentOrders.map((order: any, index: number) => (
                      <div key={index} className="bg-background p-3 rounded border text-sm">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <div>
                            <span className="font-semibold">Symbol:</span> {order.symbol}
                          </div>
                          <div>
                            <span className="font-semibold">Status:</span> {order.status}
                          </div>
                          <div>
                            <span className="font-semibold">Type:</span> {order.orderType}
                          </div>
                          <div>
                            <span className="font-semibold">Date:</span>{" "}
                            {order.enteredTime ? formatDateTime(new Date(order.enteredTime).getTime()) : "N/A"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <details className="mt-4">
                <summary className="cursor-pointer font-semibold text-blue-600 hover:text-blue-800">
                  View Raw Orders JSON Data
                </summary>
                <div className="mt-2 relative">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(ordersQuery.data, null, 2))
                      toast.success("Orders data copied to clipboard!")
                    }}
                    className="absolute top-2 right-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  >
                    Copy
                  </button>
                  <pre className="p-4 bg-foregroundx rounded-lg text-xs overflow-auto max-h-96 pr-16">
                    {JSON.stringify(ordersQuery.data, null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          )}
        </div>
      )}

      {/* Transactions Section */}
      {hasAuthenticatedLogin && accountsQuery.data?.accounts?.[0]?.securitiesAccount?.accountNumber && (
        <div className="bg-background border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              💰 Account Transactions -{" "}
              {schwabLogin?.name || accountsQuery.data.accounts[0].securitiesAccount.accountNumber}
            </h3>
            <div className="text-xs bg-blue-50 px-2 py-1 rounded">
              Account Number: {accountsQuery.data.accounts[0].securitiesAccount.accountNumber}
            </div>
          </div>
          {transactionsQuery.isLoading ? (
            <div className="text-center py-4">Loading transactions...</div>
          ) : transactionsQuery.error ? (
            <div className="text-destructive">Error: {transactionsQuery.error.message}</div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-blue-50 p-3 rounded">
                  <div className="font-semibold">Total Transactions</div>
                  <div className="text-xl">{transactionsQuery.data?.transactions?.length || 0}</div>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <div className="font-semibold">Options Transactions</div>
                  <div className="text-xl">{transactionsQuery.data?.optionsTransactionsCount || 0}</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded">
                  <div className="font-semibold">Realized P&L</div>
                  <div className="text-xl">
                    {transactionsQuery.data?.realizedPnL ? formatCurrency(transactionsQuery.data.realizedPnL) : "N/A"}
                  </div>
                </div>
                <div className="bg-purple-50 p-3 rounded">
                  <div className="font-semibold">YTD Transactions</div>
                  <div className="text-xl">{transactionsQuery.data?.ytdTransactionsCount || 0}</div>
                </div>
              </div>

              {transactionsQuery.data?.recentTransactions && transactionsQuery.data.recentTransactions.length > 0 && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 mb-3">💸 Recent Transactions (Last 10):</h4>
                  <div className="space-y-2">
                    {transactionsQuery.data.recentTransactions.map((transaction: any, index: number) => (
                      <div key={index} className="bg-background p-3 rounded border text-sm">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <div>
                            <span className="font-semibold">Type:</span> {transaction.type}
                          </div>
                          <div>
                            <span className="font-semibold">Symbol:</span> {transaction.symbol}
                          </div>
                          <div>
                            <span className="font-semibold">Amount:</span> {formatCurrency(transaction.netAmount)}
                          </div>
                          <div>
                            <span className="font-semibold">Date:</span>{" "}
                            {transaction.settlementDate
                              ? formatDateTime(new Date(transaction.settlementDate).getTime())
                              : "N/A"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <details className="mt-4">
                <summary className="cursor-pointer font-semibold text-blue-600 hover:text-blue-800">
                  View Raw Transactions JSON Data
                </summary>
                <div className="mt-2 relative">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(transactionsQuery.data, null, 2))
                      toast.success("Transactions data copied to clipboard!")
                    }}
                    className="absolute top-2 right-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  >
                    Copy
                  </button>
                  <pre className="p-4 bg-foregroundx rounded-lg text-xs overflow-auto max-h-96 pr-16">
                    {JSON.stringify(transactionsQuery.data, null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          )}
        </div>
      )}

      {/* API Testing Section */}
      {hasAuthenticatedLogin && accountsQuery.data?.accounts && accountsQuery.data.accounts.length > 0 && (
        <div className="bg-background border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">🧪 API Testing Tools</h3>

          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">🔍 Current State Debug</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div>
                    <strong>Login Selected:</strong> {schwabLogin?.name || "None"}
                  </div>
                  <div>
                    <strong>Login ID:</strong> {schwabLogin?.id || "None"}
                  </div>
                  <div>
                    <strong>Login Connected:</strong> {tokenRefresh.isConnected ? "✅ Yes" : "❌ No"}
                  </div>
                </div>
                <div>
                  <div>
                    <strong>Account Selected:</strong> {schwabLoginId || "None"}
                  </div>
                  <div>
                    <strong>Actual Account #:</strong>{" "}
                    {accountsQuery.data.accounts[0]?.securitiesAccount?.accountNumber || "None"}
                  </div>
                  <div>
                    <strong>Using for APIs:</strong> {actualSelectedSchwabLogin || "None"}
                  </div>
                </div>
              </div>

              <div className="mt-3 p-2 bg-background border rounded text-xs">
                <div>
                  <strong>Issue Diagnosis:</strong>
                </div>
                {debugAccountQuery.data ? (
                  <div className="space-y-1">
                    <div>
                      <strong>Account ID Status:</strong>{" "}
                      {debugAccountQuery.data.isLoginId ? (
                        <span className="text-destructive">❌ Using Login ID (Wrong!)</span>
                      ) : debugAccountQuery.data.isValidAccountNumber ? (
                        <span className="text-green-600">✅ Valid Account Number</span>
                      ) : (
                        <span className="text-orange-600">⚠️ Unknown/Invalid</span>
                      )}
                    </div>
                    <div>
                      <strong>Recommendation:</strong> {debugAccountQuery.data.recommendation}
                    </div>
                    {debugAccountQuery.data.realAccountNumbers?.length > 0 && (
                      <div>
                        <strong>Available Accounts:</strong> {debugAccountQuery.data.realAccountNumbers.join(", ")}
                      </div>
                    )}
                    {debugAccountQuery.data.error && (
                      <div className="text-destructive">
                        <strong>Error:</strong> {debugAccountQuery.data.error}
                      </div>
                    )}
                  </div>
                ) : debugAccountQuery.isLoading ? (
                  <div>🔄 Checking account ID validity...</div>
                ) : (
                  <div>
                    {actualSelectedSchwabLogin === schwabLogin?.id ? (
                      <div className="text-destructive">
                        ❌ Problem: Using Login ID ({schwabLogin?.id}) instead of Account Number (
                        {accountsQuery.data.accounts[0]?.securitiesAccount?.accountNumber})
                      </div>
                    ) : actualSelectedSchwabLogin ===
                      accountsQuery.data.accounts[0]?.securitiesAccount?.accountNumber ? (
                      <div className="text-green-600">
                        ✅ Correct: Using Account Number ({actualSelectedSchwabLogin})
                      </div>
                    ) : (
                      <div className="text-orange-600">⚠️ Unknown: Using value ({actualSelectedSchwabLogin})</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Fix Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  const correctAccountNumber =
                    debugAccountQuery.data?.realAccountNumbers?.[0] ||
                    accountsQuery.data.accounts[0]?.securitiesAccount?.accountNumber ||
                    ""
                  setSelectedSchwabLoginId(correctAccountNumber)
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                disabled={
                  !debugAccountQuery.data?.realAccountNumbers?.[0] &&
                  !accountsQuery.data.accounts[0]?.securitiesAccount?.accountNumber
                }
              >
                🔧 Fix: Use Account Number (
                {debugAccountQuery.data?.realAccountNumbers?.[0] ||
                  accountsQuery.data.accounts[0]?.securitiesAccount?.accountNumber ||
                  "Unknown"}
                )
              </button>

              <button
                onClick={() => {
                  ordersQuery.refetch()
                  transactionsQuery.refetch()
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                🔄 Refresh All API Calls
              </button>
            </div>

            {/* API Response Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-foregroundx border rounded p-3">
                <div className="font-semibold mb-2">Orders API (All Accounts)</div>
                <div>
                  Status: {ordersQuery.isLoading ? "🔄 Loading" : ordersQuery.error ? "❌ Error" : "✅ Success"}
                </div>
                <div>Count: {ordersQuery.data?.totalOrdersCount || 0}</div>
                <div>Accounts: {ordersQuery.data?.accountCount || 0}</div>
                <div>
                  Endpoint: <code className="bg-foregroundx px-1 rounded text-xs">/orders</code>
                </div>
                {ordersQuery.error && (
                  <details className="mt-1">
                    <summary className="text-destructive text-xs cursor-pointer">❌ Error Details</summary>
                    <div className="text-destructive text-xs mt-1 whitespace-pre-wrap">{ordersQuery.error.message}</div>
                  </details>
                )}
              </div>

              <div className="bg-foregroundx border rounded p-3">
                <div className="font-semibold mb-2">Transactions API</div>
                <div>
                  Status:{" "}
                  {transactionsQuery.isLoading ? "🔄 Loading" : transactionsQuery.error ? "❌ Error" : "✅ Success"}
                </div>
                <div>Count: {transactionsQuery.data?.transactions?.length || 0}</div>
                <div>
                  Account Number:{" "}
                  <code className="bg-foregroundx px-1 rounded text-xs">
                    {accountsQuery.data?.accounts?.[0]?.securitiesAccount?.accountNumber || "N/A"}
                  </code>
                </div>
                {transactionsQuery.error && (
                  <details className="mt-1">
                    <summary className="text-destructive text-xs cursor-pointer">❌ Error Details</summary>
                    <div className="text-destructive text-xs mt-1 whitespace-pre-wrap">
                      {transactionsQuery.error.message}
                    </div>
                  </details>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Curl Commands Section */}
      {hasAuthenticatedLogin && actualSelectedSchwabLogin && curlCommandsQuery.data?.curlCommands && (
        <div className="bg-background border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">🔧 Debug Curl Commands</h3>
          <p className="text-sm text-primary mb-4">
            Copy these curl commands to test the API endpoints directly in your terminal:
          </p>

          <div className="space-y-4">
            {Object.entries(curlCommandsQuery.data.curlCommands || {}).map(([endpoint, curlCommand]) => (
              <div key={endpoint} className="bg-foregroundx border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-800 capitalize">
                    {endpoint === "accounts"
                      ? "📊 Accounts"
                      : endpoint === "accountNumbers"
                        ? "🔑 Account Numbers (with Hashes)"
                        : endpoint === "orders"
                          ? "📋 Orders (All Accounts)"
                          : endpoint === "transactions"
                            ? "💰 Transactions (with Encrypted Hash)"
                            : endpoint}
                  </h4>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(curlCommand as string)
                      toast.success(`${endpoint} curl command copied to clipboard!`)
                    }}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    📋 Copy Curl
                  </button>
                </div>
                <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono overflow-x-auto">
                  <pre className="whitespace-pre-wrap break-all">{curlCommand as string}</pre>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <div className="font-semibold text-blue-800 mb-2">💡 How to Use:</div>
            <div className="text-blue-700 mb-3">
              1. Copy any curl command above
              <br />
              2. Open your terminal
              <br />
              3. Paste and run the command
              <br />
              4. Compare the direct API response with what you see in the UI above
            </div>
            <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
              <div>
                <strong>Account Number:</strong> {curlCommandsQuery.data.accountNumber}
              </div>
              <div>
                <strong>Account Hash:</strong> {curlCommandsQuery.data.accountHash}
              </div>
              <div>
                <strong>Access Token:</strong> {curlCommandsQuery.data.accessToken}
              </div>
            </div>
          </div>
        </div>
      )}

      {curlCommandsQuery.isLoading && hasAuthenticatedLogin && actualSelectedSchwabLogin && (
        <div className="bg-background border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">🔧 Debug Curl Commands</h3>
          <div className="text-center py-4">🔄 Generating curl commands...</div>
        </div>
      )}

      {curlCommandsQuery.error && hasAuthenticatedLogin && actualSelectedSchwabLogin && (
        <div className="bg-background border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">🔧 Debug Curl Commands</h3>
          <div className="text-destructive">❌ Error generating curl commands: {curlCommandsQuery.error.message}</div>
        </div>
      )}

      {/* Reauthentication Modal */}
      <SchwabReauthModal
        isOpen={showReauthModal}
        onClose={() => setShowReauthModal(false)}
        expiredLoginName={expiredLoginName}
        onReauthSuccess={() => {
          schwabLoginListQuery.refetch()
          setShowReauthModal(false)
        }}
      />
    </div>
  )
}
