import { capitalize, map, size } from "lodash-es"
import { ToolbarProps, View } from "react-big-calendar"
import { ToggleGroup, ToggleGroupItem } from "../../shadcnBase"

type AixEventCalendarDefaultViewToggleProps = Pick<ToolbarProps, "views" | "view" | "onView">

export const AixEventCalendarDefaultViewToggle = (p: AixEventCalendarDefaultViewToggleProps) => {
  if (size(p.views) < 2) return null

  return (
    <ToggleGroup
      type="single"
      variant="outlinePrimary"
      size="sm"
      value={p.view}
      onValueChange={(value) => p.onView(value as View)}
    >
      {map(p.views, (view) => (
        <ToggleGroupItem key={view} value={view} className="px-4">
          {capitalize(view as View)}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
