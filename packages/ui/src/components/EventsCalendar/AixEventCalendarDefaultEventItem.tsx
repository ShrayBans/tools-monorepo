import dayjs from "dayjs"
import { EventProps } from "react-big-calendar"

type AixEventCalendarDefaultEventItemProps = EventProps

export const AixEventCalendarDefaultEventItem = (p: AixEventCalendarDefaultEventItemProps) => {
  return (
    <div className="flex items-center text-xs gap-0.5">
      <span className="flex-1 line-clamp-1">{p.event.title}</span>
      <span className="hidden text-primary-foreground/60 sm:block">{dayjs(p.event.start).format("hA")}</span>
    </div>
  )
}
