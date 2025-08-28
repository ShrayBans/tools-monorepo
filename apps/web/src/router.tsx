import { AixGlobalCommandBar } from "@shray/ui"
import { createRootRoute, createRoute, createRouter, Link, Outlet, useLocation } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/router-devtools"
import { ChevronLeft, ChevronRight, Menu, Star, X } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"

import { NavigationCommandItems } from "./components/CommandBar/NavigationCommandItems"
import DarkModeToggle from "./components/DarkModeToggle"
import ProtectedRoute from "./components/ProtectedRoute"
import PublicRoute from "./components/PublicRoute"
import { getNavigationForUser } from "./config/navigationConfig"
import { useGlobalShortcuts } from "./hooks/useGlobalShortcuts"
import { useAuth } from "./lib/auth-context"
import { trpc } from "./lib/trpc"
import SchwabCallback from "./pages/schwab/callback"
import Tools from "./pages/Tools"
import AccessDeniedScreen from "./Screens/AccessDeniedScreen"
import HomeScreen from "./Screens/HomeScreen"
import MoviesScreen from "./Screens/MoviesScreen/MoviesScreen"
import OptionsTradingScreen from "./Screens/OptionsTradingScreen/OptionsTradingScreen"
import SignOutScreen from "./Screens/SignOutScreen"
import UserManagementScreen from "./Screens/UserManagementScreen"

// CRM Screens
// Old hardcoded navigation removed - now using permission-aware navigation from config

// Starred items localStorage utilities
const STARRED_ITEMS_KEY = "shray-starred-items"

interface StarredItem {
  to: string
  label: string
  icon?: string
}

