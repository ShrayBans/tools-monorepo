import type { FC } from "react"
import { size, split } from "lodash-es"
import type { NumberFormatValues, OnValueChange } from "react-number-format"
import { PatternFormat } from "react-number-format"

import { cn, convertTo24HourFormat, isTime12Valid } from "../lib"
import { inputCn } from "../shadcnBase"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../shadcnBase/ShadcnSelect"

export type TimePeriod = "AM" | "PM"

interface TimePickerProps {
  className?: string
  value?: string
  onChange?: (time: {
    time12: string
    time24: string
    isValid: boolean
  }) => void
  disabled?: boolean
}

export const TimePicker: FC<TimePickerProps> = ({ ...p }) => {
  const [time = "", period = "AM"] = split(p.value, " ")

  const onChange = (t: string, pr: string) => {
    const time12 = `${t ?? ""} ${pr}`

    const isValid = isTime12Valid(time12)

    p.onChange?.({ time12, time24: convertTo24HourFormat(time12), isValid })
  }

  const handleValueChange: OnValueChange = ({ formattedValue }) => {
    onChange(formattedValue, period)
  }

  const isAllowed = ({ value }: NumberFormatValues) => {
    const hhStr = value.slice(0, 2)
    const mmStr = value.slice(2, 4)
    const hh = Number.parseInt(hhStr)
    const mm = Number.parseInt(mmStr)

    if (
      (size(hhStr) === 1 && hh > 1) ||
      (size(hhStr) > 1 && (hh > 12 || hh < 1)) ||
      (size(mmStr) === 1 && mm > 5) ||
      (size(mmStr) > 1 && mm > 59)
    )
      return false

    return true
  }

  return (
    <div className={cn("flex gap-2", p.className)}>
      <PatternFormat
        className={inputCn}
        value={time}
        onValueChange={handleValueChange}
        format="##:##"
        mask={["h", "h", "m", "m"]}
        placeholder="hh:mm"
        isAllowed={isAllowed}
        disabled={p.disabled}
      />

      <Select disabled={p.disabled}>
        <SelectTrigger className="w-[90px]">
          <SelectValue>{period}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="AM">AM</SelectItem>
          <SelectItem value="PM">PM</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
