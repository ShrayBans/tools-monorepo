import dayjs from "dayjs"
import { includes, split } from "lodash-es"

/**
 *
 * @param time12 12 hour format 10:00 AM
 * @returns date
 */
export const convertTo24HourFormat = (time12?: string): string => {
  // Split the time into hours, minutes, and AM/PM
  const [timePart = "", period] = split(time12, " ")
  const [hours = "", minutes] = timePart.split(":")

  // Convert the hours to a number
  let hour = Number.parseInt(hours, 10)

  // Handle midnight (12:00 AM) and noon (12:00 PM)
  if (period === "AM" && hour === 12) {
    hour = 0 // 12:00 AM is 0:00 in 24-hour format
  } else if (period === "PM" && hour !== 12) {
    hour += 12 // Add 12 hours to convert to 24-hour format
  }

  // Create the 24-hour time string
  const time24 = `${String(hour).padStart(2, "0")}:${minutes}`

  return time24
}

export const setTimeToDate = (date: Date, time12?: string): Date => {
  const time24 = convertTo24HourFormat(time12)
  const [hh = 1, mm = 0] = split(time24, ":").map(Number)

  const tempD = dayjs(date).hour(hh).minute(mm)

  return tempD.toDate()
}

export const isTime12Valid = (time12?: string): boolean => {
  const [t, p] = split(time12, " ")
  return !!t && !!p && !includes(t, "h") && !includes(t, "m")
}
