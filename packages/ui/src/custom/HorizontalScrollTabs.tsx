import React from "react"
import { Badge } from "../shadcnBase/ShadcnBadge"
import { ScrollArea, ScrollBar } from "../shadcnBase/ShadcnScrollArea"
import { map } from "lodash-es"

interface IHorizontalScrollTabs {
  tabs: { label: string; value: string }[]
  selectedTab: string
  setSelectedTab: (tab: string) => void
}

export const HorizontalScrollTabs: React.FC<IHorizontalScrollTabs> = ({
  tabs,
  selectedTab,
  setSelectedTab,
}: IHorizontalScrollTabs) => {
  return (
    <ScrollArea className="w-full min-w-0">
      <div className="flex gap-1 w-max px-6 py-2 [&>*]:shrink-0">
        {map(tabs, (tab) => {
          return (
            <Badge key={tab.value} variant="outline" onClick={() => setSelectedTab(tab.value)}>
              {tab.label}
            </Badge>
          )
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
