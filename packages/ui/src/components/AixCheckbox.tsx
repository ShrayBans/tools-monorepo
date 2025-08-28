import type { ComponentPropsWithoutRef, ReactNode } from "react"
import { forwardRef } from "react"

import { cn } from "../lib"
import { Checkbox } from "../shadcnBase"

export type AixCheckboxProps = ComponentPropsWithoutRef<typeof Checkbox> & {
  label: ReactNode
  secondaryLabel?: ReactNode
  containerClassName?: string
}

export const AixCheckbox = forwardRef<HTMLButtonElement, AixCheckboxProps>(
  ({ label = "Check me", secondaryLabel = "", containerClassName, className, ...props }, ref) => {
    return (
      <div className={cn("items-top flex space-x-2", containerClassName)}>
        <Checkbox
          ref={ref}
          checked={!!props?.value || props?.checked}
          className={cn("mt-[2px]", className)}
          {...props}
        />

        <label
          htmlFor={props.id}
          className="flex flex-col leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          <span className="text-sm font-medium">{label}</span>

          <span className="text-sm text-muted-foreground">{secondaryLabel}</span>
        </label>
      </div>
    )
  },
)

AixCheckbox.displayName = "shrayCheckbox"

/**
 * USAGE
 *
 *
  <FormField
    control={form.control}
    name="check"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Generate Topics about...</FormLabel>
        <FormControl>
          <Checkbox
            label={"check"}
            secondaryLabel={"Another one"}
            onCheckedChange={(e) => {
              form.setValue("check", e);
            }}
            {...field}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
 */
