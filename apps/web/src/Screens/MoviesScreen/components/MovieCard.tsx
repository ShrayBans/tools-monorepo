import React from "react"

interface MovieCardProps {
  movie: {
    tmdbId?: number
    id?: number
    title: string
    overview?: string
    posterPath?: string | null
    voteAverage: number
    voteCount?: number
    releaseDate?: string
    runtime?: number
    genres?: Array<{ id: number; name: string }>
    status?: string // For watchlist items
    streamingProviders?: {
      flatrate?: Array<{ provider_name: string }>
      rent?: Array<{ provider_name: string }>
      buy?: Array<{ provider_name: string }>
    }
  }
  onClick: () => void
  onAddToWatchlist?: (movieId: number, status: 'to_watch' | 'maybe') => void
  showWatchlistActions?: boolean
  addToWatchlistLoading?: boolean
  isSelected?: boolean
  watchlistData?: Array<{ tmdbId: number; status: string }> // For cross-referencing status
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  onClick,
  onAddToWatchlist,
  showWatchlistActions = true,
  addToWatchlistLoading = false,
  isSelected = false,
  watchlistData,
}) => {
  const movieId = movie.tmdbId || movie.id!
  const releaseYear = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : null

  // Get the actual status for this movie
  const getMovieStatus = () => {
    // If movie already has status (like in watchlist tab), use it
    if (movie.status) {
      return movie.status
    }
    
    // Otherwise, check against watchlist data
    if (watchlistData) {
      const watchlistEntry = watchlistData.find(entry => entry.tmdbId === movieId)
      return watchlistEntry?.status
    }
    
    return undefined
  }

  const actualStatus = getMovieStatus()

  // Check if movie is currently in theaters (recent release with no streaming availability)
  const isInTheaters = () => {
    if (!movie.releaseDate) return false
    
    // Must be a recent release (within last 4 months)
    const releaseDate = new Date(movie.releaseDate)
    const fourMonthsAgo = new Date()
    fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4)
    const now = new Date()
    const isRecentRelease = releaseDate >= fourMonthsAgo && releaseDate <= now
    
    // Only show "In Theaters" if it's recent AND has no streaming availability
    return isRecentRelease && !getStreamingProvider()
  }

  // Get first available streaming provider
  const getStreamingProvider = () => {
    if (!movie.streamingProviders) return null
    
    // Priority: flatrate (subscription) > rent > buy
    if (movie.streamingProviders.flatrate && movie.streamingProviders.flatrate.length > 0) {
      return movie.streamingProviders.flatrate[0].provider_name
    }
    if (movie.streamingProviders.rent && movie.streamingProviders.rent.length > 0) {
      return movie.streamingProviders.rent[0].provider_name
    }
    if (movie.streamingProviders.buy && movie.streamingProviders.buy.length > 0) {
      return movie.streamingProviders.buy[0].provider_name
    }
    return null
  }

  // Format release date for display
  const getFormattedReleaseDate = () => {
    if (!movie.releaseDate) return null
    return new Date(movie.releaseDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'text-green-400'
    if (rating >= 7) return 'text-yellow-400'
    if (rating >= 6) return 'text-orange-400'
    return 'text-red-400'
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'to_watch':
        return <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded font-medium">⭐ Watchlist</span>
      case 'maybe':
        return <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded font-medium">💬 Ask Ayesha</span>
      case 'watched':
        return <span className="text-xs bg-primary/30 text-primary px-2 py-1 rounded font-medium">✅ Watched</span>
      case 'skipped':
        return <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded font-medium">⏭️ Skipped</span>
      default:
        return null
    }
  }

  return (
    <div className={`bg-card rounded-lg overflow-hidden border transition-all duration-200 group ${
      isSelected 
        ? 'ring-4 ring-primary shadow-2xl shadow-primary/20 scale-105 z-10 relative' 
        : 'hover:shadow-lg hover:scale-[1.02]'
    }`}>
      {/* Poster */}
      <div 
        className="aspect-[3/4] bg-muted relative cursor-pointer overflow-hidden"
        onClick={onClick}
      >
        {movie.posterPath ? (
          <img
            src={movie.posterPath}
            alt={movie.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <div className="text-4xl">🎬</div>
          </div>
        )}
        
        {/* Rating overlay */}
        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded text-sm font-medium">
          <span className={getRatingColor(movie.voteAverage)}>
            ⭐ {movie.voteAverage.toFixed(1)}
          </span>
        </div>

        {/* Status badge */}
        {actualStatus && (
          <div className="absolute top-2 left-2">
            {getStatusBadge(actualStatus)}
          </div>
        )}

        {/* Theater/Streaming and Release Date badges - top-left */}
        {!actualStatus && (
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {/* Streaming provider takes priority, then theaters */}
            {getStreamingProvider() ? (
              <span className="text-xs bg-green-600 text-white px-2 py-1 rounded font-medium">
                📺 {getStreamingProvider()}
              </span>
            ) : isInTheaters() ? (
              <span className="text-xs bg-red-600 text-white px-2 py-1 rounded font-medium">
                🎬 In Theaters
              </span>
            ) : null}
            
            {/* Release date badge */}
            {getFormattedReleaseDate() && (
              <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded font-medium">
                📅 {getFormattedReleaseDate()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="mb-2">
          <h3 
            className="font-semibold text-foreground line-clamp-1 cursor-pointer hover:text-primary transition-colors text-sm"
            onClick={onClick}
            title={movie.title}
          >
            {movie.title}
          </h3>
          {releaseYear && (
            <p className="text-xs text-muted-foreground">{releaseYear}</p>
          )}
        </div>

        {/* Genres */}
        {movie.genres && movie.genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1">
            {movie.genres.slice(0, 1).map((genre) => (
              <span
                key={genre.id}
                className="text-xs bg-muted text-muted-foreground px-1 py-0.5 rounded"
              >
                {genre.name}
              </span>
            ))}
            {movie.genres.length > 1 && (
              <span className="text-xs text-muted-foreground">
                +{movie.genres.length - 1}
              </span>
            )}
          </div>
        )}

        {/* Runtime */}
        {movie.runtime && (
          <p className="text-xs text-muted-foreground mb-1">
            ⏱️ {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
          </p>
        )}

        {/* Action Buttons */}
        {showWatchlistActions && onAddToWatchlist && (
          <div className="flex gap-1 mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAddToWatchlist(movieId, 'to_watch')
              }}
              disabled={addToWatchlistLoading}
              className="flex-1 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
              title="Add to watchlist"
            >
              {addToWatchlistLoading ? (
                <>
                  <div className="w-2 h-2 border border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs">...</span>
                </>
              ) : (
                <>⭐</>
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAddToWatchlist(movieId, 'maybe')
              }}
              disabled={addToWatchlistLoading}
              className="flex-1 bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
              title="Add to maybe list"
            >
              {addToWatchlistLoading ? (
                <>
                  <div className="w-2 h-2 border border-secondary-foreground border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs">...</span>
                </>
              ) : (
                <>💬</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}