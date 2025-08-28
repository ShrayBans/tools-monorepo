import React, { useCallback, useEffect, useState } from "react"

import { MFASettings } from "../components/auth"
import { useAuth } from "../lib/auth-context"
import { trpc } from "../lib/trpc"

interface IntegrationAccount {
  userId: string
  integrationId: string
  integrationName: string | null
  externalUserId: string
  externalUsername: string | null
  externalEmail: string | null
  externalDisplayName: string | null
  isVerified: boolean
  isActive: boolean
  syncStatus: string
}

interface User {
  id: string
  email: string
  name: string
  avatarUrl: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  profileId: string | null
  firstName: string | null
  lastName: string | null
  title: string | null
  department: string | null
  location: string | null
  timezone: string | null
  phone: string | null
  lastActiveAt: Date | null
  profileCompleteness: number | null
  isOnboarded: boolean | null
  integrationAccounts: IntegrationAccount[]
  accessibleCategories?: string[] | null
}

interface DashboardStats {
  totalUsers: number
  activeUsers: number
}

/**
 * User Management Screen - Manage users and their third-party integrations
 *
 * Features:
 * - View all users with their profile information
 * - Search and filter users by name, email, or status
 * - View user integration account status
 * - Dashboard stats and overview
 * - User profile management
 */
