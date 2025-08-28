import dayjs from "dayjs"
import { ReactNode } from "react"
import { ToolbarProps } from "react-big-calendar"
import { cn } from "../../lib"
import { AixEventCalendarDefaultViewToggle } from "./AixEventCalendarDefaultViewToggle"
import { AixEventCalendarToolbarNavButtons } from "./AixEventCalendarToolbarNavButtons"

export type AixEventCalendarToolbarContainerProps = {
  children: ReactNode
  className?: string
}

export const AixEventCalendarToolbarContainer = ({ ...p }: AixEventCalendarToolbarContainerProps) => {
  return (
    <div className={cn("flex items-center px-4 border-b min-h-[var(--sidebar-header-height)]", p.className)}>
      {p.children}
    </div>
  )
}

/**
 * Default toolbar for the event calendar. You can override this component by passing a custom toolbar to the EventCalendar component.
 * @param p - ToolbarProps
 * @returns Toolbar
 */
export const AixEventCalendarDefaultToolbar = (p: ToolbarProps) => {
  return (
    <AixEventCalendarToolbarContainer className="flex justify-between items-center">
      <p className="font-semibold">{dayjs(p.date).format("MMMM YYYY")}</p>

      <AixEventCalendarDefaultViewToggle views={p.views} view={p.view} onView={p.onView} />

      <AixEventCalendarToolbarNavButtons onNavigate={p.onNavigate} />
    </AixEventCalendarToolbarContainer>
  )
}
