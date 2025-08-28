import { Input } from "@shray/ui"
import { useState } from "react"
import toast from "react-hot-toast"

import { trpc } from "../../lib/trpc"

interface DebugTabProps {}

export default function DebugTab({}: DebugTabProps) {
  const [debugMovieId, setDebugMovieId] = useState(550) // Fight Club as default
  const [searchQuery, setSearchQuery] = useState("fight club")

  // Debug queries for different movie endpoints
  const debugDiscoverQuery = trpc.movies.discoverMovies.useQuery({
    minRating: 7.0,
    minVoteCount: 1000,
    page: 1,
    source: "discover",
    useCache: false, // Force fresh data for debugging
  })

  const debugMovieDetailsQuery = trpc.movies.getMovieDetails.useQuery({
    tmdbId: debugMovieId,
    useCache: false,
  })

  const debugSearchQuery = trpc.movies.searchMovies.useQuery({
    query: searchQuery,
    page: 1,
  })

  const debugWatchlistQuery = trpc.movies.getWatchlist.useQuery({
    page: 1,
    limit: 10,
  })

  const debugStatsQuery = trpc.movies.getDiscoveryStats.useQuery()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value)
  }

  return (
    <div className="space-y-6">
      {/* Movie ID and Search Controls */}
      <div className="bg-background border border-border rounded-lg p-6">
        <div className="flex items-center space-x-4 mb-4">
          <h2 className="text-xl font-semibold">🔍 Movie Debug Data Explorer</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Movie ID for Details:</label>
            <Input
              type="number"
              value={debugMovieId}
              onChange={(e) => setDebugMovieId(Number(e.target.value))}
              className="border border-border rounded-md px-3 py-2 w-full"
              placeholder="Enter TMDb Movie ID"
            />
            <div className="text-xs text-muted-foreground mt-1">
              Try: 550 (Fight Club), 13 (Forrest Gump), 680 (Pulp Fiction)
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Search Query:</label>
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border border-border rounded-md px-3 py-2 w-full"
              placeholder="Enter movie search term"
            />
          </div>
        </div>
      </div>

      {/* Discovery Stats Debug */}
      <div className="bg-background border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">📊 Discovery Stats Debug</h3>
        {debugStatsQuery.isLoading ? (
          <div className="text-center py-4">Loading stats...</div>
        ) : debugStatsQuery.error ? (
          <div className="text-destructive">Error: {debugStatsQuery.error.message}</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-secondary p-3 rounded">
                <div className="font-semibold">Movies Shown</div>
                <div className="text-xl">{debugStatsQuery.data?.totalMoviesShown}</div>
              </div>
              <div className="bg-secondary p-3 rounded">
                <div className="font-semibold">In Watchlist</div>
                <div className="text-xl">{debugStatsQuery.data?.totalWatchlistItems}</div>
              </div>
              <div className="bg-secondary p-3 rounded">
                <div className="font-semibold">To Watch</div>
                <div className="text-xl">{debugStatsQuery.data?.toWatchCount}</div>
              </div>
              <div className="bg-secondary p-3 rounded">
                <div className="font-semibold">Watched</div>
                <div className="text-xl">{debugStatsQuery.data?.watchedCount}</div>
              </div>
            </div>

            <details className="mt-4">
              <summary className="cursor-pointer font-semibold text-blue-600 hover:text-blue-800">
                View Raw Discovery Stats JSON
              </summary>
              <div className="mt-2 relative">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(debugStatsQuery.data, null, 2))
                    toast.success("Discovery stats copied to clipboard!")
                  }}
                  className="absolute top-2 right-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                >
                  Copy
                </button>
                <pre className="p-4 bg-muted rounded-lg text-xs overflow-auto max-h-96 pr-16">
                  {JSON.stringify(debugStatsQuery.data, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        )}
      </div>

      {/* Movie Discovery Debug */}
      <div className="bg-background border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">🎬 Movie Discovery Debug</h3>
        {debugDiscoverQuery.isLoading ? (
          <div className="text-center py-4">Loading discovery data...</div>
        ) : debugDiscoverQuery.error ? (
          <div className="text-destructive">Error: {debugDiscoverQuery.error.message}</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-secondary p-3 rounded">
                <div className="font-semibold">Total Results</div>
                <div className="text-xl">{debugDiscoverQuery.data?.totalResults}</div>
              </div>
              <div className="bg-secondary p-3 rounded">
                <div className="font-semibold">Movies Returned</div>
                <div className="text-xl">{debugDiscoverQuery.data?.movies?.length}</div>
              </div>
              <div className="bg-secondary p-3 rounded">
                <div className="font-semibold">Current Page</div>
                <div className="text-xl">{debugDiscoverQuery.data?.page}</div>
              </div>
              <div className="bg-secondary p-3 rounded">
                <div className="font-semibold">Total Pages</div>
                <div className="text-xl">{debugDiscoverQuery.data?.totalPages}</div>
              </div>
            </div>

            {debugDiscoverQuery.data?.movies && debugDiscoverQuery.data.movies.length > 0 && (
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-3">🎞️ Sample Movies (First 3):</h4>
                <div className="space-y-2">
                  {debugDiscoverQuery.data.movies.slice(0, 3).map((movie: any, index: number) => (
                    <div key={index} className="bg-secondary p-3 rounded border text-sm">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div>
                          <span className="font-semibold">Title:</span> {movie.title}
                        </div>
                        <div>
                          <span className="font-semibold">Rating:</span>{" "}
                          {movie.voteAverage ? parseFloat(movie.voteAverage).toFixed(1) : "N/A"}/10
                        </div>
                        <div>
                          <span className="font-semibold">Votes:</span> {movie.voteCount}
                        </div>
                        <div>
                          <span className="font-semibold">Release:</span>{" "}
                          {movie.releaseDate ? formatDate(movie.releaseDate) : "N/A"}
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        <span className="font-semibold">TMDb ID:</span> {movie.tmdbId}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <details className="mt-4">
              <summary className="cursor-pointer font-semibold text-blue-600 hover:text-blue-800">
                View Raw Discovery JSON Data
              </summary>
              <div className="mt-2 relative">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(debugDiscoverQuery.data, null, 2))
                    toast.success("Discovery data copied to clipboard!")
                  }}
                  className="absolute top-2 right-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                >
                  Copy
                </button>
                <pre className="p-4 bg-muted rounded-lg text-xs overflow-auto max-h-96 pr-16">
                  {JSON.stringify(debugDiscoverQuery.data, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        )}
      </div>

      {/* Movie Details Debug */}
      <div className="bg-background border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">🎭 Movie Details Debug - ID: {debugMovieId}</h3>
        {debugMovieDetailsQuery.isLoading ? (
          <div className="text-center py-4">Loading movie details...</div>
        ) : debugMovieDetailsQuery.error ? (
          <div className="text-destructive">Error: {debugMovieDetailsQuery.error.message}</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-secondary p-3 rounded">
                <div className="font-semibold">Title</div>
                <div className="text-sm font-medium">{debugMovieDetailsQuery.data?.title}</div>
              </div>
              <div className="bg-secondary p-3 rounded">
                <div className="font-semibold">Rating</div>
                <div className="text-xl">{debugMovieDetailsQuery.data?.vote_average}/10</div>
              </div>
              <div className="bg-secondary p-3 rounded">
                <div className="font-semibold">Runtime</div>
                <div className="text-xl">{debugMovieDetailsQuery.data?.runtime} min</div>
              </div>
              <div className="bg-secondary p-3 rounded">
                <div className="font-semibold">Budget</div>
                <div className="text-sm">
                  {debugMovieDetailsQuery.data?.budget ? formatCurrency(debugMovieDetailsQuery.data.budget) : "N/A"}
                </div>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">📺 Streaming & Trailer Info:</h4>
              <div className="text-sm space-y-1">
                <div>
                  <span className="font-semibold">Has Trailer:</span>{" "}
                  {debugMovieDetailsQuery.data?.trailerUrl ? "Yes" : "No"}
                </div>
                <div>
                  <span className="font-semibold">Streaming Available:</span>{" "}
                  {debugMovieDetailsQuery.data?.streamingProviders ? "Yes" : "No"}
                </div>
                {debugMovieDetailsQuery.data?.streamingProviders && (
                  <div>
                    <span className="font-semibold">US Providers:</span>{" "}
                    {Object.keys(debugMovieDetailsQuery.data.streamingProviders).length} categories
                  </div>
                )}
              </div>
            </div>

            <details className="mt-4">
              <summary className="cursor-pointer font-semibold text-blue-600 hover:text-blue-800">
                View Raw Movie Details JSON Data
              </summary>
              <div className="mt-2 relative">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(debugMovieDetailsQuery.data, null, 2))
                    toast.success("Movie details copied to clipboard!")
                  }}
                  className="absolute top-2 right-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                >
                  Copy
                </button>
                <pre className="p-4 bg-muted rounded-lg text-xs overflow-auto max-h-96 pr-16">
                  {JSON.stringify(debugMovieDetailsQuery.data, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        )}
      </div>

      {/* Movie Search Debug */}
      <div className="bg-background border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">🔍 Movie Search Debug - "{searchQuery}"</h3>
        {debugSearchQuery.isLoading ? (
          <div className="text-center py-4">Loading search results...</div>
        ) : debugSearchQuery.error ? (
          <div className="text-destructive">Error: {debugSearchQuery.error.message}</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-secondary p-3 rounded">
                <div className="font-semibold">Total Results</div>
                <div className="text-xl">{debugSearchQuery.data?.totalResults}</div>
              </div>
              <div className="bg-secondary p-3 rounded">
                <div className="font-semibold">Movies Returned</div>
                <div className="text-xl">{debugSearchQuery.data?.movies?.length}</div>
              </div>
              <div className="bg-secondary p-3 rounded">
                <div className="font-semibold">Current Page</div>
                <div className="text-xl">{debugSearchQuery.data?.page}</div>
              </div>
              <div className="bg-secondary p-3 rounded">
                <div className="font-semibold">Total Pages</div>
                <div className="text-xl">{debugSearchQuery.data?.totalPages}</div>
              </div>
            </div>

            <details className="mt-4">
              <summary className="cursor-pointer font-semibold text-blue-600 hover:text-blue-800">
                View Raw Search Results JSON Data
              </summary>
              <div className="mt-2 relative">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(debugSearchQuery.data, null, 2))
                    toast.success("Search results copied to clipboard!")
                  }}
                  className="absolute top-2 right-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                >
                  Copy
                </button>
                <pre className="p-4 bg-muted rounded-lg text-xs overflow-auto max-h-96 pr-16">
                  {JSON.stringify(debugSearchQuery.data, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        )}
      </div>

      {/* Watchlist Debug */}
      <div className="bg-background border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">📋 Watchlist Debug</h3>
        {debugWatchlistQuery.isLoading ? (
          <div className="text-center py-4">Loading watchlist...</div>
        ) : debugWatchlistQuery.error ? (
          <div className="text-destructive">Error: {debugWatchlistQuery.error.message}</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-secondary p-3 rounded">
                <div className="font-semibold">Total Items</div>
                <div className="text-xl">{debugWatchlistQuery.data?.pagination?.total}</div>
              </div>
              <div className="bg-secondary p-3 rounded">
                <div className="font-semibold">Items Returned</div>
                <div className="text-xl">{debugWatchlistQuery.data?.entries?.length}</div>
              </div>
              <div className="bg-secondary p-3 rounded">
                <div className="font-semibold">Current Page</div>
                <div className="text-xl">{debugWatchlistQuery.data?.pagination?.page}</div>
              </div>
              <div className="bg-secondary p-3 rounded">
                <div className="font-semibold">Total Pages</div>
                <div className="text-xl">{debugWatchlistQuery.data?.pagination?.totalPages}</div>
              </div>
            </div>

            {debugWatchlistQuery.data?.entries && debugWatchlistQuery.data.entries.length > 0 && (
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-3">📋 Sample Watchlist Items (First 3):</h4>
                <div className="space-y-2">
                  {debugWatchlistQuery.data.entries.slice(0, 3).map((entry: any, index: number) => (
                    <div key={index} className="bg-secondary p-3 rounded border text-sm">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div>
                          <span className="font-semibold">Title:</span> {entry.title}
                        </div>
                        <div>
                          <span className="font-semibold">Status:</span> {entry.status}
                        </div>
                        <div>
                          <span className="font-semibold">Rating:</span>{" "}
                          {entry.voteAverage ? parseFloat(entry.voteAverage).toFixed(1) : "N/A"}/10
                        </div>
                        <div>
                          <span className="font-semibold">Todoist:</span> {entry.todoistTaskId ? "Yes" : "No"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <details className="mt-4">
              <summary className="cursor-pointer font-semibold text-blue-600 hover:text-blue-800">
                View Raw Watchlist JSON Data
              </summary>
              <div className="mt-2 relative">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(debugWatchlistQuery.data, null, 2))
                    toast.success("Watchlist data copied to clipboard!")
                  }}
                  className="absolute top-2 right-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                >
                  Copy
                </button>
                <pre className="p-4 bg-muted rounded-lg text-xs overflow-auto max-h-96 pr-16">
                  {JSON.stringify(debugWatchlistQuery.data, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  )
}
