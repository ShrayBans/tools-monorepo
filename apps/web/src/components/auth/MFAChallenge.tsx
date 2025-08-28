import React, { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"

interface MFAChallengeProps {
  onSuccess: () => void
  onError?: (error: string) => void
}

export function MFAChallenge({ onSuccess, onError }: MFAChallengeProps) {
  const [verifyCode, setVerifyCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [factors, setFactors] = useState<any[]>([])
  const [selectedFactorId, setSelectedFactorId] = useState("")

  useEffect(() => {
    const loadFactors = async () => {
      try {
        const { data, error } = await supabase.auth.mfa.listFactors()
        if (error) {
          setError(error.message)
          onError?.(error.message)
          return
        }

        const allFactors = [...(data.totp || []), ...(data.phone || [])]
        setFactors(allFactors)
        
        // Auto-select the first verified factor
        const verifiedFactor = allFactors.find(f => f.status === "verified")
        if (verifiedFactor) {
          setSelectedFactorId(verifiedFactor.id)
        }
      } catch (err) {
        const errorMsg = "Failed to load MFA factors"
        setError(errorMsg)
        onError?.(errorMsg)
      }
    }

    loadFactors()
  }, [onError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!verifyCode.trim()) {
      setError("Please enter the verification code")
      return
    }

    if (!selectedFactorId) {
      setError("No MFA factor available")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Create challenge
      const challenge = await supabase.auth.mfa.challenge({ 
        factorId: selectedFactorId 
      })
      
      if (challenge.error) {
        setError(challenge.error.message)
        onError?.(challenge.error.message)
        return
      }

      // Verify the code
      const verify = await supabase.auth.mfa.verify({
        factorId: selectedFactorId,
        challengeId: challenge.data.id,
        code: verifyCode.trim(),
      })

      if (verify.error) {
        setError(verify.error.message)
        onError?.(verify.error.message)
        return
      }

      // Success - the session is now upgraded to AAL2
      onSuccess()
    } catch (err) {
      const errorMsg = "Failed to verify code"
      setError(errorMsg)
      onError?.(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const verifiedFactors = factors.filter(f => f.status === "verified")

  if (verifiedFactors.length === 0) {
    return (
      <div className="max-w-md mx-auto p-6 bg-card rounded-lg border">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Two-Factor Authentication Required</h2>
          <p className="text-muted-foreground mb-4">
            You need to set up two-factor authentication to continue.
          </p>
          <p className="text-sm text-muted-foreground">
            Please contact an administrator or set up MFA in your account settings.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-card rounded-lg border">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold mb-2">Two-Factor Authentication</h2>
        <p className="text-muted-foreground">
          Please enter the 6-digit code from your authenticator app
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {verifiedFactors.length > 1 && (
          <div>
            <label htmlFor="factor-select" className="block text-sm font-medium mb-2">
              Choose authenticator device
            </label>
            <select
              id="factor-select"
              value={selectedFactorId}
              onChange={(e) => setSelectedFactorId(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
            >
              {verifiedFactors.map((factor) => (
                <option key={factor.id} value={factor.id}>
                  {factor.friendly_name || `${factor.factor_type.toUpperCase()} Device`}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="mfa-code" className="block text-sm font-medium mb-2">
            Verification Code
          </label>
          <input
            id="mfa-code"
            type="text"
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="123456"
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring text-center font-mono text-lg"
            maxLength={6}
            autoFocus
          />
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={!verifyCode.trim() || loading}
          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Verifying..." : "Verify"}
        </button>
      </form>

      <div className="mt-4 text-center">
        <p className="text-xs text-muted-foreground">
          Having trouble? Make sure the time on your device is correct.
        </p>
      </div>
    </div>
  )
}