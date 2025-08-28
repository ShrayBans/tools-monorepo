import { useEffect, useMemo, useState } from "react"

const screen = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
}

export type Screen = typeof screen

export interface ScreenSize {
  width: number
  height: number
}

export type Breakpoint = {
  [Property in keyof Screen]: boolean
}

export type UseScreenSizeProp = ScreenSize & {
  screen: Screen
  breakpoint: Breakpoint
  isMobile: boolean
}

export const useScreenSize = (): UseScreenSizeProp => {
  const [size, setSize] = useState<ScreenSize>({
    width: window.innerWidth,
    height: window.innerHeight,
  })

  const handleResize = () => {
    setSize({
      width: window.innerWidth,
      height: window.innerHeight,
    })
  }

  const breakpoint = useMemo(
    () => ({
      sm: size.width < screen.sm,
      md: size.width < screen.md,
      lg: size.width < screen.lg,
      xl: size.width < screen.xl,
      "2xl": size.width < screen["2xl"],
    }),

    [size],
  )

  useEffect(() => {
    // Add a listener to update breakpoint size when the window is resized
    window.addEventListener("resize", handleResize)

    // Remove the listener when the component unmounts
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  const isMobile = breakpoint?.md

  return { ...size, screen, breakpoint, isMobile }
}
