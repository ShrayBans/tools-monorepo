import { useNavigate } from "@tanstack/react-router"
import React, { useEffect, useState } from "react"

import { useAuth } from "../lib/auth-context"

export default function SignOutScreen() {
  const navigate = useNavigate()
  const { signOut, user } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    const handleSignOut = async () => {
      if (user) {
        setIsSigningOut(true)
        try {
          await signOut()
          // Redirect to auth page after sign out
          navigate({ to: "/auth" })
        } catch (error) {
          console.error("Error signing out:", error)
          // Still redirect to auth page even if there's an error
          navigate({ to: "/auth" })
        } finally {
          setIsSigningOut(false)
        }
      } else {
        // User is already signed out, redirect to auth
        navigate({ to: "/auth" })
      }
    }

    handleSignOut()
  }, [user, signOut, navigate])

  return (
    <div className="min-h-screen bg-foregroundx flex flex-col justify-center items-center p-8">
      <div className="max-w-md w-full bg-background rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="text-6xl mb-4">👋</div>
          <h1 className="text-2xl font-bold  mb-2">{isSigningOut ? "Signing you out..." : "Goodbye!"}</h1>
          <p className="">
            {isSigningOut ? "Please wait while we sign you out securely." : "You have been signed out successfully."}
          </p>
        </div>

        {isSigningOut && (
          <div className="flex justify-center mb-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={() => navigate({ to: "/auth" })}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                     transition-colors duration-200"
          >
            Sign In Again
          </button>

          <button
            onClick={() => navigate({ to: "/" })}
            className="w-full px-4 py-2  border border-blue-600 rounded-md
                     hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500
                     focus:ring-offset-2 transition-colors duration-200"
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  )
}
