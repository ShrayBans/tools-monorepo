// Super Admin emails - these users have full access to all products and can manage other users
export const SUPER_ADMIN_EMAILS = [
  "bansalshray@gmail.com", // Alternative admin email
  // Add more super admin emails as needed
]

// Helper function to check if a user is a super admin
export const isSuperAdmin = (email: string): boolean => {
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase())
}

// Nav Products available in the system - must match the navigation config
// These are internal products that appear in the sidebar
export const NAV_PRODUCTS = {
  MOVIES: "movies",
} as const

export type NavProductKey = (typeof NAV_PRODUCTS)[keyof typeof NAV_PRODUCTS]

// Nav Product display names
export const NAV_PRODUCT_DISPLAY_NAMES: Record<NavProductKey, string> = {
  [NAV_PRODUCTS.MOVIES]: "Movies",
}

// Default nav products for new users (if not super admin)
export const DEFAULT_USER_NAV_PRODUCTS: NavProductKey[] = [NAV_PRODUCTS.MOVIES]

// Nav Categories
export const NAV_CATEGORIES = {
  MOVIES: "movies",
} as const

export type NavCategory = (typeof NAV_CATEGORIES)[keyof typeof NAV_CATEGORIES]

// Legacy exports for backward compatibility
export const PRODUCTS = NAV_PRODUCTS
export type ProductKey = NavProductKey
export const PRODUCT_DISPLAY_NAMES = NAV_PRODUCT_DISPLAY_NAMES
export const DEFAULT_USER_PRODUCTS = DEFAULT_USER_NAV_PRODUCTS
