import { useCallback, useRef, useEffect } from "react"
import { debounce } from "lodash"

interface UseAutoSaveOptions<T> {
  onSave: (data: T) => void | Promise<void>
  delay?: number
  enabled?: boolean
}

export function useAutoSave<T>({ onSave, delay = 2000, enabled = true }: UseAutoSaveOptions<T>) {
  const pendingSaveRef = useRef<T | null>(null)
  
  // Create debounced save function
  const debouncedSave = useCallback(
    debounce(async (data: T) => {
      if (!enabled) return
      try {
        await onSave(data)
        pendingSaveRef.current = null
      } catch (error) {
        // Keep the pending data for retry
        console.error('Auto-save failed:', error)
      }
    }, delay),
    [onSave, delay, enabled]
  )

  // Auto-save function to be called when data changes
  const save = useCallback((data: T) => {
    if (!enabled) return
    pendingSaveRef.current = data
    debouncedSave(data)
  }, [debouncedSave, enabled])

  // Force save function for immediate saves
  const forceSave = useCallback(async () => {
    if (pendingSaveRef.current && enabled) {
      debouncedSave.cancel()
      await onSave(pendingSaveRef.current)
      pendingSaveRef.current = null
    }
  }, [onSave, debouncedSave, enabled])

  // Cancel any pending saves
  const cancelSave = useCallback(() => {
    debouncedSave.cancel()
    pendingSaveRef.current = null
  }, [debouncedSave])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedSave.cancel()
    }
  }, [debouncedSave])

  return {
    save,
    forceSave,
    cancelSave,
    hasPendingSave: pendingSaveRef.current !== null
  }
}