function UserManagementScreen() {
  const { user: currentUser } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showCreateUserForm, setShowCreateUserForm] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserName, setNewUserName] = useState("")

  // Delete confirmation modal state
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  const [showHardDeleteConfirmModal, setShowHardDeleteConfirmModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [deleteReason, setDeleteReason] = useState("")
  const [hardDeleteConfirmation, setHardDeleteConfirmation] = useState("")

  // Permissions state for selected user modal
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedSeoProducts, setSelectedSeoProducts] = useState<string[]>([])
  const [saveTimeout, setSaveTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)

  // tRPC hooks
  const {
    data: usersData,
    isLoading: isLoadingUsers,
    refetch: refetchUsers,
  } = trpc.userManagement.getAllUsers.useQuery({
    page: currentPage,
    limit: 20,
    search: searchQuery || undefined,
    isActive: statusFilter === "all" ? undefined : statusFilter === "active",
  })

  const createUserMutation = trpc.userManagement.createUser.useMutation({
    onSuccess: (data) => {
      console.log("data", data)
      setShowCreateUserForm(false)
      setNewUserEmail("")
      setNewUserName("")
      refetchUsers()
      alert(data.message || "User created successfully!")
    },
    onError: (error) => {
      console.error("Create user error:", error)
      alert(`Failed to create user: ${error.message}`)
    },
  })

  // Permission management tRPC hooks
  const { data: categoriesData } = trpc.userManagement.getCategories.useQuery()
  const { data: seoProductsData } = trpc.userManagement.getSeoProducts.useQuery()
  const {
    data: userPermissionsData,
    isLoading: isLoadingPermissions,
    refetch: refetchPermissions,
  } = trpc.userManagement.getUserPermissions.useQuery(
    { userId: selectedUser?.id || "" },
    { enabled: !!selectedUser?.id },
  )

  const updatePermissionsMutation = trpc.userManagement.updateUserPermissions.useMutation({
    onSuccess: () => {
      refetchPermissions()
    },
    onError: (error) => {
      console.error("Permission update error:", error)
      alert(`Failed to update permissions: ${error.message}`)
    },
  })

  const softDeleteUserMutation = trpc.userManagement.softDeleteUser.useMutation({
    onSuccess: (data) => {
      setShowDeleteConfirmModal(false)
      setUserToDelete(null)
      setDeleteReason("")
      refetchUsers()
      alert(data.message || "User deactivated successfully!")
    },
    onError: (error) => {
      console.error("Soft delete user error:", error)
      alert(`Failed to deactivate user: ${error.message}`)
    },
  })

  const hardDeleteUserMutation = trpc.userManagement.hardDeleteUser.useMutation({
    onSuccess: (data) => {
      setShowHardDeleteConfirmModal(false)
      setUserToDelete(null)
      setDeleteReason("")
      setHardDeleteConfirmation("")
      refetchUsers()
      alert(data.message || "User permanently deleted!")
    },
    onError: (error) => {
      console.error("Hard delete user error:", error)
      alert(`Failed to permanently delete user: ${error.message}`)
    },
  })

  const users: User[] = (usersData?.success ? usersData.users : []) || []
  const pagination = usersData?.success ? usersData.pagination : null
  const stats: DashboardStats = {
    totalUsers: users.length,
    activeUsers: users.filter((user) => user.isActive).length,
  }

  // Reset page when search or filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter])

  // Load user permissions when user is selected
  useEffect(() => {
    if (selectedUser && userPermissionsData?.success) {
      const permissions = userPermissionsData.permissions
      setSelectedCategories(permissions.categories || [])
      setSelectedSeoProducts(permissions.seoProducts || [])
    } else if (selectedUser) {
      // Clear previous user's data when switching users
      setSelectedCategories([])
      setSelectedSeoProducts([])
    }
  }, [selectedUser, userPermissionsData])

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout)
      }
    }
  }, [saveTimeout])

  // Debounced save function
  const debouncedSave = useCallback(
    (categories: string[], seoProducts: string[]) => {
      if (saveTimeout) {
        clearTimeout(saveTimeout)
      }

      const newTimeout = setTimeout(() => {
        if (selectedUser) {
          updatePermissionsMutation.mutate({
            userId: selectedUser.id,
            categories,
            seoProducts,
          })
        }
      }, 1000) // 1 second debounce

      setSaveTimeout(newTimeout)
    },
    [selectedUser, updatePermissionsMutation, saveTimeout],
  )

  // Handle category checkbox change
  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    const newCategories = checked
      ? [...selectedCategories, categoryId]
      : selectedCategories.filter((id) => id !== categoryId)

    setSelectedCategories(newCategories)
    debouncedSave(newCategories, selectedSeoProducts)
  }

  // Handle SEO product checkbox change
  const handleSeoProductChange = (productId: string, checked: boolean) => {
    const newSeoProducts = checked
      ? [...selectedSeoProducts, productId]
      : selectedSeoProducts.filter((id) => id !== productId)

    setSelectedSeoProducts(newSeoProducts)
    debouncedSave(selectedCategories, newSeoProducts)
  }

  // Handle select all categories
  const handleSelectAllCategories = () => {
    const allCategoryIds = categoriesData?.success ? categoriesData.categories.map((c) => c.id) : []
    setSelectedCategories(allCategoryIds)
    debouncedSave(allCategoryIds, selectedSeoProducts)
  }

  // Handle select all SEO products
  const handleSelectAllSeoProducts = () => {
    const allProductIds = seoProductsData?.success ? seoProductsData.products.map((p) => p.id) : []
    setSelectedSeoProducts(allProductIds)
    debouncedSave(selectedCategories, allProductIds)
  }

  // Handle clear all categories
  const handleClearAllCategories = () => {
    setSelectedCategories([])
    debouncedSave([], selectedSeoProducts)
  }

  // Handle clear all SEO products
  const handleClearAllSeoProducts = () => {
    setSelectedSeoProducts([])
    debouncedSave(selectedCategories, [])
  }

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUserEmail.trim()) return

    createUserMutation.mutate({
      email: newUserEmail.trim(),
      name: newUserName.trim() || undefined,
    })
  }

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user)
    setShowDeleteConfirmModal(true)
  }

  const handleConfirmDelete = () => {
    if (!userToDelete) return

    softDeleteUserMutation.mutate({
      userId: userToDelete.id,
      reason: deleteReason || undefined,
    })
  }

  const handleCancelDelete = () => {
    setShowDeleteConfirmModal(false)
    setUserToDelete(null)
    setDeleteReason("")
  }

  const handleHardDeleteUser = (user: User) => {
    setUserToDelete(user)
    setShowHardDeleteConfirmModal(true)
  }

  const handleConfirmHardDelete = () => {
    if (!userToDelete) return

    hardDeleteUserMutation.mutate({
      userId: userToDelete.id,
      reason: deleteReason || undefined,
      confirmationPhrase: hardDeleteConfirmation,
    })
  }

  const handleCancelHardDelete = () => {
    setShowHardDeleteConfirmModal(false)
    setUserToDelete(null)
    setDeleteReason("")
    setHardDeleteConfirmation("")
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    refetchUsers()
  }

  const handleStatusFilterChange = (status: "all" | "active" | "inactive") => {
    setStatusFilter(status)
    refetchUsers()
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatDateTime = (date: Date | string | null) => {
    if (!date) return "Never"
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getProfileCompleteness = (user: User) => {
    if (user.profileCompleteness !== null) return user.profileCompleteness

    // Calculate basic completeness based on available data
    let completeness = 30 // Base for having an account
    if (user.firstName || user.lastName) completeness += 20
    if (user.title) completeness += 15
    if (user.department) completeness += 15
    if (user.location) completeness += 10
    if (user.phone) completeness += 10

    return Math.min(completeness, 100)
  }

  const getProfileCompletenessColor = (completeness: number) => {
    if (completeness >= 80) return "text-green-600 bg-green-100"
    if (completeness >= 60) return "text-yellow-600 bg-yellow-100"
    return "text-destructive bg-red-100"
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-bold  mb-2">👥 User Management</h1>
        <p className=" text-lg">Manage users and their third-party integration accounts</p>
      </header>

      {/* Users Section */}
      <div className="space-y-6">
        {/* Search and Filters */}
        <div className="bg-background rounded-lg shadow-sm border border-border p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex-1 max-w-md">
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                             transition-colors duration-200"
                >
                  🔍
                </button>
              </form>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleStatusFilterChange("all")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  statusFilter === "all" ? "bg-blue-600 text-white" : "bg-foregroundx text-primary "
                }`}
              >
                All Users
              </button>
              <button
                onClick={() => handleStatusFilterChange("active")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  statusFilter === "active" ? "bg-green-600 text-white" : "bg-foregroundx text-primary "
                }`}
              >
                Active
              </button>
              <button
                onClick={() => handleStatusFilterChange("inactive")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  statusFilter === "inactive" ? "bg-red-600 text-white" : "bg-foregroundx text-primary "
                }`}
              >
                Inactive
              </button>
            </div>
          </div>
        </div>

        {/* Add New User Form */}
        <div className="bg-background rounded-lg shadow-sm border border-border p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium ">Add New User</h3>
            <button
              onClick={() => setShowCreateUserForm(!showCreateUserForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {showCreateUserForm ? "Cancel" : "Add User"}
            </button>
          </div>

          {showCreateUserForm && (
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label htmlFor="new-user-email" className="block text-sm font-medium text-primary mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="new-user-email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div>
                <label htmlFor="new-user-name" className="block text-sm font-medium text-primary mb-1">
                  Name (Optional)
                </label>
                <input
                  type="text"
                  id="new-user-name"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={createUserMutation.isLoading || !newUserEmail.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {createUserMutation.isLoading ? "Creating..." : "Add User"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateUserForm(false)}
                  className="px-4 py-2 text-primary bg-background border border-gray-300 rounded-md  transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Users List */}
        <div className="bg-background rounded-lg shadow-sm border border-border">
          {isLoadingUsers ? (
            <div className="p-8 text-center">
              <div className="text-gray-500">Loading users...</div>
              <button
                onClick={() => refetchUsers()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                🔄 Reload Users
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-500 text-lg mb-2">No users found</div>
              <p className="text-gray-400">
                {searchQuery ? "Try adjusting your search criteria" : "No users match the current filters"}
              </p>
              <button
                onClick={() => refetchUsers()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                🔄 Reload Users
              </button>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="px-6 py-4 border-b border-border bg-foregroundx">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-primary">
                  <div className="col-span-3">User</div>
                  <div className="col-span-2">Department</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Profile</div>
                  <div className="col-span-2">Last Active</div>
                  <div className="col-span-1">Actions</div>
                </div>
              </div>

              {/* User Rows */}
              <div className="divide-y divide-gray-200">
                {users.map((user) => {
                  const completeness = getProfileCompleteness(user)
                  const displayName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name

                  return (
                    <div
                      key={user.id}
                      className="px-6 py-4  transition-colors cursor-pointer"
                      onClick={() => setSelectedUser(user)}
                    >
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* User Info */}
                        <div className="col-span-3">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {displayName.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-3">
                              <div className="font-medium ">{displayName}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </div>

                        {/* Department */}
                        <div className="col-span-2">
                          <span className="text-sm ">{user.department || "Not set"}</span>
                          {user.title && <div className="text-xs text-gray-500">{user.title}</div>}
                        </div>

                        {/* Status */}
                        <div className="col-span-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-destructive"
                            }`}
                          >
                            {user.isActive ? "✅ Active" : "❌ Inactive"}
                          </span>
                          {user.isOnboarded !== null && (
                            <div className="text-xs text-gray-500 mt-1">
                              {user.isOnboarded ? "Onboarded" : "Pending onboarding"}
                            </div>
                          )}
                        </div>

                        {/* Profile Completeness */}
                        <div className="col-span-2">
                          <div className="flex items-center">
                            <div className="flex-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-primary">{completeness}%</span>
                              </div>
                              <div className="w-full bg-foregroundx rounded-full h-2 mt-1">
                                <div
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    completeness >= 80
                                      ? "bg-green-500"
                                      : completeness >= 60
                                        ? "bg-yellow-500"
                                        : "bg-red-500"
                                  }`}
                                  style={{ width: `${completeness}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Last Active */}
                        <div className="col-span-2">
                          <span className="text-sm ">{formatDateTime(user.lastActiveAt)}</span>
                          <div className="text-xs text-gray-500">Joined {formatDate(user.createdAt)}</div>
                        </div>

                        {/* Actions */}
                        <div className="col-span-1">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedUser(user)
                              }}
                              className=" hover:text-blue-800 text-sm font-medium"
                            >
                              View
                            </button>
                            {user.isActive ? (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteUser(user)
                                  }}
                                  disabled={softDeleteUserMutation.isLoading}
                                  className="text-orange-600 hover:text-orange-800 text-sm font-medium disabled:opacity-50"
                                  title="Deactivate user"
                                >
                                  Deactivate
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleHardDeleteUser(user)
                                  }}
                                  disabled={hardDeleteUserMutation.isLoading}
                                  className="text-destructive hover:text-destructive text-sm font-medium disabled:opacity-50"
                                  title="Permanently delete user"
                                >
                                  Delete
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleHardDeleteUser(user)
                                }}
                                disabled={hardDeleteUserMutation.isLoading}
                                className="text-destructive hover:text-destructive text-sm font-medium disabled:opacity-50"
                                title="Permanently delete inactive user"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="px-6 py-4 border-t border-border bg-foregroundx">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-primary">
                      Showing page {pagination.page} of {pagination.pages}({pagination.total} total users)
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md
                                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === pagination.pages}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md
                                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* User Detail Modal with Permissions */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold ">User Details & Permissions</h2>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-400 hover:text-primary transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - User Information */}
                <div className="space-y-6">
                  {/* User Header */}
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xl">
                      {(selectedUser.firstName || selectedUser.name).charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold ">
                        {selectedUser.firstName && selectedUser.lastName
                          ? `${selectedUser.firstName} ${selectedUser.lastName}`
                          : selectedUser.name}
                      </h3>
                      <p className="text-primary">{selectedUser.email}</p>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                          selectedUser.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-destructive"
                        }`}
                      >
                        {selectedUser.isActive ? "✅ Active" : "❌ Inactive"}
                      </span>
                    </div>
                  </div>

                  {/* Profile Information */}
                  <div>
                    <h4 className="text-sm font-medium  mb-3">📋 Profile Information</h4>
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Title:</span>
                        <span className="ml-2 ">{selectedUser.title || "Not set"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Department:</span>
                        <span className="ml-2 ">{selectedUser.department || "Not set"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Location:</span>
                        <span className="ml-2 ">{selectedUser.location || "Not set"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Timezone:</span>
                        <span className="ml-2 ">{selectedUser.timezone || "UTC"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Phone:</span>
                        <span className="ml-2 ">{selectedUser.phone || "Not set"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Profile Completeness:</span>
                        <span className="ml-2 ">{getProfileCompleteness(selectedUser)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Activity Information */}
                  <div>
                    <h4 className="text-sm font-medium  mb-3">📊 Activity Information</h4>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Last Active:</span>
                        <span className="ml-2 ">{formatDateTime(selectedUser.lastActiveAt)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Joined:</span>
                        <span className="ml-2 ">{formatDateTime(selectedUser.createdAt)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Last Updated:</span>
                        <span className="ml-2 ">{formatDateTime(selectedUser.updatedAt)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Onboarded:</span>
                        <span className="ml-2 ">
                          {selectedUser.isOnboarded === null ? "Unknown" : selectedUser.isOnboarded ? "Yes" : "No"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Integration Accounts */}
                  <div>
                    <h4 className="text-sm font-medium  mb-3">🔗 Integration Accounts</h4>
                    <div className="bg-foregroundx rounded-lg p-4 text-center">
                      <div className="text-gray-500 text-sm">Integration accounts will be displayed here</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Feature coming soon - Slack, Linear, GitHub, etc.
                      </div>
                    </div>
                  </div>

                  {/* MFA Settings - Only show for current user */}
                  {currentUser && selectedUser.id === currentUser.id && (
                    <div>
                      <h4 className="text-sm font-medium  mb-3">🔐 Multi-Factor Authentication</h4>
                      <MFASettings />
                    </div>
                  )}
                </div>

                {/* Right Column - Permissions Management */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium  mb-3">🔐 Access Permissions</h4>

                    {/* Loading State */}
                    {isLoadingPermissions ? (
                      <div className="p-8 text-center">
                        <div className="text-gray-500 mb-2">Loading permissions...</div>
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      </div>
                    ) : (
                      <>
                        {/* Save Status */}
                        {updatePermissionsMutation.isLoading && (
                          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center">
                              <div className="text-blue-600 mr-3">💾</div>
                              <span className="text-blue-800 text-sm">Saving permissions...</span>
                            </div>
                          </div>
                        )}

                        {/* Categories Section */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="text-sm font-medium ">Categories</h5>
                            <div className="flex gap-1">
                              <button
                                onClick={handleSelectAllCategories}
                                className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                              >
                                All
                              </button>
                              <button
                                onClick={handleClearAllCategories}
                                className="text-xs px-2 py-1 bg-foregroundx text-primary rounded  transition-colors"
                              >
                                None
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {categoriesData?.success ? (
                              categoriesData.categories.map((category) => (
                                <label
                                  key={category.id}
                                  className="flex items-center p-2 bg-foregroundx rounded  transition-colors cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedCategories.includes(category.id)}
                                    onChange={(e) => handleCategoryChange(category.id, e.target.checked)}
                                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  />
                                  <span className="text-sm font-medium ">{category.name}</span>
                                </label>
                              ))
                            ) : (
                              <div className="text-sm text-gray-500">Loading categories...</div>
                            )}
                          </div>
                        </div>

                        {/* SEO Products Section */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="text-sm font-medium ">SEO Products</h5>
                            <div className="flex gap-1">
                              <button
                                onClick={handleSelectAllSeoProducts}
                                className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                              >
                                All
                              </button>
                              <button
                                onClick={handleClearAllSeoProducts}
                                className="text-xs px-2 py-1 bg-foregroundx text-primary rounded  transition-colors"
                              >
                                None
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {seoProductsData?.success ? (
                              seoProductsData.products.map((product) => (
                                <label
                                  key={product.id}
                                  className="flex items-center p-2 bg-foregroundx rounded  transition-colors cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedSeoProducts.includes(product.id)}
                                    onChange={(e) => handleSeoProductChange(product.id, e.target.checked)}
                                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  />
                                  <div className="flex-1">
                                    <div className="text-sm font-medium ">{product.name}</div>
                                    <div className="text-xs text-gray-500">{product.domain}</div>
                                  </div>
                                </label>
                              ))
                            ) : (
                              <div className="text-sm text-gray-500">Loading SEO products...</div>
                            )}
                          </div>
                        </div>

                        {/* Permission Summary */}
                        <div className="p-3 bg-foregroundx rounded-lg">
                          <h5 className="text-sm font-medium  mb-2">📊 Access Summary</h5>
                          <div className="text-sm text-primary space-y-1">
                            <div className="flex justify-between">
                              <span>Categories:</span>
                              <span className="font-medium">{selectedCategories.length} selected</span>
                            </div>
                            <div className="flex justify-between">
                              <span>SEO Products:</span>
                              <span className="font-medium">{selectedSeoProducts.length} selected</span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border bg-foregroundx">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 text-primary bg-background border border-gray-300 rounded-md
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                           transition-colors duration-200"
                >
                  Close
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                           transition-colors duration-200 opacity-75 cursor-not-allowed"
                  disabled
                >
                  Edit User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold ">Deactivate User</h3>
                <p className="text-sm ">This action will deactivate the user account</p>
              </div>
            </div>

            <div className="mb-6">
              <div className="bg-foregroundx rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {(userToDelete.firstName || userToDelete.name).charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-3">
                    <div className="font-medium ">
                      {userToDelete.firstName && userToDelete.lastName
                        ? `${userToDelete.firstName} ${userToDelete.lastName}`
                        : userToDelete.name}
                    </div>
                    <div className="text-sm text-gray-500">{userToDelete.email}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-primary">
                  <strong>Warning:</strong> This will deactivate the user account and:
                </p>
                <ul className="text-sm  list-disc list-inside space-y-1 ml-4">
                  <li>Set the user status to inactive</li>
                  <li>Deactivate all their integration accounts</li>
                  <li>Prevent them from accessing the system</li>
                  <li>This action can be reversed by reactivating the user</li>
                </ul>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-primary mb-2">
                  Reason for deactivation (optional)
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Enter reason for deactivating this user..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleConfirmDelete}
                disabled={softDeleteUserMutation.isLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {softDeleteUserMutation.isLoading ? "Deactivating..." : "Deactivate User"}
              </button>
              <button
                onClick={handleCancelDelete}
                disabled={softDeleteUserMutation.isLoading}
                className="flex-1 px-4 py-2 text-primary bg-background border border-gray-300 rounded-md  disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hard Delete Confirmation Modal */}
      {showHardDeleteConfirmModal && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold ">Permanently Delete User</h3>
                <p className="text-sm ">This action cannot be undone</p>
              </div>
            </div>

            <div className="mb-6">
              <div className="bg-foregroundx rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {(userToDelete.firstName || userToDelete.name).charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-3">
                    <div className="font-medium ">
                      {userToDelete.firstName && userToDelete.lastName
                        ? `${userToDelete.firstName} ${userToDelete.lastName}`
                        : userToDelete.name}
                    </div>
                    <div className="text-sm text-gray-500">{userToDelete.email}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-primary">
                  <strong>⚠️ WARNING:</strong> This will permanently delete the user and:
                </p>
                <ul className="text-sm  list-disc list-inside space-y-1 ml-4">
                  <li>Remove all user data from the database</li>
                  <li>Delete all integration accounts</li>
                  <li>Remove user profile and preferences</li>
                  <li>Delete product access permissions</li>
                  <li>
                    <strong>This action cannot be reversed</strong>
                  </li>
                </ul>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-primary mb-2">
                  Reason for permanent deletion (optional)
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Enter reason for permanently deleting this user..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-primary mb-2">
                  Type "DELETE PERMANENTLY" to confirm *
                </label>
                <input
                  type="text"
                  value={hardDeleteConfirmation}
                  onChange={(e) => setHardDeleteConfirmation(e.target.value)}
                  placeholder="DELETE PERMANENTLY"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleConfirmHardDelete}
                disabled={hardDeleteUserMutation.isLoading || hardDeleteConfirmation !== "DELETE PERMANENTLY"}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {hardDeleteUserMutation.isLoading ? "Deleting..." : "Permanently Delete User"}
              </button>
              <button
                onClick={handleCancelHardDelete}
                disabled={hardDeleteUserMutation.isLoading}
                className="flex-1 px-4 py-2 text-primary bg-background border border-gray-300 rounded-md  disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagementScreen
