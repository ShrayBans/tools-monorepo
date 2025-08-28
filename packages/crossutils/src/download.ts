/**
 * Downloads a file from a URL using browser APIs
 * Handles both modern browsers and IE/Edge cases
 */
export const downloadBrowserFile = async ({
  url,
  filename,
  onSuccess,
  onError,
}: {
  url: string
  filename?: string
  onSuccess?: () => void
  onError?: (errorMsg: string) => void
}) => {
  try {
    // Extract the path after cdn.inkvision.ai
    const cdnPath = url.split("cdn.inkvision.ai/")[1]
    if (!cdnPath) {
      onError?.("Invalid CDN URL")
      return
    }
    url = `/cdn/${cdnPath}`
    // Fetch the file data

    const blob = await fetch(url)
      .then((response) => {
        console.log("response", response)

        return response.blob()
      })
      .then((blob) => {
        console.log("Successfully fetched the image")
        // Do something with the blob

        return blob
      })
      .catch((error) => console.error("Error:", error))

    if (!blob) {
      onError?.("Failed to fetch the image")
      return
    }

    // Get filename from URL if not provided
    const defaultFilename = url.split("/").pop() || "download"
    const finalFilename = filename || defaultFilename

    // IE/Edge support
    // @ts-ignore
    if (typeof window.navigator.msSaveBlob !== "undefined") {
      // @ts-ignore
      window.navigator.msSaveBlob(blob, finalFilename)
      onSuccess?.()
      return
    }

    // Modern browsers
    const blobURL = window.URL.createObjectURL(blob)
    const tempLink = document.createElement("a")
    tempLink.style.display = "none"
    tempLink.href = blobURL
    tempLink.setAttribute("download", finalFilename)
    tempLink.setAttribute("target", "_blank")

    document.body.appendChild(tempLink)
    tempLink.click()

    // Cleanup
    document.body.removeChild(tempLink)
    window.URL.revokeObjectURL(blobURL)

    onSuccess?.()
  } catch (error) {
    console.error("Download failed:", error)
    onError?.(error instanceof Error ? error.message : "Download failed")
  }
}
