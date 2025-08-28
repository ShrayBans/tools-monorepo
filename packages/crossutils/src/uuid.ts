import { customAlphabet } from "nanoid"
import { v4 as uuidv4 } from "uuid"

export function generateUUID() {
  return uuidv4()
}

export const nanoid = (numChar = 7) => {
  return customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", numChar)() // 7-character random string
}
export const nanoidUpper = (numChar = 7) => {
  return customAlphabet("023456789ABCDEFGHJKLMNOPQRSTUVWXYZ", numChar)() // 7-character random string
}

export const generateSlug = (input: string, ignoreNanoid?: boolean, maxLength = 30): string => {
  let slug = input
    .trim() // Trim white spaces from start and end
    .toLowerCase() // Convert to lowercase
    .replace(/[^a-z0-9- ]/g, "") // Remove all non-alphanumeric characters except spaces and hyphens
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with a single one

  // Ensure slug isn't greater than 30 characters and doesn't cut off a word halfway
  if (slug.length > maxLength) {
    let truncatedSlug = slug.substr(0, maxLength)

    // Ensures that last character is not a hyphen
    if (truncatedSlug.endsWith("-")) {
      truncatedSlug = truncatedSlug.slice(0, -1)
    }

    slug = truncatedSlug
  }

  return `${slug}${ignoreNanoid ? "" : `-${nanoid(4)}`}`
}
