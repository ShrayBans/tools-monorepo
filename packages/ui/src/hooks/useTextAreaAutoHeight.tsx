import { RefObject, useLayoutEffect, useRef } from "react"

import { useResizeObserver } from "./useResizeObserver"

export const setTextAreaAutoHeight = (textArea: HTMLTextAreaElement | null) => {
  if (!textArea) return

  textArea.style.height = "auto"
  textArea.style.height = `${textArea.scrollHeight}px`
}

export const useTextAreaAutoHeight = (textArea: RefObject<HTMLTextAreaElement>, deps: unknown[]) => {
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>()
  const { width = 0, height = 0 } = useResizeObserver({ ref: textArea, box: "border-box" })

  useLayoutEffect(() => {
    if (!textArea) return

    setTextAreaAutoHeight(textArea.current)
  }, [textArea, ...deps])

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useLayoutEffect(() => {
    clearTimeout(timeout.current)

    timeout.current = setTimeout(() => {
      if (!textArea) return

      setTextAreaAutoHeight(textArea.current)
    }, 300)
  }, [textArea, width])

  return { height }
}

export default useTextAreaAutoHeight
