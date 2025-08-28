import { useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence, MotionConfig, Transition, Variant } from "framer-motion"
import { createPortal } from "react-dom"
import { cn } from "../lib/utils"
import { XIcon } from "lucide-react"
import React from "react"

// Context type definition
interface MorphingDialogContextType {
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
  uniqueId: string
  triggerRef: React.RefObject<HTMLDivElement>
}

// Create context
const MorphingDialogContext = React.createContext<MorphingDialogContextType | null>(null)

// Hook to use dialog context
function useMorphingDialog() {
  const context = useContext(MorphingDialogContext)
  if (!context) {
    throw new Error("useMorphingDialog must be used within a MorphingDialogProvider")
  }
  return context
}

// Provider component
type MorphingDialogProviderProps = {
  children: React.ReactNode
  transition?: Transition
  onOpen?: () => void
}

function MorphingDialogProvider({ children, transition, onOpen }: MorphingDialogProviderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const uniqueId = useId()
  const triggerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && onOpen) {
      onOpen()
    }
  }, [isOpen, onOpen])

  const contextValue = useMemo(() => ({ isOpen, setIsOpen, uniqueId, triggerRef }), [isOpen, uniqueId])

  return (
    <MorphingDialogContext.Provider value={contextValue}>
      <MotionConfig transition={transition}>{children}</MotionConfig>
    </MorphingDialogContext.Provider>
  )
}

// Main Dialog Component
type MorphingDialogProps = {
  children: React.ReactNode
  transition?: Transition
  onOpen?: () => void
}

function MorphingDialog({ children, transition, onOpen }: MorphingDialogProps) {
  return (
    <MorphingDialogProvider transition={transition} onOpen={onOpen}>
      <MotionConfig transition={transition}>{children}</MotionConfig>
    </MorphingDialogProvider>
  )
}

// Trigger Component
type MorphingDialogTriggerProps = {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  triggerRef?: React.RefObject<HTMLDivElement>
  onClick?: () => void
}

function MorphingDialogTrigger({ children, className, style, triggerRef, onClick }: MorphingDialogTriggerProps) {
  const { setIsOpen, isOpen, uniqueId } = useMorphingDialog()

  const handleClick = useCallback(() => {
    setIsOpen(!isOpen)
    onClick?.()
  }, [isOpen, setIsOpen, onClick])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault()
        setIsOpen(!isOpen)
      }
    },
    [isOpen, setIsOpen],
  )

  return (
    <motion.div
      ref={triggerRef}
      layoutId={`dialog-${uniqueId}`}
      className={cn("relative cursor-pointer", className)}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      style={style}
      role="button"
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      aria-controls={`motion-ui-morphing-dialog-content-${uniqueId}`}
    >
      {children}
    </motion.div>
  )
}

// Content Component
type MorphingDialogContentProps = {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

function MorphingDialogContent({ children, className, style }: MorphingDialogContentProps) {
  const { setIsOpen, isOpen, uniqueId, triggerRef } = useMorphingDialog()
  const containerRef = useRef<HTMLDivElement>(null)
  const [firstFocusableElement, setFirstFocusableElement] = useState<HTMLElement | null>(null)
  const [lastFocusableElement, setLastFocusableElement] = useState<HTMLElement | null>(null)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
      if (event.key === "Tab") {
        if (!firstFocusableElement || !lastFocusableElement) return

        if (event.shiftKey) {
          if (document.activeElement === firstFocusableElement) {
            event.preventDefault()
            lastFocusableElement.focus()
          }
        } else {
          if (document.activeElement === lastFocusableElement) {
            event.preventDefault()
            firstFocusableElement.focus()
          }
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [setIsOpen, firstFocusableElement, lastFocusableElement])

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("overflow-hidden")
      const focusableElements = containerRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (focusableElements && focusableElements.length > 0) {
        setFirstFocusableElement(focusableElements[0] as HTMLElement)
        setLastFocusableElement(focusableElements[focusableElements.length - 1] as HTMLElement)
        ;(focusableElements[0] as HTMLElement).focus()
      }
    } else {
      document.body.classList.remove("overflow-hidden")
      triggerRef.current?.focus()
    }
  }, [isOpen, triggerRef])

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    },
    [setIsOpen],
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, handleClickOutside])

  return (
    <motion.div
      ref={containerRef}
      layoutId={`dialog-${uniqueId}`}
      className={cn("overflow-hidden", className)}
      style={style}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`motion-ui-morphing-dialog-title-${uniqueId}`}
      aria-describedby={`motion-ui-morphing-dialog-description-${uniqueId}`}
    >
      {children}
    </motion.div>
  )
}

