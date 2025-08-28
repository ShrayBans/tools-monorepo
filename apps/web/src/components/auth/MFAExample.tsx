import React from "react"
import { useAuth } from "../../lib/auth-context"
import { MFAGate } from "./MFAWrapper"

/**
 * Example component showing how to use MFA protection
 */
export function MFAExample() {
  const { user, currentAAL, mfaRequired } = useAuth()

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="bg-card border rounded-lg p-4">
        <h2 className="text-xl font-bold mb-4">MFA Status Example</h2>
        
        <div className="space-y-2 text-sm">
          <p><strong>User:</strong> {user?.email || "Not logged in"}</p>
          <p><strong>Current AAL:</strong> {currentAAL || "N/A"}</p>
          <p><strong>MFA Required:</strong> {mfaRequired ? "Yes" : "No"}</p>
        </div>
      </div>

      <div className="bg-card border rounded-lg p-4">
        <h3 className="font-semibold mb-3">Regular Content</h3>
        <p className="text-muted-foreground">
          This content is visible to all authenticated users.
        </p>
      </div>

      <div className="bg-card border rounded-lg p-4">
        <h3 className="font-semibold mb-3">MFA-Protected Content</h3>
        <MFAGate>
          <div className="bg-green-50 border border-green-200 rounded p-3">
            <p className="text-green-800">
              🎉 Congratulations! You have completed two-factor authentication.
              This sensitive content is only visible to users with AAL2.
            </p>
          </div>
        </MFAGate>
      </div>

      <div className="bg-card border rounded-lg p-4">
        <h3 className="font-semibold mb-3">How to Test</h3>
        <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Go to Settings → Two-Factor Authentication</li>
          <li>Enable MFA by scanning the QR code</li>
          <li>Return to this page to see the MFA-protected content</li>
          <li>Sign out and sign back in to test the MFA challenge flow</li>
        </ol>
      </div>
    </div>
  )
}