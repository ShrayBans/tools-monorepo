import type { KeyboardEvent as ReactKeyboardEvent } from "react"
import { every, join, replace, some } from "lodash-es"

// export const toTitleCase = (str: string) => str.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())

/** get the full combination with separator */
export const getHotkey = (keys: string[], combinationKey = "+"): string => {
  const isMacOS = /Mac|iPod|iPhone|iPad/.test(navigator.userAgent)

  let shortcut = join(keys, combinationKey)

  shortcut = replace(shortcut, /(opt)/g, "alt")

  if (!isMacOS) {
    shortcut = replace(shortcut, /(meta)/g, (match) => {
      if (match === "meta") return "ctrl"
      return match
    })
  }

  return shortcut
}

export const isHotkeyActive = (e: ReactKeyboardEvent | KeyboardEvent, keys: string[]): boolean => {
  const isMacOS = /Mac|iPod|iPhone|iPad/.test(navigator.userAgent)

  return every(keys, (key) => {
    if (key === "meta") {
      return isMacOS ? e.metaKey : e.ctrlKey
    }
    if (key === "shift") {
      return e.shiftKey
    }
    return e.key?.toLowerCase?.() === key.toLowerCase()
  })
}

export const ignoreHotkeyOnKeyboardEvent = (e: ReactKeyboardEvent | KeyboardEvent, hotkeyGroup: string[][]) => {
  const allKeysPressed = some(hotkeyGroup, (keys) => isHotkeyActive(e, keys))

  if (allKeysPressed) {
    e.preventDefault()
  }
}
