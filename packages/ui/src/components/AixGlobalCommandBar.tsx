import { useAtom } from "jotai"
import { atom } from "jotai"
import { last } from "lodash-es"
import React, { forwardRef, useEffect, useMemo, useState } from "react"

import { cn } from "../lib"
import { CommandDialog, CommandEmpty, CommandInput, CommandItem as CommandItemBase, CommandList } from "../shadcnBase"
import { AixKeyboardShortcutKeys } from "./AixKeyboardShortcut"

import type { ComponentPropsWithoutRef, PropsWithChildren, ReactNode } from "react"
export const commandBarOpenAtom = atom(false)
export const globalCmdBarInstanceAtom = atom<string[]>([])

export const commandBarIconCn = "mr-2 !h-[14px] !w-[14px]"

type AixCommandItemProps = Pick<ComponentPropsWithoutRef<typeof CommandItemBase>, "onSelect" | "value" | "disabled"> & {
  icon?: ReactNode
  name?: string
  shortCutKeys?: string[]
  className?: string
  onSelectNewTab?: () => void
}

export const AixCommandItem = forwardRef<HTMLDivElement, PropsWithChildren<AixCommandItemProps>>(({ ...p }, ref) => {
  const itemRef = React.useRef<HTMLDivElement>(null)
  React.useImperativeHandle(ref, () => itemRef.current as HTMLDivElement)

  useEffect(() => {
    const element = (itemRef as React.RefObject<HTMLDivElement>)?.current
    if (!element || !p.onSelectNewTab) return

    const handleSelectNewTab = (event: CustomEvent) => {
      p.onSelectNewTab?.()
    }

    element.addEventListener("selectNewTab", handleSelectNewTab as EventListener)

    return () => {
      element.removeEventListener("selectNewTab", handleSelectNewTab as EventListener)
    }
  }, [p.onSelectNewTab])

  return (
    <CommandItemBase
      onSelect={p.onSelect}
      value={p.value}
      disabled={p.disabled}
      className={cn("cursor-pointer !py-[6px]", p.className)}
      ref={itemRef}
      data-onselect-newtab={p.onSelectNewTab ? "true" : "false"}
    >
      {p.children || (
        <>
          {p.icon}

          <span className="!text-[13px] text-sm">{p.name}</span>

          {!!p.shortCutKeys && <AixKeyboardShortcutKeys className="ml-auto" keys={p.shortCutKeys} />}
        </>
      )}
    </CommandItemBase>
  )
})

// AixCommandItem.commandBarIconCn = commandBarIconCn

type AixGlobalCommandBarProps = PropsWithChildren<{ name: string }>

export const AixGlobalCommandBar = ({ name, ...p }: AixGlobalCommandBarProps) => {
  const [commandBarOpen, setCommandBarOpen] = useAtom(commandBarOpenAtom)

  const [globalCmdBarInstances, setGlobalCmdBarInstance] = useAtom(globalCmdBarInstanceAtom)
  const [search, setSearch] = useState("")

  const currentCmdBarInstance = useMemo(() => last(globalCmdBarInstances), [globalCmdBarInstances])

  useEffect(() => {
    if (commandBarOpen) {
      setSearch("")
    }
  }, [commandBarOpen])

  useEffect(() => {
    setGlobalCmdBarInstance((prev) => {
      const iSet = new Set<string>(prev)
      iSet.add(name)
      return Array.from(iSet)
    })

    return () => {
      setGlobalCmdBarInstance((prev) => {
        const iSet = new Set<string>(prev)
        iSet.delete(name)
        return Array.from(iSet)
      })
    }
  }, [name, setGlobalCmdBarInstance])

  if (currentCmdBarInstance !== name) return null

  return (
    <CommandDialog
      open={commandBarOpen}
      onOpenChange={setCommandBarOpen}
      onKeyDown={(e) => {
        // Handle ESC key to close dialog
        if (e.key === "Escape") {
          setCommandBarOpen(false)
        }

        // Handle Cmd+Enter (or Ctrl+Enter on Windows) to open in new tab
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault()
          e.stopPropagation()

          // Find the currently selected/focused command item
          const selectedItem = document.querySelector('[data-selected="true"]') as HTMLElement
          if (selectedItem && selectedItem.getAttribute("data-onselect-newtab") === "true") {
            // Find the parent AixCommandItem and trigger its onSelectNewTab
            const commandItem = selectedItem.closest("[data-onselect-newtab]") as HTMLElement
            if (commandItem) {
              // We'll need to store the callback somewhere accessible
              const itemValue = commandItem.getAttribute("data-value")
              // Trigger a custom event that can be caught by the command item
              commandItem.dispatchEvent(new CustomEvent("selectNewTab", { detail: { value: itemValue } }))
            }
          }
        }
      }}
    >
      <CommandInput value={search} onValueChange={setSearch} placeholder="Type a command or search..." />

      <CommandList className="max-h-[60vh]">
        <CommandEmpty>No results found.</CommandEmpty>
        {p.children}
      </CommandList>
    </CommandDialog>
  )
}

AixGlobalCommandBar.displayName = "GlobalCommandBar"
