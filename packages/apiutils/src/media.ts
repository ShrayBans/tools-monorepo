export const getMediaType = (url: string) => {
  const fileType = url.split(".").pop()?.toLowerCase()
  switch (fileType) {
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
      return "image"
    case "mp4":
    case "avi":
    case "mov":
    case "webm":
    case "ogg":
    case "m4v":
    case "x-msvideo":
    case "x-ms-wmv":
    case "mpeg":
    case "quicktime":
    case "x-matroska":
    case "x-flv":
      return "video"
    case "mp3":
    case "m4a":
    case "wav":
    case "flac":
    case "aac":
    case "x-m4a":
    case "x-caf":
    case "x-wav":
    case "x-aiff":
    case "aiff":
      return "audio"
    case "pdf":
      return "pdf"
    default:
      return "text"
  }
}
