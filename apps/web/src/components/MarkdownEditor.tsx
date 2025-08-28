import MDEditor from "@uiw/react-md-editor"
import React, { useCallback, useEffect, useState } from "react"

import { useDebounce } from "../hooks/useDebounce"

interface MarkdownEditorProps {
  value: string
  onSave: (value: string) => void
  placeholder?: string
  title?: string
  height?: number
  readonly?: boolean
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onSave,
  placeholder = "Start writing...",
  title,
  height = 400,
  readonly = false,
}) => {
  const [localValue, setLocalValue] = useState(value)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Debounce the local value changes
  const debouncedValue = useDebounce(localValue, 3000)

  // Update local value when external value changes
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Save when debounced value changes (and it's different from the original)
  useEffect(() => {
    if (debouncedValue !== value && debouncedValue !== undefined && debouncedValue.trim() !== value.trim()) {
      setIsSaving(true)
      try {
        onSave(debouncedValue)
        setLastSaved(new Date())
      } finally {
        setIsSaving(false)
      }
    }
  }, [debouncedValue, value])

  const handleChange = useCallback((val?: string) => {
    setLocalValue(val || "")
  }, [])

  const hasUnsavedChanges = localValue !== value

  return (
    <div className="flex flex-col h-full">
      {title && (
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
          <h3 className="text-lg font-semibold ">{title}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {isSaving && (
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                Saving...
              </span>
            )}
            {!isSaving && hasUnsavedChanges && (
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                Unsaved changes
              </span>
            )}
            {!isSaving && !hasUnsavedChanges && lastSaved && (
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0">
        <MDEditor
          value={localValue}
          onChange={handleChange}
          height={height}
          preview={readonly ? "preview" : "edit"}
          hideToolbar={readonly}
          visibleDragbar={false}
          textareaProps={{
            placeholder,
            style: { fontSize: 14, lineHeight: 1.5 },
          }}
          data-color-mode="light"
        />
      </div>
    </div>
  )
}

export default MarkdownEditor
