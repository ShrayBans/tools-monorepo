import { ChevronDown } from "lucide-react"
import dayjs from "dayjs"
import { map } from "lodash-es"
import { Fragment } from "react"
import { Event as EventType, ShowMoreProps } from "react-big-calendar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../shadcnBase"

type AixEventCalendarDefaultShowMoreBtnProps = ShowMoreProps & { onSelectEvent?: (event: EventType) => void }

export const AixEventCalendarDefaultShowMoreBtn = (p: AixEventCalendarDefaultShowMoreBtnProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center justify-center w-full gap-0.5 text-xs font-semibold">
        <span className="hidden sm:block">{`${p.count} More`}</span>
        <ChevronDown size={14} />
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-full max-w-[150px] p-0">
        {map(p.remainingEvents, (event, i) => (
          <Fragment key={`EventCalendarDefaultShowMoreBtn-${i}`}>
            <DropdownMenuItem className="text-xs" onClick={() => p.onSelectEvent?.(event)}>
              <span className="flex-1">{event.title}</span>
              <span className="text-muted-foreground">{dayjs(event.start).format("hA")}</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-0" />
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
