export const checkYouTubeForId = (url = "") => {
  if (!url) return null

  // Remove any leading/trailing whitespace and convert to lowercase
  const formattedUrl = url.trim()

  // Array of regular expressions to match different YouTube URL formats
  const patterns = [
    // youtu.be URLs (official short URLs, without www)
    /^(?:https?:\/\/)?(?:youtu\.be|yt\.be)\/([a-zA-Z0-9_-]{11})/,
    // Shortened URLs with additional parameters (without www)
    /^(?:https?:\/\/)?(?:youtu\.be|yt\.be)\/([a-zA-Z0-9_-]{11})(?:[\?&].*)?$/,
    // Shortened URLs with additional watch parameters (without www)
    /^(?:https?:\/\/)?(?:youtu\.be|yt\.be)\/watch\?(?:.*&)?v=([a-zA-Z0-9_-]{11})(?:[\?&].*)?$/,
    // Standard watch URLs
    /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    // Embed URLs
    /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    // Standard watch URLs with additional parameters
    /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?(?:.*&)?v=([a-zA-Z0-9_-]{11})(?:[\?&].*)?$/,
    // URLs with attribution_link
    /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/attribution_link\?(?:.*&)?u=%2Fwatch%3Fv%3D([a-zA-Z0-9_-]{11})(?:[\?&].*)?$/,
    // Playlist URLs
    /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/playlist\?(?:.*&)?list=([a-zA-Z0-9_-]{34})/,
    // Channel URLs
    /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:channel|user|c)\/([a-zA-Z0-9_-]+)/,
    // Shorts URLs
    /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([\w_-]+)$/,
  ]

  // Test the URL against each pattern
  for (const pattern of patterns) {
    const match = formattedUrl.match(pattern)
    if (match?.[1]) {
      // For playlist and channel URLs, we return the playlist ID or channel ID
      if (match[1].length === 34 || match[1].length > 11) {
        return match[1]
      }
      // For video IDs, we ensure it's exactly 11 characters
      if (match[1].length === 11) {
        return match[1]
      }
    }
  }

  // console.log("No match found for YouTube ID", formattedUrl)

  // If no match is found, return null
  return null
}

/**
 * Decodes HTML entities in a string - useful for YouTube Transcript from YouTubeTranscript API
 */
export function decodeYouTubeHTMLEntities(text: string) {
  let decodedText = text

  // Use a single replace call for each entity
  decodedText = decodedText.replace(/&quot;/g, '"')
  decodedText = decodedText.replace(/&#39;/g, "'")
  decodedText = decodedText.replace(/&amp;#39;/g, "'")
  decodedText = decodedText.replace(/&amp;quot;/g, '"')

  return decodedText
}
