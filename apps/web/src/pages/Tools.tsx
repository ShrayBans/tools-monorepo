import React, { useState } from "react"
import { GoogleCalendarExplorer } from "~/components/GoogleCalendarExplorer"
import { useAuth } from "~/lib/auth-context"
import { trpc } from "~/lib/trpc"

export default function Tools() {
  const { user } = useAuth()
  const [activeItem, setActiveItem] = useState<string | null>(null)

  const toggleItem = (value: string) => {
    setActiveItem(activeItem === value ? null : value)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold ">Tools</h1>
        <p className="mt-2 ">Administrative tools and utilities</p>
      </div>

      <div className="space-y-4">
        {/* Google Calendar Explorer */}
        <div className="border rounded-lg">
          <button
            onClick={() => toggleItem("google-calendar-explorer")}
            className="w-full px-4 py-4 text-left flex items-center justify-between  transition-colors"
          >
            <span className="text-lg font-semibold">Google Calendar Explorer</span>
            <svg
              className={`w-5 h-5 transform transition-transform ${
                activeItem === "google-calendar-explorer" ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div
            className={`px-4 overflow-hidden transition-all duration-300 ${
              activeItem === "google-calendar-explorer" ? "max-h-[2000px] pb-4" : "max-h-0"
            }`}
          >
            <GoogleCalendarExplorer />
          </div>
        </div>

        {/* Google Docs Checker */}
        <div className="border rounded-lg">
          <button
            onClick={() => toggleItem("google-docs-checker")}
            className="w-full px-4 py-4 text-left flex items-center justify-between  transition-colors"
          >
            <span className="text-lg font-semibold">Google Docs Checker</span>
            <svg
              className={`w-5 h-5 transform transition-transform ${
                activeItem === "google-docs-checker" ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div
            className={`px-4 overflow-hidden transition-all duration-300 ${
              activeItem === "google-docs-checker" ? "max-h-[2000px] pb-4" : "max-h-0"
            }`}
          >
            <GoogleDocChecker />
          </div>
        </div>

        {/* Google Sheets Viewer */}
        <div className="border rounded-lg">
          <button
            onClick={() => toggleItem("google-sheets-viewer")}
            className="w-full px-4 py-4 text-left flex items-center justify-between  transition-colors"
          >
            <span className="text-lg font-semibold">Google Sheets Viewer</span>
            <svg
              className={`w-5 h-5 transform transition-transform ${
                activeItem === "google-sheets-viewer" ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div
            className={`px-4 overflow-hidden transition-all duration-300 ${
              activeItem === "google-sheets-viewer" ? "max-h-[2000px] pb-4" : "max-h-0"
            }`}
          >
            <GoogleSheetsViewer />
          </div>
        </div>

        {/* Google Drive Explorer */}
        <div className="border rounded-lg">
          <button
            onClick={() => toggleItem("google-drive-explorer")}
            className="w-full px-4 py-4 text-left flex items-center justify-between  transition-colors"
          >
            <span className="text-lg font-semibold">Google Drive Explorer</span>
            <svg
              className={`w-5 h-5 transform transition-transform ${
                activeItem === "google-drive-explorer" ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div
            className={`px-4 overflow-hidden transition-all duration-300 ${
              activeItem === "google-drive-explorer" ? "max-h-[2000px] pb-4" : "max-h-0"
            }`}
          >
            <GoogleDriveExplorer />
          </div>
        </div>
      </div>
    </div>
  )
}

// Google Docs Checker Component
function GoogleDocChecker() {
  const [docId, setDocId] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testConnection = trpc.googleDocs.testConnection.useQuery()
  const getDocument = trpc.googleDocs.getDocument.useMutation()

  const handleCheckDocument = async () => {
    if (!docId.trim()) {
      setError("Please enter a Google Doc ID")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await getDocument.mutateAsync({ documentId: docId })
      setResult(response)
    } catch (err: any) {
      setError(err.message || "Failed to fetch document")
    } finally {
      setLoading(false)
    }
  }

  const extractDocId = (input: string): string => {
    // Try to extract ID from URL
    const match = input.match(/\/document\/d\/([a-zA-Z0-9-_]+)/)
    return match ? match[1] : input
  }

  return (
    <div className="space-y-4 py-4">
      {/* Connection Status */}
      <div className="bg-foregroundx p-4 rounded-lg">
        <h3 className="font-medium mb-2">Connection Status</h3>
        {testConnection.isLoading ? (
          <p className="">Checking connection...</p>
        ) : testConnection.data ? (
          <div>
            <p className="text-sm">
              <span className="font-medium">Status:</span>{" "}
              <span className={testConnection.data.connected ? "text-green-600" : "text-destructive"}>
                {testConnection.data.connected ? "Connected" : "Not Connected"}
              </span>
            </p>
            <p className="text-sm">
              <span className="font-medium">Credentials Type:</span> {testConnection.data.credentialsType}
            </p>
            <p className="text-sm">
              <span className="font-medium">Service Account:</span> {testConnection.data.serviceAccount}
            </p>
          </div>
        ) : (
          <p className="text-destructive">Failed to check connection</p>
        )}
      </div>

      {/* Document Checker */}
      <div className="space-y-4">
        <div>
          <label htmlFor="doc-id" className="block text-sm font-medium text-primary mb-2">
            Google Doc ID or URL
          </label>
          <input
            id="doc-id"
            type="text"
            value={docId}
            onChange={(e) => setDocId(e.target.value)}
            placeholder="Enter doc ID or paste full URL"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Example: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms or full Google Docs URL
          </p>
        </div>

        <button
          onClick={handleCheckDocument}
          disabled={loading || !testConnection.data?.connected}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? "Checking..." : "Check Document"}
        </button>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 space-y-2">
            <h4 className="font-medium text-green-900">Document Retrieved Successfully!</h4>
            <div className="text-sm space-y-1">
              <p>
                <span className="font-medium">ID:</span> {result.document.id}
              </p>
              <p>
                <span className="font-medium">Title:</span> {result.document.title}
              </p>
              <p>
                <span className="font-medium">Content Length:</span> {result.document.content.length} characters
              </p>
              <p>
                <span className="font-medium">Body Elements:</span> {result.document.bodyElementsCount}
              </p>
              <p>
                <span className="font-medium">Revision ID:</span> {result.document.revisionId}
              </p>
            </div>

            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-primary">
                Show Content Preview (first 1000 chars)
              </summary>
              <pre className="mt-2 p-3 bg-background rounded border text-xs overflow-x-auto">
                {result.document.content.substring(0, 1000)}
                {result.document.content.length > 1000 && "..."}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  )
}

// Google Sheets Viewer Component
function GoogleSheetsViewer() {
  const [sheetId, setSheetId] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testConnection = trpc.googleSheets.testConnection.useQuery()
  const getSpreadsheet = trpc.googleSheets.getSpreadsheet.useMutation()

  const handleCheckSpreadsheet = async () => {
    if (!sheetId.trim()) {
      setError("Please enter a Google Sheets ID")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await getSpreadsheet.mutateAsync({
        spreadsheetId: extractSheetId(sheetId),
      })
      setResult(response)
    } catch (err: any) {
      setError(err.message || "Failed to fetch spreadsheet")
    } finally {
      setLoading(false)
    }
  }

  const extractSheetId = (input: string): string => {
    // Try to extract ID from URL
    const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    return match ? match[1] : input
  }

  return (
    <div className="space-y-4 py-4">
      {/* Connection Status */}
      <div className="bg-foregroundx p-4 rounded-lg">
        <h3 className="font-medium mb-2">Connection Status</h3>
        {testConnection.isLoading ? (
          <p className="">Checking connection...</p>
        ) : testConnection.data ? (
          <div>
            <p className="text-sm">
              <span className="font-medium">Status:</span>{" "}
              <span className={testConnection.data.connected ? "text-green-600" : "text-destructive"}>
                {testConnection.data.connected ? "Connected" : "Not Connected"}
              </span>
            </p>
            <p className="text-sm">
              <span className="font-medium">Service Account:</span> {testConnection.data.serviceAccount}
            </p>
          </div>
        ) : (
          <p className="text-destructive">Failed to check connection</p>
        )}
      </div>

      {/* Spreadsheet Viewer */}
      <div className="space-y-4">
        <div>
          <label htmlFor="sheet-id" className="block text-sm font-medium text-primary mb-2">
            Google Sheets ID or URL
          </label>
          <input
            id="sheet-id"
            type="text"
            value={sheetId}
            onChange={(e) => setSheetId(e.target.value)}
            placeholder="Enter sheet ID or paste full URL"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Example: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms or full Google Sheets URL
          </p>
        </div>

        <button
          onClick={handleCheckSpreadsheet}
          disabled={loading || !testConnection.data?.connected}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? "Loading..." : "View Spreadsheet"}
        </button>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 space-y-4">
            <h4 className="font-medium text-green-900">Spreadsheet Retrieved Successfully!</h4>
            <div className="text-sm space-y-1">
              <p>
                <span className="font-medium">ID:</span> {result.spreadsheet.id}
              </p>
              <p>
                <span className="font-medium">Title:</span> {result.spreadsheet.title}
              </p>
              <p>
                <span className="font-medium">Sheets:</span> {result.spreadsheet.sheets.length}
              </p>
            </div>

            {/* Display sheet data */}
            <div className="space-y-4">
              {result.spreadsheet.sheets.map((sheet: any, index: number) => (
                <div key={index} className="bg-background rounded border p-4">
                  <h5 className="font-medium mb-2">{sheet.title}</h5>
                  {sheet.data && sheet.data.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <tbody className="bg-background divide-y divide-gray-200">
                          {sheet.data.slice(0, 10).map((row: any[], rowIndex: number) => (
                            <tr key={rowIndex}>
                              {row.map((cell: any, cellIndex: number) => (
                                <td key={cellIndex} className="px-3 py-2 text-sm  border">
                                  {cell || ""}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {sheet.data.length > 10 && (
                        <p className="text-xs text-gray-500 mt-2">
                          Showing first 10 rows of {sheet.data.length} total rows
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No data in this sheet</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Google Drive Explorer Component
function GoogleDriveExplorer() {
  const [currentFolderId, setCurrentFolderId] = useState<string>("root")
  const [folderPath, setFolderPath] = useState<Array<{ id: string; name: string }>>([{ id: "root", name: "My Drive" }])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testConnection = trpc.googleDrive.testConnection.useQuery()
  const listFiles = trpc.googleDrive.listFiles.useQuery(
    {
      folderId: currentFolderId,
      searchQuery: searchQuery || undefined,
    },
    {
      enabled: testConnection.data?.connected ?? false,
    },
  )

  const navigateToFolder = (folderId: string, folderName: string) => {
    // Find if this folder is already in the path
    const existingIndex = folderPath.findIndex((f) => f.id === folderId)

    if (existingIndex !== -1) {
      // Navigate back to this folder
      setFolderPath(folderPath.slice(0, existingIndex + 1))
    } else {
      // Navigate forward to new folder
      setFolderPath([...folderPath, { id: folderId, name: folderName }])
    }

    setCurrentFolderId(folderId)
    setSearchQuery("")
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getFileIcon = (mimeType: string): string => {
    if (mimeType.includes("folder")) return "📁"
    if (mimeType.includes("document")) return "📄"
    if (mimeType.includes("spreadsheet")) return "📊"
    if (mimeType.includes("presentation")) return "📊"
    if (mimeType.includes("image")) return "🖼️"
    if (mimeType.includes("video")) return "🎥"
    if (mimeType.includes("audio")) return "🎵"
    if (mimeType.includes("pdf")) return "📑"
    return "📎"
  }

  return (
    <div className="space-y-4 py-4">
      {/* Connection Status */}
      <div className="bg-foregroundx p-4 rounded-lg">
        <h3 className="font-medium mb-2">Connection Status</h3>
        {testConnection.isLoading ? (
          <p className="">Checking connection...</p>
        ) : testConnection.data ? (
          <div>
            <p className="text-sm">
              <span className="font-medium">Status:</span>{" "}
              <span className={testConnection.data.connected ? "text-green-600" : "text-destructive"}>
                {testConnection.data.connected ? "Connected" : "Not Connected"}
              </span>
            </p>
            <p className="text-sm">
              <span className="font-medium">Service Account:</span> {testConnection.data.serviceAccount}
            </p>
          </div>
        ) : (
          <p className="text-destructive">Failed to check connection</p>
        )}
      </div>

      {testConnection.data?.connected && (
        <>
          {/* Breadcrumb Navigation */}
          <div className="flex items-center space-x-2 text-sm">
            {folderPath.map((folder, index) => (
              <React.Fragment key={folder.id}>
                {index > 0 && <span className="text-gray-400">/</span>}
                <button onClick={() => navigateToFolder(folder.id, folder.name)} className=" hover:underline">
                  {folder.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Search Bar */}
          <div className="flex space-x-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files and folders..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => listFiles.refetch()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Search
            </button>
          </div>

          {/* File List */}
          {listFiles.isLoading ? (
            <div className="text-center py-8">
              <p className="">Loading files...</p>
            </div>
          ) : listFiles.error ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-destructive">Error loading files: {listFiles.error.message}</p>
            </div>
          ) : listFiles.data?.files && listFiles.data.files.length > 0 ? (
            <div className="bg-background rounded-lg border">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-foreground">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Modified
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y divide-gray-200">
                  {listFiles.data.files.map((file: any) => (
                    <tr key={file.id} className="">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="mr-2">{getFileIcon(file.mimeType)}</span>
                          {file.mimeType === "application/vnd.google-apps.folder" ? (
                            <button onClick={() => navigateToFolder(file.id, file.name)} className=" hover:underline">
                              {file.name}
                            </button>
                          ) : (
                            <span className="">{file.name}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(file.modifiedTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {file.size ? formatFileSize(parseInt(file.size)) : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className=" hover:underline"
                          >
                            Open
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 bg-foregroundx rounded-lg">
              <p className="">{searchQuery ? "No files found matching your search" : "No files in this folder"}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
