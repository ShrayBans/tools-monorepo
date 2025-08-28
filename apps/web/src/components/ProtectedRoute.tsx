import { Navigate, useLocation } from "@tanstack/react-router"
import React from "react"

import { MODULE_CATEGORIES, ROUTE_CATEGORY_MAP } from "../config/navigationConfig"
import { useAuth } from "../lib/auth-context"
import { trpc } from "../lib/trpc"

interface ProtectedRouteProps {
  children: React.ReactNode
  requireSuperAdmin?: boolean
  allowedCategories?: string[]
  allowedProducts?: string[]
}

export default function ProtectedRoute({
  children,
  requireSuperAdmin = false,
  allowedCategories = [],
  allowedProducts = [],
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  const location = useLocation()

  // Get user access information
  const {
    data: userAccessData,
    isLoading: accessLoading,
    error: accessError,
  } = trpc.accessControl.getUserCategoryAccess.useQuery(undefined, {
    enabled: !!user,
  })

  if (!user && !loading) {
    // Capture current path (including search params) for redirect after auth
    const redirectTo = `${location.pathname}${location.search ? `?${new URLSearchParams(location.search).toString()}` : ""}`
    return (
      <Navigate
        to="/auth"
        // search={() => ({ redirect: redirectTo })}
      />
    )
  }

  if (loading || accessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-foregroundx">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 ">Loading...</p>
        </div>
      </div>
    )
  }

  // Check permissions if access data is available
  if (userAccessData?.success) {
    const { user: accessUser, access } = userAccessData
    const isSuperAdmin = accessUser.isSuperAdmin

    // Auto-detect route category and check access
    const currentRoute = location.pathname
    const routeCategory = ROUTE_CATEGORY_MAP[currentRoute]

    // Super admin check
    if (requireSuperAdmin && !isSuperAdmin) {
      // @ts-ignore
      return <Navigate to="/access-denied" search={() => ({ attemptedPath: currentRoute })} />
    }

    // Check route category access

    if (routeCategory) {
      // Super admin category requires super admin access
      if (routeCategory === MODULE_CATEGORIES.SUPER_ADMIN && !isSuperAdmin) {
        console.log("❌ Access denied: Super admin required")
        // @ts-ignore
        return <Navigate to="/access-denied" search={() => ({ attemptedPath: currentRoute })} />
      }

      // For other categories, check if user has access to this category
      if (
        routeCategory !== MODULE_CATEGORIES.SUPER_ADMIN &&
        !access.categories.includes(routeCategory) &&
        !isSuperAdmin
      ) {
        console.log("❌ Access denied: Missing category access", {
          required: routeCategory,
          userHas: access.categories,
          isSuperAdmin,
        })
        // @ts-ignore
        return <Navigate to="/access-denied" search={() => ({ attemptedPath: currentRoute })} />
      }
    }

    // Check explicit category requirements
    if (allowedCategories.length > 0) {
      const hasRequiredCategory = allowedCategories.some(
        (category) => access.categories.includes(category) || isSuperAdmin,
      )
      if (!hasRequiredCategory) {
        // @ts-ignore
        return <Navigate to="/access-denied" search={() => ({ attemptedPath: currentRoute })} />
      }
    }

    // Check explicit product requirements (deprecated - using categories instead)
    if (allowedProducts.length > 0) {
      // For backward compatibility, skip product checks
      // TODO: Remove this prop entirely and use categories only
      console.warn("allowedProducts prop is deprecated. Use allowedCategories instead.")
    }
  }

  return <>{children}</>
}
