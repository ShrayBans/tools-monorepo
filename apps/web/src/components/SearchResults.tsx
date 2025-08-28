import React from "react"

interface SearchResultItem {
  id: string
  type: "project" | "task"
  title?: string
  content?: string
  description?: string | null
  strategyContent?: string
  projectTitle?: string
  status?: "todo" | "in_progress" | "done"
  priority?: number // Only for tasks
  estimatedMinutes?: number
}

interface SearchResultsProps {
  results: {
    projects: SearchResultItem[]
    tasks: SearchResultItem[]
    totalResults: number
  }
  searchQuery: string
  onSelectProject: (projectId: string) => void
  onSelectTask: (taskId: string) => void
  onClose: () => void
}

const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  searchQuery,
  onSelectProject,
  onSelectTask,
  onClose,
}) => {
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
    const parts = text.split(regex)

    return parts.map((part, index) => {
      if (regex.test(part)) {
        return (
          <mark key={index} className="bg-yellow-200 px-1 rounded">
            {part}
          </mark>
        )
      }
      return part
    })
  }

  const getStrategyExcerpts = (strategyContent: string, query: string) => {
    if (!strategyContent || !query.trim()) return []

    const words = query.toLowerCase().split(/\s+/)
    const lines = strategyContent.split("\n")
    const excerpts: string[] = []

    lines.forEach((line, index) => {
      const lowercaseLine = line.toLowerCase()
      if (words.some((word) => lowercaseLine.includes(word))) {
        // Include context: previous line, current line, next line
        const start = Math.max(0, index - 1)
        const end = Math.min(lines.length, index + 2)
        const excerpt = lines.slice(start, end).join("\n")
        if (!excerpts.includes(excerpt)) {
          excerpts.push(excerpt)
        }
      }
    })

    return excerpts.slice(0, 3) // Limit to 3 excerpts per project
  }

  const formatEstimatedTime = (minutes?: number) => {
    if (!minutes) return null
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    }
    return `${mins}m`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo":
        return "bg-foregroundx text-primary"
      case "in_progress":
        return "bg-yellow-100 text-yellow-700"
      case "done":
        return "bg-green-100 text-green-700"
      default:
        return "bg-foregroundx text-primary"
    }
  }

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return "bg-red-100 text-destructive"
    if (priority >= 6) return "bg-orange-100 text-orange-700"
    if (priority >= 4) return "bg-yellow-100 text-yellow-700"
    return "bg-foregroundx text-primary"
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-medium ">Search Results ({results.totalResults})</h3>
          <button onClick={onClose} className="text-gray-400 hover:">
            ✕
          </button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {/* Project Results */}
        {results.projects.length > 0 && (
          <div className="p-4 border-b border-gray-100">
            <h4 className="text-sm font-medium text-primary mb-3">📁 Projects ({results.projects.length})</h4>
            <div className="space-y-3">
              {results.projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => onSelectProject(project.id)}
                  className="cursor-pointer p-3 rounded-lg border border-border  transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium  mb-1">{highlightText(project.title || "", searchQuery)}</h5>
                      {project.description && (
                        <p className="text-sm  mb-2">{highlightText(project.description, searchQuery)}</p>
                      )}

                      {/* Strategy Content Excerpts */}
                      {project.strategyContent && (
                        <div className="mt-2">
                          <h6 className="text-xs font-medium text-gray-500 mb-1">Strategy excerpts:</h6>
                          {getStrategyExcerpts(project.strategyContent, searchQuery).map((excerpt, index) => (
                            <div
                              key={index}
                              className="bg-foregroundx p-2 rounded text-xs text-primary mb-1 border-l-2 border-blue-200"
                            >
                              <pre className="whitespace-pre-wrap font-sans">{highlightText(excerpt, searchQuery)}</pre>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="ml-3 flex items-center gap-2">{/* Project priority removed */}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Task Results */}
        {results.tasks.length > 0 && (
          <div className="p-4">
            <h4 className="text-sm font-medium text-primary mb-3">✓ Tasks ({results.tasks.length})</h4>
            <div className="space-y-3">
              {results.tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => onSelectTask(task.id)}
                  className="cursor-pointer p-3 rounded-lg border border-border  transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium  mb-1">{highlightText(task.content || "", searchQuery)}</h5>
                      {task.description && (
                        <p className="text-sm  mb-2">{highlightText(task.description, searchQuery)}</p>
                      )}
                      {task.projectTitle && <p className="text-xs text-gray-500">📁 {task.projectTitle}</p>}
                    </div>
                    <div className="ml-3 flex items-center gap-2">
                      {task.status && (
                        <span
                          className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}
                        >
                          {task.status.replace("_", " ")}
                        </span>
                      )}
                      {task.priority && (
                        <span
                          className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}
                        >
                          P{task.priority}
                        </span>
                      )}
                      {task.estimatedMinutes && (
                        <span className="inline-flex items-center px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                          ⏱️ {formatEstimatedTime(task.estimatedMinutes)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {results.totalResults === 0 && (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-2">🔍</div>
            <p>No results found for "{searchQuery}"</p>
            <p className="text-sm mt-1">Try adjusting your search terms or filters</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchResults
