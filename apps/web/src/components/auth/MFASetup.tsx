import React, { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"

interface MFASetupProps {
  onEnrolled: () => void
  onCancelled: () => void
}

export function MFASetup({ onEnrolled, onCancelled }: MFASetupProps) {
  const [factorId, setFactorId] = useState("")
  const [qrCode, setQrCode] = useState("")
  const [secret, setSecret] = useState("")
  const [verifyCode, setVerifyCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [enrolling, setEnrolling] = useState(false)

  useEffect(() => {
    const enrollFactor = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase.auth.mfa.enroll({
          factorType: "totp",
        })

        if (error) {
          setError(error.message)
          return
        }

        setFactorId(data.id)
        setQrCode(data.totp.qr_code)
        setSecret(data.totp.secret)
      } catch (err) {
        setError("Failed to initialize MFA enrollment")
      } finally {
        setLoading(false)
      }
    }

    enrollFactor()
  }, [supabase])

  const handleEnableClick = async () => {
    if (!verifyCode.trim()) {
      setError("Please enter the verification code")
      return
    }

    setEnrolling(true)
    setError("")

    try {
      // Create challenge
      const challenge = await supabase.auth.mfa.challenge({ factorId })
      if (challenge.error) {
        setError(challenge.error.message)
        return
      }

      // Verify the code
      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: verifyCode.trim(),
      })

      if (verify.error) {
        setError(verify.error.message)
        return
      }

      onEnrolled()
    } catch (err) {
      setError("Failed to verify code")
    } finally {
      setEnrolling(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Setting up MFA...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-card rounded-lg border">
      <h2 className="text-2xl font-bold text-center mb-6">Enable Two-Factor Authentication</h2>
      
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Scan the QR code below with your authenticator app (Google Authenticator, 1Password, Authy, etc.)
          </p>
          
          {qrCode && (
            <div className="flex justify-center mb-4">
              <img 
                src={qrCode} 
                alt="MFA QR Code" 
                className="border rounded-lg"
              />
            </div>
          )}
          
          <details className="text-left">
            <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
              Can't scan the QR code? Click here for manual setup
            </summary>
            <div className="mt-2 p-3 bg-muted rounded text-sm font-mono break-all">
              {secret}
            </div>
          </details>
        </div>

        <div>
          <label htmlFor="verify-code" className="block text-sm font-medium mb-2">
            Enter the 6-digit code from your authenticator app
          </label>
          <input
            id="verify-code"
            type="text"
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="123456"
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring text-center font-mono text-lg"
            maxLength={6}
          />
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="bg-muted/50 border border-border rounded-md p-4">
          <div className="flex items-start space-x-2">
            <div className="text-amber-500 mt-0.5">⚠️</div>
            <div className="text-sm">
              <p className="font-medium mb-1">Important Security Tip</p>
              <p className="text-muted-foreground">
                We recommend setting up at least 2 authenticator devices (e.g., phone + password manager) 
                to avoid being locked out if you lose access to one device.
              </p>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onCancelled}
            className="flex-1 px-4 py-2 border border-border rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleEnableClick}
            disabled={!verifyCode.trim() || enrolling}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {enrolling ? "Verifying..." : "Enable MFA"}
          </button>
        </div>
      </div>
    </div>
  )
}