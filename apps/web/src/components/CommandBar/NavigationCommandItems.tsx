import { AixCommandItem, commandBarIconCn, commandBarOpenAtom, CommandGroup, CommandSeparator } from "@shray/ui"
import { useNavigate } from "@tanstack/react-router"
import { useAtom } from "jotai"

import { getNavigationForUser } from "../../config/navigationConfig"
import { useAuth } from "../../lib/auth-context"
import { trpc } from "../../lib/trpc"
import { TodoistProjectsCommandItems } from "./TodoistProjectsCommandItems"

export const NavigationCommandItems = () => {
  const [, setCommandBarOpen] = useAtom(commandBarOpenAtom)
  const navigate = useNavigate()
  const { user } = useAuth()

  // Get user access information
  const { data: userAccessData } = trpc.accessControl.getUserCategoryAccess.useQuery(undefined, {
    enabled: !!user,
  })

  const userCategories = userAccessData?.success ? userAccessData.access.categories : []
  const isSuperAdmin = userAccessData?.success ? userAccessData.user.isSuperAdmin : false

  const { categories, systemItems } = getNavigationForUser(userCategories, isSuperAdmin)

  const handleNavigate = async (to: string) => {
    await navigate({ to })
    setCommandBarOpen(false)
  }

  const handleNavigateNewTab = (to: string) => {
    window.open(window.location.origin + to, "_blank")
    setCommandBarOpen(false)
  }

  if (!userAccessData) {
    return null
  }

  // Flatten all navigation items
  const allNavigationItems = [...systemItems, ...categories.flatMap((category) => category.items)]

  return (
    <>
      <CommandSeparator />
      <CommandGroup heading="Navigate">
        {allNavigationItems.map((item) => {
          // Extract emoji from label for icon
          const displayLabel = item.label
          const icon = (item as any).icon

          return (
            <AixCommandItem
              key={item.to}
              onSelect={() => handleNavigate(item.to)}
              onSelectNewTab={() => handleNavigateNewTab(item.to)}
              name={displayLabel}
              icon={<span className={commandBarIconCn}>{icon}</span>}
            />
          )
        })}
      </CommandGroup>
      <TodoistProjectsCommandItems />
    </>
  )
}
