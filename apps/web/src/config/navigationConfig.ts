export const MODULE_CATEGORIES = {
  MOVIES: "movies",
  SUPER_ADMIN: "super-admin",
} as const

export type ModuleCategory = (typeof MODULE_CATEGORIES)[keyof typeof MODULE_CATEGORIES]

// Map routes to their categories (based on actual routes in the app)
export const ROUTE_CATEGORY_MAP: Record<string, ModuleCategory> = {
  // AI Growth - AI-powered growth tools
  "/movies": MODULE_CATEGORIES.MOVIES,
  "/user-management": MODULE_CATEGORIES.SUPER_ADMIN,
}

// Navigation structure (based on actual routes in the app)
export const navigationCategories = [
  {
    category: MODULE_CATEGORIES.MOVIES,
    label: "Movies",
    items: [
      { to: "/movies", label: "Movies", icon: "🎬" },
    ],
  },
  {
    category: MODULE_CATEGORIES.SUPER_ADMIN,
    label: "Super Admin",
    items: [
      { to: "/user-management", label: "User Management", icon: "�" },
      { to: "/product-management", label: "Product Management", icon: "�" },
    ],
  },
]

// System items (always visible)
export const systemItems = [
  { to: "/", label: "📊 Home" },
  { to: "/tools", label: "🛠️ Tools" },
]

// Public routes that don't require authentication
export const PUBLIC_ROUTES = [
  "/auth",
  "/auth/callback",
  "/access-denied",
  "/signout"
] as const

// Helper function to check if a route is public
export const isPublicRoute = (path: string): boolean => {
  return PUBLIC_ROUTES.includes(path as any)
}

// Helper function to get navigation items for a user based on their categories
export const getNavigationForUser = (userCategories: string[] = [], isSuperAdmin: boolean = false) => {
  const filteredCategories = navigationCategories
    .map((category) => {
      // Super admin category is only visible to super admins
      if (category.category === MODULE_CATEGORIES.SUPER_ADMIN) {
        return isSuperAdmin ? category : null
      }

      // For other categories, check if user has access to this category
      const hasAccessToCategory = userCategories.includes(category.category) || isSuperAdmin

      // Return the full category if user has access, otherwise null
      return hasAccessToCategory ? category : null
    })
    .filter(Boolean)

  return {
    categories: filteredCategories,
    systemItems, // System items are always visible
  }
}
