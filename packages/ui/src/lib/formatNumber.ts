/**
 * Formats a number using metric suffixes:
 *  123     -> "123"
 *  1500    -> "1.5k"
 *  10000   -> "10k"
 *  1234567 -> "1.2M"
 */
export const abbreviateNumber = (value: number, toFixed = 1): string => {
  const suffixes = ["", "k", "M", "B", "T", "P", "E"]
  let newValue = value
  let suffixIndex = 0

  // Scale down by 1,000 until we're below that threshold
  while (Math.abs(newValue) >= 1000 && suffixIndex < suffixes.length - 1) {
    newValue /= 1000
    suffixIndex++
  }

  // Format with one decimal if needed, then remove trailing ".0"
  const formatted = newValue.toFixed(toFixed).replace(/\.0+$/, "")

  return `${formatted}${suffixes[suffixIndex]}`
}

/**
 * Formats a number with comma separators for thousands, millions, etc.
 * Examples:
 *  1234     -> "1,234"
 *  1234567  -> "1,234,567"
 *  3600     -> "3,600"
 */
export const formatNumberWithCommas = (value: number): string => {
  return value.toLocaleString()
}
