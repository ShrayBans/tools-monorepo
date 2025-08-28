import { Link, useLocation } from "@tanstack/react-router"
import React from "react"

import { useAuth } from "../lib/auth-context"
import { trpc } from "../lib/trpc"

export default function AccessDeniedScreen() {
  const { user } = useAuth()
  const location = useLocation()

  // Get the attempted path from search params, fallback to current path
  const attemptedPath = (location.search as any)?.attemptedPath || location.pathname

  // Get user access information for context
  const { data: userAccessData } = trpc.accessControl.getUserCategoryAccess.useQuery(undefined, {
    enabled: !!user,
  })

  console.log("userAccessData", userAccessData)
  return (
    <div className="min-h-screen bg-foregroundx flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-background rounded-lg shadow-lg p-8 text-center">
          {/* Icon */}
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold  mb-2">Access Denied</h1>

          {/* Description */}
          <p className=" mb-6">
            You don't have permission to access this page. Please contact your administrator if you believe this is an
            error.
          </p>

          {/* User info */}
          {user && (
            <div className="bg-foregroundx rounded-lg p-4 mb-6 text-left">
              <div className="text-sm">
                <div className="font-medium  mb-1">Signed in as: {user.user_metadata?.name || user.email}</div>
                <div className="text-gray-500 mb-2">Email: {user.email}</div>
                {userAccessData?.success && (
                  <>
                    <div className="text-gray-500 mb-2">
                      Access Level: {userAccessData.user.isSuperAdmin ? "Super Admin" : "Standard User"}
                    </div>
                    <div className="text-gray-500">
                      <div className="font-medium">Available Categories:</div>
                      <div className="text-xs">
                        {userAccessData.access.categories.length > 0
                          ? userAccessData.access.categories.join(", ")
                          : "None"}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Attempted path */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
            <div className="text-sm text-destructive">
              <div className="font-medium">Attempted to access:</div>
              <code className="text-xs break-all">{attemptedPath}</code>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              to="/"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors inline-block"
            >
              Return to Home
            </Link>

            <button
              onClick={() => window.history.back()}
              className="w-full bg-foregroundx text-primary py-2 px-4 rounded-lg  transition-colors"
            >
              Try Again
            </button>
          </div>

          {/* Help text */}
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-xs text-gray-500">
              Need access? Contact your system administrator or visit the User Management section if you're an admin.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