const getStarredItems = (): StarredItem[] => {
  try {
    const stored = localStorage.getItem(STARRED_ITEMS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

const setStarredItems = (items: StarredItem[]) => {
  localStorage.setItem(STARRED_ITEMS_KEY, JSON.stringify(items))
}

const toggleStarredItem = (item: StarredItem) => {
  const starred = getStarredItems()
  const existingIndex = starred.findIndex((s) => s.to === item.to)

  if (existingIndex >= 0) {
    // Remove from starred
    starred.splice(existingIndex, 1)
  } else {
    // Add to starred
    starred.push(item)
  }

  setStarredItems(starred)
  return starred
}

const isItemStarred = (to: string): boolean => {
  const starred = getStarredItems()
  return starred.some((item) => item.to === to)
}

// Star icon component
const StarIcon = ({
  filled,
  onClick,
  className = "w-4 h-4",
}: {
  filled: boolean
  onClick: (e: React.MouseEvent) => void
  className?: string
}) => (
  <button
    onClick={onClick}
    className={`p-0.5 rounded hover:bg-sidebar-accent transition-colors ${className}`}
    title={filled ? "Remove from starred" : "Add to starred"}
  >
    <Star className={`w-3.5 h-3.5 ${filled ? "fill-yellow-400 text-yellow-400" : "text-sidebar-foreground"}`} />
  </button>
)

// Sidebar component
function Sidebar({ isCollapsed, onToggleCollapse }: { isCollapsed: boolean; onToggleCollapse: () => void }) {
  const location = useLocation()
  const { user, signOut, loading } = useAuth()

  // Get user access information
  const { data: userAccessData } = trpc.accessControl.getUserCategoryAccess.useQuery(undefined, {
    enabled: !!user,
  })

  // // Get permission-aware navigation - memoize user categories to prevent array recreation
  const userCategories = useMemo(
    () => (userAccessData?.success ? userAccessData.access.categories : []),
    [userAccessData?.success, JSON.stringify(userAccessData?.access?.categories)],
  )
  const isSuperAdmin = userAccessData?.success ? userAccessData.user.isSuperAdmin : false

  // Memoize navigation data to prevent unnecessary re-renders
  const { permissionAwareCategories, permissionAwareSystemItems } = useMemo(() => {
    const { categories, systemItems } = getNavigationForUser(userCategories, isSuperAdmin)
    return { permissionAwareCategories: categories, permissionAwareSystemItems: systemItems }
  }, [userCategories, isSuperAdmin])

  // Fallback navigation when not loaded
  const fallbackSystemItems = [{ to: "/", label: "📊 Status" }]

  // Load expanded categories from localStorage and auto-expand categories with active routes
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("expandedCategories")
    return saved ? new Set(JSON.parse(saved)) : new Set(["ai-tools"]) // Default expand ai-tools
  })

  // Update expanded categories when location changes to auto-expand categories with active routes
  useEffect(() => {
    // Find categories that contain the active route
    const activeCategoryIds = new Set<string>()
    permissionAwareCategories.forEach((category) => {
      const hasActiveRoute = category.items.some((item: any) => item.to === location.pathname)
      if (hasActiveRoute) {
        activeCategoryIds.add(category.category)
      }
    })

    // Only update if there are active categories to expand
    if (activeCategoryIds.size > 0) {
      setExpandedCategories((prev) => {
        const newSet = new Set(prev)
        let hasChanges = false
        activeCategoryIds.forEach((categoryId) => {
          if (!newSet.has(categoryId)) {
            newSet.add(categoryId)
            hasChanges = true
          }
        })
        return hasChanges ? newSet : prev
      })
    }
  }, [location.pathname, permissionAwareCategories])

  // Helper function for other parts of the component
  const getCategoriesWithActiveRoutes = () => {
    const activeCategoryIds = new Set<string>()
    permissionAwareCategories.forEach((category) => {
      const hasActiveRoute = category.items.some((item: any) => item.to === location.pathname)
      if (hasActiveRoute) {
        activeCategoryIds.add(category.category)
      }
    })
    return activeCategoryIds
  }

  // Starred items state
  const [starredItems, setStarredItems] = useState<StarredItem[]>(() => getStarredItems())

  // Save expanded categories to localStorage
  useEffect(() => {
    localStorage.setItem("expandedCategories", JSON.stringify(Array.from(expandedCategories)))
  }, [expandedCategories])

  const handleSignOut = async () => {
    await signOut()
  }

  const toggleCategory = (categoryId: string) => {
    // Check if this category contains the active route
    const activeCategoryIds = getCategoriesWithActiveRoutes()

    // Prevent collapsing categories that contain the active route
    if (activeCategoryIds.has(categoryId)) {
      return // Don't allow collapsing categories with active routes
    }

    setExpandedCategories((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  const handleToggleStar = (item: { to: string; label: string; icon?: string }) => {
    const newStarredItems = toggleStarredItem(item)
    setStarredItems(newStarredItems)
  }

  const renderNavigationItem = (item: any) => {
    const isActive = location.pathname === item.to
    const [emoji, ...textParts] = item.label.split(" ")
    const text = textParts.join(" ")
    const starred = isItemStarred(item.to)

    return (
      <li key={item.to}>
        <div
          className={`w-full rounded-md font-medium transition-all duration-200 text-sm ${
            isActive
              ? "bg-gradient-to-r from-sidebar-primary to-primary text-sidebar-primary-foreground shadow-md"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-sm"
          } ${isCollapsed ? "flex justify-center items-center" : "flex justify-between items-center"}`}
        >
          <Link
            to={item.to}
            className={`${isCollapsed ? "px-3 py-1.5" : "flex-1 px-3 py-1.5 text-left"}`}
            title={isCollapsed ? item.label : undefined}
          >
            {isCollapsed ? <span className="text-lg">{emoji || item.icon || "📄"}</span> : item.label}
          </Link>
          {!isCollapsed && (
            <div className="pr-2">
              <StarIcon
                filled={starred}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleToggleStar({
                    to: item.to,
                    label: item.label,
                    icon: emoji || item.icon,
                  })
                }}
              />
            </div>
          )}
        </div>
      </li>
    )
  }

  const renderCategory = (category: any) => {
    const isExpanded = expandedCategories.has(category.category)
    const hasItems = category.items.length > 0
    const hasActiveRoute = category.items.some((item: any) => item.to === location.pathname)

    if (isCollapsed && hasItems) {
      // In collapsed mode, show items directly without category headers
      return (
        <li key={category.category} className="space-y-0.5">
          {category.items.map(renderNavigationItem)}
        </li>
      )
    }

    return (
      <li key={category.category} className="mb-4">
        <button
          onClick={() => hasItems && toggleCategory(category.category)}
          className={`w-full px-3 py-1.5 text-left flex items-center justify-between text-xs font-semibold text-sidebar-foreground uppercase tracking-wider transition-colors rounded-md ${
            hasItems && !hasActiveRoute
              ? "cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              : hasActiveRoute
                ? "cursor-default text-sidebar-primary" // Different styling for categories with active routes
                : "cursor-default"
          }`}
        >
          <span>{category.label}</span>
          {hasItems && (
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""} ${
                hasActiveRoute ? "text-sidebar-primary" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>
        {hasItems && isExpanded && (
          <ul className="mt-1 space-y-0.5 pl-2">{category.items.map(renderNavigationItem)}</ul>
        )}
      </li>
    )
  }

  return (
    <aside
      className={`${isCollapsed ? "w-16" : "w-64"} bg-sidebar border-r border-sidebar-border flex flex-col h-full transition-all duration-300`}
    >
      <header
        className={`${isCollapsed ? "px-2" : "px-6"} py-4 flex-shrink-0 bg-sidebar/70 backdrop-blur-sm border-b border-sidebar-border relative`}
      >
        {!isCollapsed && (
          <h1 className="text-xl font-bold bg-gradient-to-r from-sidebar-primary to-primary bg-clip-text text-transparent">
            Sway Internal
          </h1>
        )}

        {/* Collapse/Expand button */}
        <button
          onClick={onToggleCollapse}
          className={`absolute ${isCollapsed ? "right-2" : "right-4"} top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-sidebar-accent transition-colors hidden lg:flex items-center justify-center`}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-sidebar-foreground" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-sidebar-foreground" />
          )}
        </button>
      </header>

      <nav className={`flex-1 overflow-y-auto min-h-0 sidebar-scroll ${isCollapsed ? "px-2" : "px-4"} py-3`}>
        {!user ? (
          <div className="text-center py-8 text-sidebar-foreground">
            {!isCollapsed && <div className="text-sm">Please sign in to view navigation</div>}
          </div>
        ) : !userAccessData ? (
          <div className="text-center py-8 text-sidebar-foreground">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sidebar-primary mx-auto mb-2" />
            {!isCollapsed && <div className="text-sm">Loading navigation...</div>}
          </div>
        ) : (
          <div className={`${isCollapsed ? "space-y-1" : "pb-4"}`}>
            {/* Starred Items Section */}
            {starredItems.length > 0 && (
              <div className="mb-6">
                {!isCollapsed && (
                  <div className="px-3 py-1.5 text-xs font-semibold text-sidebar-foreground uppercase tracking-wider mb-2 flex items-center">
                    <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                    Starred
                  </div>
                )}
                <ul className="space-y-0.5">{starredItems.map(renderNavigationItem)}</ul>
                {!isCollapsed && <div className="border-b border-sidebar-border mt-4" />}
              </div>
            )}

            {/* Main Navigation Categories */}
            <ul className={`${isCollapsed ? "space-y-1" : ""}`}>
              {permissionAwareCategories.map(renderCategory)}

              {/* Show message if no categories available */}
              {permissionAwareCategories.length === 0 && !isCollapsed && (
                <li className="text-center py-8 text-sidebar-foreground">
                  <div className="text-sm">No navigation items available</div>
                  <div className="text-xs text-muted-foreground mt-1">Contact admin for access</div>
                </li>
              )}
            </ul>
          </div>
        )}
      </nav>

      {/* System/Admin Section */}
      <div
        className={`mt-auto ${isCollapsed ? "px-2" : "px-4"} pt-3 pb-3 border-t border-sidebar-border flex-shrink-0 bg-sidebar/30 backdrop-blur-sm`}
      >
        <div className="mb-3">
          {!isCollapsed && (
            <div className="px-3 py-1.5 text-xs font-semibold text-sidebar-foreground uppercase tracking-wider">
              System
            </div>
          )}
          <ul className="space-y-0.5">
            {(userAccessData ? permissionAwareSystemItems : fallbackSystemItems).map((item, index) => {
              const isActive = location.pathname === item.to
              const [emoji, ...textParts] = item.label.split(" ")
              const starred = isItemStarred(item.to)
              return (
                <li key={item.to}>
                  <div
                    className={`w-full rounded-md font-medium transition-all duration-200 text-sm ${
                      isActive
                        ? "bg-gradient-to-r from-sidebar-primary to-primary text-sidebar-primary-foreground shadow-md"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-sm"
                    } ${isCollapsed ? "flex justify-center items-center" : "flex justify-between items-center"}`}
                  >
                    <Link
                      to={item.to}
                      className={`${isCollapsed ? "px-3 py-1.5" : "flex-1 px-3 py-1.5 text-left"}`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      {isCollapsed ? <span className="text-lg">{emoji || "📄"}</span> : item.label}
                    </Link>
                    {!isCollapsed && (
                      <div className="pr-2">
                        <StarIcon
                          filled={starred}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleToggleStar({
                              to: item.to,
                              label: item.label,
                              icon: emoji,
                            })
                          }}
                        />
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        {/* User Section */}
        <div className="pt-3 mt-3 border-t border-sidebar-border">
          {user ? (
            <div className="space-y-2">
              {!isCollapsed && (
                <div className="text-sm text-sidebar-foreground px-3">
                  <p className="font-medium truncate">{user.user_metadata?.name || user.email}</p>
                  <p className="text-xs truncate">{user.email}</p>
                </div>
              )}
              <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between px-3"}`}>
                <button
                  onClick={handleSignOut}
                  className={`${isCollapsed ? "p-2" : "flex-1 mr-2 px-2 py-1.5 text-xs text-left"} text-destructive hover:bg-destructive/10 rounded-md transition-colors`}
                  title={isCollapsed ? "Sign Out" : undefined}
                >
                  {isCollapsed ? "🚪" : "🚪 Sign Out"}
                </button>
                {!isCollapsed && <DarkModeToggle />}
              </div>
              {isCollapsed && (
                <div className="flex justify-center">
                  <DarkModeToggle />
                </div>
              )}
            </div>
          ) : (
            <div className={isCollapsed ? "" : "px-3"}>
              <Link
                to="/auth"
                className={`block w-full ${isCollapsed ? "p-2" : "px-3 py-1.5"} text-sm text-center hover:bg-primary/10 rounded-md transition-colors`}
                title={isCollapsed ? "Sign In" : undefined}
              >
                {isCollapsed ? "🔐" : "🔐 Sign In"}
              </Link>
            </div>
          )}
          {!isCollapsed && <p className="text-xs m-0 mt-3 px-3 pb-1">✅ Connected to Edge API</p>}
        </div>
      </div>
    </aside>
  )
}

// Layout component with collapsible sidebar
function Layout() {
  const { user, loading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Initialize global shortcuts
  useGlobalShortcuts()

  // Load collapsed state from localStorage
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed")
    return saved === "true"
  })

  // Save collapsed state to localStorage
  const handleToggleCollapse = () => {
    const newState = !sidebarCollapsed
    setSidebarCollapsed(newState)
    localStorage.setItem("sidebarCollapsed", String(newState))
  }

  // Don't render sidebar if not authenticated
  if (!loading && !user) {
    return (
      <div className="h-screen font-sans bg-background">
        <main className="overflow-auto bg-background">
          <Outlet />
        </main>
        <TanStackRouterDevtools />
      </div>
    )
  }

  return (
    <div className="flex h-screen font-sans bg-background relative">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        <Sidebar isCollapsed={sidebarCollapsed} onToggleCollapse={handleToggleCollapse} />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-background relative">
        {/* Hamburger menu button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute top-4 left-4 z-50 p-2 rounded-md bg-card shadow-md hover:bg-accent lg:hidden flex items-center justify-center"
          aria-label="Toggle main menu"
        >
          {sidebarOpen ? <X className="w-6 h-6 " /> : <Menu className="w-6 h-6 " />}
        </button>
        <Outlet />
      </main>

      {/* Global Command Bar */}
      <AixGlobalCommandBar name="global-nav">
        <NavigationCommandItems />
      </AixGlobalCommandBar>

      <TanStackRouterDevtools />
    </div>
  )
}

// Root route
const rootRoute = createRootRoute({
  component: Layout,
})

// Individual routes
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <ProtectedRoute>
      <HomeScreen />
    </ProtectedRoute>
  ),
})


const accessDeniedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/access-denied",
  component: AccessDeniedScreen,
})

const signOutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signout",
  component: SignOutScreen,
})

const moviesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/movies",
  component: () => (
    <ProtectedRoute>
      <MoviesScreen />
    </ProtectedRoute>
  ),
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search.tab as string) || undefined,
    genre: (search.genre as string) || undefined,
    year: (search.year as string) || undefined,
  }),
})


const optionsTradingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/options-trading",
  component: () => (
    <ProtectedRoute>
      <OptionsTradingScreen />
    </ProtectedRoute>
  ),
})

const userManagementRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/user-management",
  component: () => (
    <ProtectedRoute>
      <UserManagementScreen />
    </ProtectedRoute>
  ),
})

// Create the route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  optionsTradingRoute,
  userManagementRoute,
  accessDeniedRoute,
  signOutRoute,
    moviesRoute,
])

// Create the router
// @ts-ignore
export const router = createRouter({ routeTree })

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

