import { Session, User } from "@supabase/supabase-js"
import React, { createContext, useContext, useEffect, useState } from "react"

import { supabase } from "./supabase"

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  mfaRequired: boolean
  currentAAL: string | null
  nextAAL: string | null
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string }>
  signInWithGoogle: () => Promise<{ error?: string }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error?: string }>
  checkMFAStatus: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [mfaRequired, setMfaRequired] = useState(false)
  const [currentAAL, setCurrentAAL] = useState<string | null>(null)
  const [nextAAL, setNextAAL] = useState<string | null>(null)

  const checkMFAStatus = async () => {
    setMfaRequired(false)

    return
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("MFA status check timeout")), 5000) // 5 second timeout
      })

      const mfaPromise = supabase.auth.mfa.getAuthenticatorAssuranceLevel()

      const { data, error } = (await Promise.race([mfaPromise, timeoutPromise])) as any

      if (error) {
        console.error("❌ MFA Status Check Error:", error)
        // Set safe defaults on error
        setCurrentAAL("aal1")
        setNextAAL("aal1")
        setMfaRequired(false)
        return
      }

      setCurrentAAL(data.currentLevel)
      setNextAAL(data.nextLevel)
      setMfaRequired(data.nextLevel === "aal2" && data.currentLevel !== "aal2")
    } catch (error) {
      console.error("❌ MFA Status Check Error:", error)
      // Set safe defaults on error/timeout
      setCurrentAAL("aal1")
      setNextAAL("aal1")
      setMfaRequired(false)
    }
  }

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setLoading(false)
    }, 3000) // 3 seconds timeout

    // Get initial session
    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        clearTimeout(timeoutId)
        setSession(session)
        setUser(session?.user ?? null)

        // Check MFA status if user is already signed in
        // if (session?.user) {
        //   await checkMFAStatus()
        // }

        setLoading(false)
      })
      .catch((error) => {
        clearTimeout(timeoutId)
        console.error("❌ Auth initialization error:", error)
        setLoading(false) // Set loading to false even on error
      })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // Handle OAuth callback and check MFA status
      if (event === "SIGNED_IN" && session) {
        // Skip MFA check during OAuth callback to prevent hanging
        const isOAuthCallback = window.location.pathname === "/auth/callback"
        if (!isOAuthCallback) {
          // await checkMFAStatus()
        } else {
          // Set safe defaults for OAuth flow
          setCurrentAAL("aal1")
          setNextAAL("aal1")
          setMfaRequired(false)
        }
      }

      // Clear MFA state on sign out
      if (event === "SIGNED_OUT") {
        setMfaRequired(false)
        setCurrentAAL(null)
        setNextAAL(null)
      }
    })

    return () => {
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error: error.message }
      }

      return {}
    } catch (error) {
      return { error: "An unexpected error occurred" }
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      })

      if (error) {
        return { error: error.message }
      }

      return {}
    } catch (error) {
      return { error: "An unexpected error occurred" }
    }
  }

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        return { error: error.message }
      }

      return {}
    } catch (error) {
      return { error: "An unexpected error occurred" }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error("❌ Auth Context: Supabase signOut error:", error)
        // If the logout API call fails (403, network error, etc.),
        // we still want to clear the local session state
      }
    } catch (error) {
      console.error("❌ Auth Context: Unexpected signOut error:", error)
      // Clear local state even if API call fails
    } finally {
      // Always clear local state regardless of API response
      setSession(null)
      setUser(null)

      // Clear any persisted session data from localStorage
      try {
        localStorage.removeItem("supabase.auth.token")
        // Clear any other Supabase-related localStorage items
        Object.keys(localStorage).forEach((key) => {
          if (key.includes("supabase") || key.includes("sb-")) {
            localStorage.removeItem(key)
          }
        })
      } catch (localStorageError) {
        console.warn("⚠️  Auth Context: Could not clear localStorage:", localStorageError)
      }
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        return { error: error.message }
      }

      return {}
    } catch (error) {
      return { error: "An unexpected error occurred" }
    }
  }

  const value = {
    user,
    session,
    loading,
    mfaRequired,
    currentAAL,
    nextAAL,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    checkMFAStatus,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
