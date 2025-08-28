import { useIsTouchDevice, useScreenSize } from "../hooks"
import { cn } from "../lib"

import { SidebarTrigger, useSidebar } from "../shadcnBase"
import { ChevronLeft } from "lucide-react"

export type AixSidebarEdgeTriggerProps = { className?: string }

export const AixSidebarEdgeTrigger = ({ ...p }: AixSidebarEdgeTriggerProps) => {
  const { breakpoint } = useScreenSize()
  const isTouchDevice = useIsTouchDevice()
  const { open, toggleSidebar, isMobile } = useSidebar()

  if (!breakpoint.lg || (isTouchDevice && breakpoint.lg && !isMobile))
    return (
      <SidebarTrigger
        size="icon"
        variant="secondary"
        type="button"
        onClick={toggleSidebar}
        className={cn(
          "fixed opacity-0 z-10 scale-95 left-[calc(var(--sidebar-width)_-_20px)] top-1/2 -translate-y-1/2 rounded-full group-hover:opacity-100 group-hover:scale-100 transition-all border hover:bg-secondary",
          { "left-[calc(var(--sidebar-width-icon)_-_20px)]": !open && !isMobile, "opacity-100": isTouchDevice },
        )}
      >
        <ChevronLeft size={16} className={cn({ "rotate-180": !open && !isMobile })} />
      </SidebarTrigger>
    )

  return <></>
}
