import { useState } from "react"
import toast from "react-hot-toast"

import { trpc } from "../lib/trpc"

interface SchwabReauthModalProps {
  isOpen: boolean
  onClose: () => void
  expiredLoginName?: string
  onReauthSuccess?: () => void
}

export function SchwabReauthModal({ isOpen, onClose, expiredLoginName, onReauthSuccess }: SchwabReauthModalProps) {
  const [accountName, setAccountName] = useState(expiredLoginName || "")
  const [isConnecting, setIsConnecting] = useState(false)

  // Get auth URL
  const authUrlQuery = trpc.schwab.getAuthUrl.useQuery(undefined, {
    enabled: isOpen,
  })

  // Handle callback mutation
  const handleCallbackMutation = trpc.schwab.handleCallback.useMutation({
    onSuccess: () => {
      toast.success("Successfully reconnected Schwab account!")
      setIsConnecting(false)
      setAccountName("")
      onReauthSuccess?.()
      onClose()
    },
    onError: (error) => {
      toast.error(`Failed to reconnect: ${error.message}`)
      setIsConnecting(false)
    },
  })

  const handleReauthenticate = () => {
    if (authUrlQuery.data?.authUrl) {
      // Store account name in localStorage for the callback to use
      if (accountName.trim()) {
        localStorage.setItem("schwab_pending_account_name", accountName.trim())
      }

      setIsConnecting(true)
      window.open(authUrlQuery.data.authUrl, "_blank")
      toast.success("Opening Schwab reauthentication window...")
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-destructive">🔒 Schwab Login Expired</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-primary">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-destructive text-sm">
              Your Schwab refresh token has expired (7-day limit). You need to reconnect your account through the full
              OAuth flow to continue accessing your Schwab data.
            </p>
          </div>

          {expiredLoginName && (
            <div className="text-sm text-primary">
              <strong>Expired Login:</strong> {expiredLoginName}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-primary mb-1">Account Name (Optional)</label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="e.g., My Trading Account"
              className="border border-gray-300 rounded-md px-3 py-2 w-full"
              disabled={isConnecting}
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-foregroundx text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleReauthenticate}
              disabled={authUrlQuery.isLoading || isConnecting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isConnecting ? "Connecting..." : authUrlQuery.isLoading ? "Loading..." : "Reconnect Schwab"}
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
      </div>
    </div>
  )
}
