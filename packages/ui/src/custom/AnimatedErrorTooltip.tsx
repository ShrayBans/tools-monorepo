import { AnimatePresence, motion } from "framer-motion"

import { cn } from ".."

interface AnimatedErrorTooltipProps {
  message: string | null
  className?: string
}

export const AnimatedErrorTooltip = ({ message, className }: AnimatedErrorTooltipProps) => {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.2 }}
          className={cn("absolute left-0 right-0 mt-1 text-center", className)}
        >
          <span className="inline-block px-2 py-1 text-sm font-medium text-destructive bg-red-50 border border-red-200 rounded-md">
            {message}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
