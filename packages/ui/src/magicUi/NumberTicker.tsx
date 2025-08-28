import { useInView, useMotionValue, useSpring } from "framer-motion"
import { useEffect, useRef } from "react"

import { cn } from "../.."

export default function NumberTicker({
  value,
  direction = "up",
  delay = 0,
  className,
  // Add a new prop for animation duration
  duration = 1000, // Default duration in milliseconds
}: {
  value: number
  direction?: "up" | "down"
  className?: string
  delay?: number // delay in s
  duration?: number // New prop for animation duration
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(direction === "down" ? value : 0)
  const springValue = useSpring(motionValue, {
    // Adjust these values for faster animation
    damping: 45, // Reduced from 60
    stiffness: 200, // Increased from 100
    duration: duration, // Use the new duration prop
  })
  const isInView = useInView(ref, { once: true, margin: "0px" })

  useEffect(() => {
    isInView &&
      setTimeout(() => {
        motionValue.set(direction === "down" ? 0 : value)
      }, delay * 1000)
  }, [motionValue, isInView, delay, value, direction])

  useEffect(
    () =>
      springValue.on("change", (latest) => {
        if (ref.current) {
          ref.current.textContent = Intl.NumberFormat("en-US").format(Number(latest.toFixed(0)))
        }
      }),
    [springValue],
  )

  return (
    <span className={cn("inline-block tabular-nums text-black dark:text-white tracking-wider", className)} ref={ref} />
  )
}
