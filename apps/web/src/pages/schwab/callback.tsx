import { useEffect, useRef, useState } from "react"

import { trpc } from "../../lib/trpc"

export default function SchwabCallback() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  const hasProcessed = useRef(false)

  const addLog = (message: string) => {
    console.log(`[SchwabCallback] ${message}`)
    setDebugLogs((prev) => [...prev, `${new Date().toISOString()}: ${message}`])
  }

  const handleCallbackMutation = trpc.schwab.handleCallback.useMutation({
    onSuccess: (data) => {
      addLog("Successfully authenticated with Schwab!")
      addLog(`Token info: ${JSON.stringify(data.tokenInfo, null, 2)}`)
      setStatus("success")
      setMessage("Successfully authenticated with Schwab! You can close this window.")
      // Close the popup window after 3 seconds
      setTimeout(() => {
        addLog("Attempting to close window...")
        window.close()
      }, 3000)
    },
    onError: (error) => {
      addLog(`Authentication failed: ${error.message}`)
      addLog(`Error details: ${JSON.stringify(error, null, 2)}`)
      setStatus("error")
      setMessage(`Authentication failed: ${error.message}`)
    },
  })

  useEffect(() => {
    // Prevent multiple executions
    if (hasProcessed.current) {
      addLog("useEffect already processed, skipping...")
      return
    }

    addLog("Starting OAuth callback processing...")
    addLog(`Current URL: ${window.location.href}`)

    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get("code")
    const state = urlParams.get("state")
    const error = urlParams.get("error")
    const errorDescription = urlParams.get("error_description")

    // Get account name from localStorage (set by the main app)
    const accountName = localStorage.getItem("schwab_pending_account_name")

    addLog(
      `URL params - code: ${code ? "present" : "missing"}, state: ${state || "missing"}, error: ${error || "none"}`,
    )

    if (error) {
      addLog(`OAuth error detected: ${error}`)
      setStatus("error")
      setMessage(`OAuth Error: ${error}${errorDescription ? ` - ${errorDescription}` : ""}`)
      hasProcessed.current = true
      return
    }

    if (!code) {
      addLog("No authorization code found in URL parameters")
      setStatus("error")
      setMessage("No authorization code received from Schwab")
      hasProcessed.current = true
      return
    }

    // Mark as processed before making the API call
    hasProcessed.current = true
    addLog("Exchanging authorization code for tokens...")

    // Exchange the code for tokens
    addLog(`Account name from localStorage: ${accountName || "none"}`)
    handleCallbackMutation.mutate({
      code,
      state: state || undefined,
      accountName: accountName || undefined,
    })

    // Clear the account name from localStorage
    if (accountName) {
      localStorage.removeItem("schwab_pending_account_name")
    }
  }, []) // Remove handleCallbackMutation from dependencies to prevent re-runs

  return (
    <div className="min-h-screen bg-foregroundx flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-background shadow-lg rounded-lg p-6 text-center">
          {status === "loading" && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold  mb-2">Processing Authentication...</h2>
              <p className="text-primary">Please wait while we complete your Schwab authentication.</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="rounded-full bg-green-100 p-3 mx-auto mb-4 w-16 h-16 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-green-900 mb-2">Authentication Successful!</h2>
              <p className="text-green-700 mb-4">{message}</p>
              <p className="text-sm text-primary">This window will close automatically in a few seconds.</p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="rounded-full bg-red-100 p-3 mx-auto mb-4 w-16 h-16 flex items-center justify-center">
                <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-red-900 mb-2">Authentication Failed</h2>
              <p className="text-destructive mb-4">{message}</p>
              <button
                onClick={() => window.close()}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Close Window
              </button>
            </>
          )}

          {/* Debug Logs Section */}
          {debugLogs.length > 0 && (
            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-sm font-semibold text-primary mb-3 text-left">Debug Logs:</h3>
              <div className="bg-foregroundx rounded-lg p-4 max-h-64 overflow-y-auto">
                <pre className="text-xs text-gray-800 text-left whitespace-pre-wrap">{debugLogs.join("\n")}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
