import React, { useEffect, useState } from "react"
import { useAuth } from "../../lib/auth-context"
import { MFAChallenge } from "./MFAChallenge"

interface MFAWrapperProps {
  children: React.ReactNode
}

/**
 * MFAWrapper - Handles MFA challenge flow for protected components
 * 
 * This component checks if the user needs to complete MFA verification
 * and shows the challenge screen if needed, otherwise renders the children.
 */
export function MFAWrapper({ children }: MFAWrapperProps) {
  const { user, mfaRequired, loading } = useAuth()
  const [mfaCompleted, setMfaCompleted] = useState(false)

  // Reset MFA completion when user changes
  useEffect(() => {
    setMfaCompleted(false)
  }, [user?.id])

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Show MFA challenge if required and not completed
  if (mfaRequired && !mfaCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <MFAChallenge
          onSuccess={() => setMfaCompleted(true)}
          onError={(error) => {
            console.error("MFA Challenge Error:", error)
            // Could show a toast notification here
          }}
        />
      </div>
    )
  }

  // Render children if no MFA required or MFA completed
  return <>{children}</>
}

/**
 * MFAGate - A simpler component for protecting individual features
 */
interface MFAGateProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function MFAGate({ children, fallback }: MFAGateProps) {
  const { currentAAL, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Show fallback if user doesn't have AAL2
  if (currentAAL !== "aal2") {
    return (
      fallback || (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="text-amber-600">🔒</div>
            <div>
              <p className="font-medium text-amber-800">Two-Factor Authentication Required</p>
              <p className="text-sm text-amber-700">
                This feature requires additional security verification.
              </p>
            </div>
          </div>
        </div>
      )
    )
  }

  return <>{children}</>
}