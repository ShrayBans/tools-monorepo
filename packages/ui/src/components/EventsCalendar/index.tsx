import dayjs from "dayjs"
import { ComponentPropsWithRef } from "react"
import { Calendar, Event, Views, dayjsLocalizer, CalendarProps } from "react-big-calendar"
import withDragAndDrop, { withDragAndDropProps } from "react-big-calendar/lib/addons/dragAndDrop"
import { cn } from "../../lib"
import { AixEventCalendarDefaultEventItem } from "./AixEventCalendarDefaultEventItem"
import { AixEventCalendarDefaultShowMoreBtn } from "./AixEventCalendarDefaultShowMoreBtn"
import { AixEventCalendarDefaultToolbar, AixEventCalendarToolbarContainer } from "./AixEventCalendarDefaultToolbar"
import { AixEventCalendarDefaultViewToggle } from "./AixEventCalendarDefaultViewToggle"
import { AixEventCalendarToolbarNavButtons } from "./AixEventCalendarToolbarNavButtons"

type DragAndDropCalendarProps<TEvent extends object = Event, TResource extends object = object> = 
  CalendarProps<TEvent, TResource> & withDragAndDropProps<TEvent, TResource>

const DnDCalendar = withDragAndDrop(Calendar) as React.ComponentType<DragAndDropCalendarProps<Event, object>>
const localizer = dayjsLocalizer(dayjs)

type DndCalendarProps = ComponentPropsWithRef<typeof DnDCalendar>

export interface AixEventCalendarProps {
  /** Array of calendar events to display */
  events?: Event[]
  /** Optional className to apply custom styles */
  className?: string
  /** Custom toolbar component to override default */
  toolbar?: NonNullable<DndCalendarProps["components"]>["toolbar"]
  /** Custom event component to override default event rendering */
  event?: NonNullable<DndCalendarProps["components"]>["event"]
  /** Callback fired when an event is clicked */
  onSelectEvent?: (event: Event) => void
  /** Callback fired when an event is dragged and dropped to a new time */
  onEventDrop?: DndCalendarProps["onEventDrop"]
  /** Callback fired when an empty calendar slot is clicked */
  onSelectSlot?: DndCalendarProps["onSelectSlot"]
  /** Callback fired when the calendar range changes (navigation, view change) */
  onRangeChange?: DndCalendarProps["onRangeChange"]
  /** Array of calendar view types to enable. Defaults to ['month'] */
  views?: DndCalendarProps["views"]
  /** Enable selection of calendar slots. Defaults to false */
  selectable?: boolean
}

export const AixEventCalendar = ({
  events,
  className,
  toolbar,
  views = ["month"],
  event: calendarEvent,
  selectable = false,
  ...p
}: AixEventCalendarProps) => {
  return (
    <DnDCalendar
      className={cn(className, "min-h-[100dvh] shrink bg-background")}
      defaultView={Views.MONTH}
      localizer={localizer}
      events={events}
      components={{
        toolbar: toolbar || AixEventCalendarDefaultToolbar,
        event: calendarEvent || AixEventCalendarDefaultEventItem,
        showMore: (props) => <AixEventCalendarDefaultShowMoreBtn {...props} onSelectEvent={p.onSelectEvent} />,
      }}
      views={views}
      resizable={false}
      doShowMoreDrillDown={false}
      selectable={selectable}
      {...p}
    />
  )
}

export { AixEventCalendarDefaultViewToggle, AixEventCalendarToolbarContainer, AixEventCalendarToolbarNavButtons }
