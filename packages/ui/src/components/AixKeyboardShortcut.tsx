import { useCallback, useMemo, useState } from "react"
import { filter, map, omit, size, capitalize } from "lodash-es"
import { ScrollArea, Sheet, SheetContent, Input } from "../shadcnBase"
import { cn, getHotkey } from "../lib"
import { atom, useAtom } from "jotai"
import { useHotkeys } from "react-hotkeys-hook"

export const keyboardShortcutAtom = atom(false)

export type KeyboardShorcutCommand = {
  name: string
  keys: string[]
}

export type KeyboardShortcutsType = {
  [key: string]: {
    name: string
    [key: string]: KeyboardShorcutCommand | any
  }
}

type GroupedShortcuts = {
  group: string
  commands: KeyboardShorcutCommand[]
}[]

export type AixKeyboardShortcutKeyProps = {
  keyboardKey: string
  className?: string
}

export const AixKeyboardShortcutKey = ({ ...p }: AixKeyboardShortcutKeyProps) => {
  const getKey = useCallback((str: string) => {
    const isApple = /(Mac|iPod|iPhone|iPad)/.test(navigator.userAgent)
    const metaOrCtrl = isApple ? "⌘" : "ctrl"
    const optOrAlt = isApple ? "⌥" : "alt"

    switch (str) {
      case "Meta":
      case "meta":
        return metaOrCtrl

      case "Shift":
      case "shift":
        return "⇧"

      case "ArrowLeft":
      case "arrowleft":
        return "⇦"

      case "ArrowRight":
      case "arrowright":
        return "⇨"

      case "Alt":
      case "alt":
        return optOrAlt

      default:
        return capitalize(str)
    }
  }, [])

  return (
    <span
      className={cn(
        "h-[17px] max-h-[17px] min-w-[18px] rounded-sm border bg-secondary px-[4px] text-center text-[10px] leading-[15px] text-muted-foreground",
        p.className,
      )}
    >
      {getKey(p.keyboardKey)}
    </span>
  )
}

export type AixKeyboardShortcutKeysProps = {
  keys: string[]
  className?: string
  keyClassName?: string
}

export const AixKeyboardShortcutKeys = ({ ...p }: AixKeyboardShortcutKeysProps) => {
  return (
    <div className={cn("flex gap-[2px]", p.className)}>
      {map(p.keys, (key: string, i) => (
        <AixKeyboardShortcutKey keyboardKey={key} key={`${key}-${i}`} className={p.keyClassName} />
      ))}
    </div>
  )
}

const partialSearchByName = (searchTerm: string, shortcuts: GroupedShortcuts) =>
  map(shortcuts, (groupItem) => ({
    group: groupItem.group,
    commands: filter(groupItem.commands, (command) => command.name.toLowerCase().includes(searchTerm.toLowerCase())),
  })).filter((groupItem) => groupItem.commands.length > 0)

type KeyboardShortcutSheetProps = {
  keyboardShorcuts: KeyboardShortcutsType
  togglekeys?: string[]
}

export const AixKeyboardShortcutSheet = ({
  keyboardShorcuts,
  togglekeys = ["meta", "/"],
}: KeyboardShortcutSheetProps) => {
  const [openKeyboardShortcut, setOpenKeyboardShortcut] = useAtom(keyboardShortcutAtom)
  const [search, setSearch] = useState("")

  const groupedShortcuts = useMemo(
    () =>
      map(keyboardShorcuts, (group) => ({
        group: group.name,
        commands: map(omit(group, "name"), (command) => ({
          name: (command as KeyboardShorcutCommand).name,
          keys: (command as KeyboardShorcutCommand).keys,
        })),
      })),
    [keyboardShorcuts],
  )

  // const groupedShortcuts = useMemo(
  //   () =>
  //     map(keyboardShorcuts, (group) => ({
  //       group: group.name, // Access the 'name' of the group
  //       commands: map(group.shortcuts, (command) => ({
  //         name: command.name, // Access the 'name' of the command
  //         keys: command.keys, // Access the 'keys' of the command
  //       })),
  //     })),
  //   [keyboardShorcuts],
  // )

  const shortcuts = useMemo(() => {
    if (search) {
      return partialSearchByName(search, groupedShortcuts)
    }

    return groupedShortcuts
  }, [search, groupedShortcuts])

  useHotkeys(
    getHotkey(togglekeys),
    () => {
      setOpenKeyboardShortcut((open) => !open)
    },
    {
      preventDefault: true,
      enableOnFormTags: true,
      enableOnContentEditable: true,
    },
  )

  return (
    <Sheet open={openKeyboardShortcut} onOpenChange={(e) => !e && setOpenKeyboardShortcut(false)} modal={false}>
      <SheetContent
        className="flex w-[350px] flex-col gap-0 border-l-0 bg-transparent p-3 shadow-none"
        closeClassName="top-[27px] right-[30px]"
      >
        <div className="flex flex-col h-full border rounded-md shadow-lg bg-background">
          <div className="flex flex-col px-3">
            <span className="px-3 pt-3 font-semibold">Keyboard Shortcuts</span>

            <Input
              className="mt-3"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
            />
          </div>

          {!size(shortcuts) && <span className="p-2 text-xs text-center text-muted-foreground">No Match</span>}

          <ScrollArea>
            <div className="flex flex-col p-3 pt-1">
              {map(shortcuts, (shortcut) => (
                <div className="flex flex-col px-3" key={`${shortcut.group}`}>
                  <span className="py-[8px] text-xs font-semibold">{shortcut.group}</span>

                  {map(shortcut.commands, (cmd, i) => (
                    <div className="flex items-center gap-1 py-[7px]" key={`${shortcut.group}-${cmd.name}-${i}`}>
                      <span className="flex-1 text-xs font-medium text-muted-foreground">{cmd.name}</span>

                      <AixKeyboardShortcutKeys key={`${shortcut.group}-${cmd.name}-${i}-keys`} keys={cmd.keys} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  )
}
