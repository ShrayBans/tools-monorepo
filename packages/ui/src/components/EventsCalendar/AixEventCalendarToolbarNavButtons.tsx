import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { Navigate, ToolbarProps } from "react-big-calendar"
import { Button } from ".."
import { cn } from "../../lib"

export type AixEventCalendarToolbarNavButtonsProps = { className?: string } & Pick<ToolbarProps, "onNavigate">

// https://github.com/jquense/react-big-calendar/issues/818
export const AixEventCalendarToolbarNavButtons = ({ ...p }: AixEventCalendarToolbarNavButtonsProps) => {
  const goToBack = () => {
    p.onNavigate(Navigate.PREVIOUS)
  }

  const goToNext = () => {
    p.onNavigate(Navigate.NEXT)
  }

  const goToToday = () => {
    p.onNavigate(Navigate.TODAY)
  }

  return (
    <div className={cn("flex items-center", p.className)}>
      <Button size="iconSm" variant="ghost" onClick={goToBack} leftIcon={<ChevronLeft size={16} />} />

      <Button size="iconSm" variant="ghost" onClick={goToToday} leftIcon={<Calendar size={16} />} />

      <Button size="iconSm" variant="ghost" onClick={goToNext} leftIcon={<ChevronRight size={16} />} />
    </div>
  )
}
