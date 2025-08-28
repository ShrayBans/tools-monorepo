import React, { useState } from "react"

interface WatchlistTabProps {
  watchlistData: any
  isLoading: boolean
  onMovieClick: (movieId: number) => void
  onUpdateStatus: (movieId: number, status: "to_watch" | "maybe" | "watched" | "skipped") => void
  pagination: any
  onPageChange: (page: number) => void
}

export const WatchlistTab: React.FC<WatchlistTabProps> = ({
  watchlistData,
  isLoading,
  onMovieClick,
  onUpdateStatus,
  pagination,
  onPageChange,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>("all")

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-card border rounded-lg p-4 animate-pulse">
            <div className="flex gap-4">
              <div className="w-16 h-24 bg-muted rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!watchlistData || !watchlistData.entries || watchlistData.entries.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-lg font-medium text-foreground mb-2">Your watchlist is empty</h3>
        <p className="text-muted-foreground">Start discovering movies and add them to your watchlist!</p>
      </div>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "to_watch":
        return "⭐"
      case "maybe":
        return "🤔"
      case "watched":
        return "✅"
      case "skipped":
        return "⏭️"
      default:
        return "📋"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "to_watch":
        return "text-blue-600 bg-blue-50"
      case "maybe":
        return "text-yellow-600 bg-yellow-50"
      case "watched":
        return "text-green-600 bg-green-50"
      case "skipped":
        return "text-gray-600 bg-gray-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const statusOptions = [
    { value: "all", label: "All" },
    { value: "to_watch", label: "To Watch" },
    { value: "maybe", label: "Maybe" },
    { value: "watched", label: "Watched" },
    { value: "skipped", label: "Skipped" },
  ]

  const filteredEntries =
    statusFilter === "all"
      ? watchlistData.entries
      : watchlistData.entries.filter((entry: any) => entry.status === statusFilter)

  return (
    <div className="space-y-6">
      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setStatusFilter(option.value)}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              statusFilter === option.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Watchlist Items */}
      <div className="space-y-4">
        {filteredEntries.map((entry: any) => (
          <div key={entry.id} className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex gap-4">
              {/* Poster */}
              <div
                className="w-16 h-24 bg-muted rounded cursor-pointer overflow-hidden flex-shrink-0"
                onClick={() => onMovieClick(entry.tmdbId)}
              >
                {entry.posterPath ? (
                  <img
                    src={entry.posterPath}
                    alt={entry.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-2xl">🎬</div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-medium text-foreground cursor-pointer hover:text-primary transition-colors line-clamp-1"
                      onClick={() => onMovieClick(entry.tmdbId)}
                    >
                      {entry.title}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      {entry.releaseDate && <span>📅 {new Date(entry.releaseDate).getFullYear()}</span>}
                      {entry.runtime && (
                        <span>
                          ⏱️ {Math.floor(entry.runtime / 60)}h {entry.runtime % 60}m
                        </span>
                      )}
                      {/* <span className="text-yellow-400">
                        ⭐ {entry.voteAverage?.toFixed(1)}
                      </span> */}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(entry.status)}`}>
                    {getStatusIcon(entry.status)} {entry.status.replace("_", " ").toUpperCase()}
                  </div>
                </div>

                {/* Genres */}
                {entry.genres && entry.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {entry.genres.slice(0, 3).map((genre: any) => (
                      <span key={genre.id} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                        {genre.name}
                      </span>
                    ))}
                    {entry.genres.length > 3 && (
                      <span className="text-xs text-muted-foreground">+{entry.genres.length - 3} more</span>
                    )}
                  </div>
                )}

                {/* Overview */}
                {entry.overview && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{entry.overview}</p>}

                {/* Notes */}
                {entry.notes && (
                  <div className="mb-3">
                    <div className="text-xs text-muted-foreground mb-1">Notes:</div>
                    <p className="text-sm text-foreground italic">"{entry.notes}"</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => onUpdateStatus(entry.tmdbId, "to_watch")}
                    disabled={entry.status === "to_watch"}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      entry.status === "to_watch"
                        ? "bg-blue-100 text-blue-800 cursor-not-allowed"
                        : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                    }`}
                  >
                    ⭐ To Watch
                  </button>
                  <button
                    onClick={() => onUpdateStatus(entry.tmdbId, "maybe")}
                    disabled={entry.status === "maybe"}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      entry.status === "maybe"
                        ? "bg-yellow-100 text-yellow-800 cursor-not-allowed"
                        : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                    }`}
                  >
                    🤔 Maybe
                  </button>
                  <button
                    onClick={() => onUpdateStatus(entry.tmdbId, "watched")}
                    disabled={entry.status === "watched"}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      entry.status === "watched"
                        ? "bg-green-100 text-green-800 cursor-not-allowed"
                        : "bg-green-50 text-green-700 hover:bg-green-100"
                    }`}
                  >
                    ✅ Watched
                  </button>
                  <button
                    onClick={() => onUpdateStatus(entry.tmdbId, "skipped")}
                    disabled={entry.status === "skipped"}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      entry.status === "skipped"
                        ? "bg-gray-100 text-gray-800 cursor-not-allowed"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    ⏭️ Skip
                  </button>
                </div>

                {/* Metadata */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                  <div>Added: {new Date(entry.addedAt).toLocaleDateString()}</div>
                  {entry.todoistTaskId && (
                    <div className="flex items-center gap-1">
                      <span>📋 In Todoist</span>
                    </div>
                  )}
                  {entry.watchedDate && <div>Watched: {new Date(entry.watchedDate).toLocaleDateString()}</div>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-3 py-1 border border-border rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const page = i + 1
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`px-3 py-1 border border-border rounded ${
                    page === pagination.page ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                  }`}
                >
                  {page}
                </button>
              )
            })}
          </div>

          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="px-3 py-1 border border-border rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
