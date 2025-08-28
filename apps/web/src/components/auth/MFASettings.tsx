import React, { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../lib/auth-context"
import { MFASetup } from "./MFASetup"

interface MFAFactor {
  id: string
  friendly_name?: string
  factor_type: string
  status: string
  created_at: string
  phone?: string
}

export function MFASettings() {
  const { user, currentAAL, checkMFAStatus } = useAuth()
  const [factors, setFactors] = useState<MFAFactor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showSetup, setShowSetup] = useState(false)
  const [unenrolling, setUnenrolling] = useState<string | null>(null)

  const loadFactors = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase.auth.mfa.listFactors()

      if (error) {
        setError(error.message)
        return
      }

      const allFactors = [...(data.totp || []), ...(data.phone || [])]
      setFactors(allFactors)
    } catch (err) {
      setError("Failed to load MFA factors")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFactors()
  }, [user])

  const handleUnenroll = async (factorId: string) => {
    setUnenrolling(factorId)
    setError("")

    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId })

      if (error) {
        setError(error.message)
        return
      }

      // Reload factors and check MFA status
      await loadFactors()
      await checkMFAStatus()
    } catch (err) {
      setError("Failed to remove authenticator")
    } finally {
      setUnenrolling(null)
    }
  }

  const handleEnrollmentComplete = async () => {
    setShowSetup(false)
    await loadFactors()
    await checkMFAStatus()
  }

  const verifiedFactors = factors.filter(f => f.status === "verified")
  const hasMFA = verifiedFactors.length > 0

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-6 w-48 bg-muted rounded mb-4"></div>
          <div className="h-4 w-64 bg-muted rounded mb-2"></div>
          <div className="h-4 w-80 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  if (showSetup) {
    return (
      <div className="p-6">
        <MFASetup
          onEnrolled={handleEnrollmentComplete}
          onCancelled={() => setShowSetup(false)}
        />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Two-Factor Authentication</h2>
          <p className="text-muted-foreground">
            Add an extra layer of security to your account by requiring a second authentication factor.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Current Status */}
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">MFA Status</h3>
              <p className="text-sm text-muted-foreground">
                Current security level: {currentAAL === "aal2" ? "Enhanced (MFA enabled)" : "Standard"}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${hasMFA ? "bg-green-500" : "bg-yellow-500"}`}></div>
              <span className="text-sm font-medium">
                {hasMFA ? "Protected" : "Not Protected"}
              </span>
            </div>
          </div>
        </div>

        {/* Enrolled Factors */}
        {verifiedFactors.length > 0 && (
          <div className="bg-card border rounded-lg p-4">
            <h3 className="font-semibold mb-4">Your Authenticators</h3>
            <div className="space-y-3">
              {verifiedFactors.map((factor) => (
                <div key={factor.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      📱
                    </div>
                    <div>
                      <p className="font-medium">
                        {factor.friendly_name || `${factor.factor_type.toUpperCase()} Authenticator`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Added {new Date(factor.created_at).toLocaleDateString()}
                        {factor.phone && ` • ${factor.phone}`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnenroll(factor.id)}
                    disabled={unenrolling === factor.id}
                    className="text-destructive hover:text-destructive/80 text-sm font-medium disabled:opacity-50"
                  >
                    {unenrolling === factor.id ? "Removing..." : "Remove"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security Recommendation */}
        {verifiedFactors.length === 1 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <div className="text-amber-600 mt-0.5">⚠️</div>
              <div>
                <h4 className="font-medium text-amber-800">Add a backup authenticator</h4>
                <p className="text-sm text-amber-700 mt-1">
                  We recommend having at least 2 authenticators to avoid being locked out if you lose access to one device.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={() => setShowSetup(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            {hasMFA ? "Add Another Authenticator" : "Enable Two-Factor Authentication"}
          </button>
          
          {hasMFA && (
            <button
              onClick={() => window.location.reload()} // Simple way to refresh MFA status
              className="px-4 py-2 border border-border rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Refresh Status
            </button>
          )}
        </div>

        {/* Help Section */}
        <div className="bg-muted/50 border rounded-lg p-4">
          <h4 className="font-medium mb-2">Need Help?</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Use apps like Google Authenticator, 1Password, or Authy</li>
            <li>• Each code is valid for 30 seconds</li>
            <li>• Make sure your device time is correct</li>
            <li>• Keep your backup codes in a safe place</li>
          </ul>
        </div>
      </div>
    </div>
  )
}