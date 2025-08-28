import { ElementType, forwardRef, useImperativeHandle, useLayoutEffect, useRef } from "react"
import type { InputProps as BasInputProps } from "../shadcnBase"
import { Input as BaseInput, inputCn } from "../shadcnBase"
import { cn } from ".."
import { Edit2 } from "lucide-react"

export type EditableTextProps = BasInputProps & {
  outerClassName?: string
  displayAs?: ElementType
  iconSize?: number
}

export const EditableText = forwardRef<HTMLInputElement, EditableTextProps>(
  ({ className, outerClassName, iconSize = 14, displayAs: Tag = "span", ...p }, ref) => {
    const inputRef = useRef<HTMLInputElement | null>(null)
    const spanRef = useRef<HTMLSpanElement | null>(null)

    useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

    useLayoutEffect(() => {
      if (inputRef.current && spanRef.current) inputRef.current.style.maxWidth = `${spanRef.current?.offsetWidth}px`
    }, [p.value])

    return (
      <div className={cn("relative flex items-center group gap-1 w-full", outerClassName)}>
        <BaseInput
          className={cn(
            "p-0 px-1.5 h-auto border-none bg-transparent focus-visible:bg-input focus-visible:border-none focus-visible:ring-0",
            className,
          )}
          ref={inputRef}
          {...p}
        />

        <span
          ref={spanRef}
          className={cn(
            inputCn,
            "invisible max-w-full line-clamp-1 w-auto whitespace-nowrap absolute left-0 p-0 px-1.5 h-auto border-none bg-transparent",
            className,
          )}
        >
          {p.value || p.placeholder}
        </span>

        <Edit2 size={iconSize} className="hidden text-muted-foreground right-2 group-hover:block" />
      </div>
    )
  },
)
