

import { cn } from "../lib"
import { motion, MotionProps, useScroll } from "framer-motion"
import React from "react"

interface ScrollProgressProps extends Omit<React.HTMLAttributes<HTMLElement>, keyof MotionProps> {}

export const ScrollProgress = React.forwardRef<HTMLDivElement, ScrollProgressProps>(({ className, ...p }, ref) => {
  const { scrollYProgress } = useScroll()

  return (
    <motion.div
      ref={ref}
      className={cn(
        "fixed inset-x-0 top-0 z-50 h-px origin-left bg-gradient-to-r from-[#d253c4] via-[#48348f] to-[#1db6ca]",
        className,
      )}
      style={{
        scaleX: scrollYProgress,
      }}
      {...p}
    />
  )
})

ScrollProgress.displayName = "ScrollProgress"