// Container Component
type MorphingDialogContainerProps = {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

function MorphingDialogContainer({ children }: MorphingDialogContainerProps) {
  const { isOpen, uniqueId } = useMorphingDialog()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence initial={false} mode="sync">
      {isOpen && (
        <>
          <motion.div
            key={`backdrop-${uniqueId}`}
            className="fixed inset-0 h-full w-full bg-white/40 backdrop-blur-sm dark:bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center">{children}</div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}

// Title Component
type MorphingDialogTitleProps = {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

function MorphingDialogTitle({ children, className, style }: MorphingDialogTitleProps) {
  const { uniqueId } = useMorphingDialog()

  return (
    <motion.div layoutId={`dialog-title-container-${uniqueId}`} className={className} style={style} layout>
      {children}
    </motion.div>
  )
}

// Subtitle Component
type MorphingDialogSubtitleProps = {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

function MorphingDialogSubtitle({ children, className, style }: MorphingDialogSubtitleProps) {
  const { uniqueId } = useMorphingDialog()

  return (
    <motion.div layoutId={`dialog-subtitle-container-${uniqueId}`} className={className} style={style}>
      {children}
    </motion.div>
  )
}

// Description Component
type MorphingDialogDescriptionProps = {
  children: React.ReactNode
  className?: string
  disableLayoutAnimation?: boolean
  variants?: {
    initial: Variant
    animate: Variant
    exit: Variant
  }
}

function MorphingDialogDescription({
  children,
  className,
  variants,
  disableLayoutAnimation,
}: MorphingDialogDescriptionProps) {
  const { uniqueId } = useMorphingDialog()

  return (
    <motion.div
      key={`dialog-description-${uniqueId}`}
      layoutId={disableLayoutAnimation ? undefined : `dialog-description-content-${uniqueId}`}
      variants={variants}
      className={className}
      initial="initial"
      animate="animate"
      exit="exit"
      id={`dialog-description-${uniqueId}`}
    >
      {children}
    </motion.div>
  )
}

// Image Component
type MorphingDialogImageProps = {
  src: string
  alt: string
  className?: string
  style?: React.CSSProperties
}

function MorphingDialogImage({ src, alt, className, style }: MorphingDialogImageProps) {
  const { uniqueId } = useMorphingDialog()

  return <motion.img src={src} alt={alt} className={cn(className)} layoutId={`dialog-img-${uniqueId}`} style={style} />
}

// Close Component
type MorphingDialogCloseProps = {
  children?: React.ReactNode
  className?: string
  variants?: {
    initial: Variant
    animate: Variant
    exit: Variant
  }
}

function MorphingDialogClose({ children, className, variants }: MorphingDialogCloseProps) {
  const { setIsOpen, uniqueId } = useMorphingDialog()

  const handleClose = useCallback(() => {
    setIsOpen(false)
  }, [setIsOpen])

  return (
    <motion.button
      onClick={handleClose}
      type="button"
      aria-label="Close dialog"
      key={`dialog-close-${uniqueId}`}
      className={cn("absolute right-6 top-6", className)}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
    >
      {children || <XIcon size={24} />}
    </motion.button>
  )
}

export {
  MorphingDialog,
  MorphingDialogTrigger,
  MorphingDialogContainer,
  MorphingDialogContent,
  MorphingDialogClose,
  MorphingDialogTitle,
  MorphingDialogSubtitle,
  MorphingDialogDescription,
  MorphingDialogImage,
}
