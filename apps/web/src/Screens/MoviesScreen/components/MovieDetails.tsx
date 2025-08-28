import React from "react"
import { useHotkeys } from "react-hotkeys-hook"
import StreamingServiceIcon from "../../../components/StreamingServiceIcon"

interface MovieDetailsProps {
  movie: any | null
  isLoading: boolean
  onClose: () => void
  onAddToWatchlist: (movieId: number, status: 'to_watch' | 'maybe') => void
  onUpdateStatus?: (movieId: number, status: 'to_watch' | 'maybe' | 'watched' | 'skipped') => void
  addToWatchlistLoading?: boolean
}

export const MovieDetails: React.FC<MovieDetailsProps> = ({
  movie,
  isLoading,
  onClose,
  onAddToWatchlist,
  onUpdateStatus,
  addToWatchlistLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="bg-card border rounded-lg p-6 sticky top-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-muted rounded w-32 animate-pulse" />
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="aspect-[2/3] bg-muted rounded animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
            <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (!movie) {
    return null
  }

  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : null
  const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : null

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'text-green-400'
    if (rating >= 7) return 'text-yellow-400'
    if (rating >= 6) return 'text-orange-400'
    return 'text-red-400'
  }

  const handleWatchTrailer = () => {
    if (movie.trailerUrl) {
      window.open(movie.trailerUrl, '_blank')
    }
  }

  // Extract YouTube video ID from trailer URL
  const getYouTubeVideoId = (url: string) => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/
    const match = url.match(regex)
    return match ? match[1] : null
  }

  const youtubeVideoId = movie.trailerUrl ? getYouTubeVideoId(movie.trailerUrl) : null

  // Keyboard shortcuts for quick actions
  useHotkeys('0', () => onAddToWatchlist(movie.tmdbId || movie.id, 'to_watch'), { 
    enableOnFormTags: false,
    enabled: !!movie 
  })
  useHotkeys('1', () => onAddToWatchlist(movie.tmdbId || movie.id, 'maybe'), { 
    enableOnFormTags: false,
    enabled: !!movie 
  })
  useHotkeys('2', () => onUpdateStatus?.(movie.tmdbId || movie.id, 'watched'), { 
    enableOnFormTags: false,
    enabled: !!movie && !!onUpdateStatus 
  })
  useHotkeys('3', () => onUpdateStatus?.(movie.tmdbId || movie.id, 'skipped'), { 
    enableOnFormTags: false,
    enabled: !!movie && !!onUpdateStatus 
  })

  return (
    <div className="bg-card border rounded-lg p-6 sticky top-6 max-h-[calc(100vh-2rem)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground pr-4 line-clamp-2">
          {movie.title}
        </h2>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
        >
          ✕
        </button>
      </div>

      {/* All Action Buttons - Top Priority */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <button
          onClick={() => onAddToWatchlist(movie.tmdbId || movie.id, 'to_watch')}
          disabled={addToWatchlistLoading}
          className="bg-primary text-primary-foreground px-3 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
        >
          {addToWatchlistLoading ? (
            <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
          ) : (
            <>⭐ Watchlist [0]</>
          )}
        </button>
        <button
          onClick={() => onAddToWatchlist(movie.tmdbId || movie.id, 'maybe')}
          disabled={addToWatchlistLoading}
          className="bg-secondary text-secondary-foreground px-3 py-2 rounded-lg font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
        >
          {addToWatchlistLoading ? (
            <div className="w-4 h-4 border-2 border-secondary-foreground border-t-transparent rounded-full animate-spin" />
          ) : (
            <>💬 Ask Ayesha [1]</>
          )}
        </button>
        {onUpdateStatus && (
          <>
            <button
              onClick={() => onUpdateStatus(movie.tmdbId || movie.id, 'watched')}
              className="bg-primary/20 text-primary px-3 py-2 rounded-lg font-medium hover:bg-primary/30 transition-colors flex items-center justify-center gap-1"
            >
              ✅ Watched [2]
            </button>
            <button
              onClick={() => onUpdateStatus(movie.tmdbId || movie.id, 'skipped')}
              className="bg-muted text-muted-foreground px-3 py-2 rounded-lg font-medium hover:bg-muted/80 transition-colors flex items-center justify-center gap-1"
            >
              ⏭️ Skip [3]
            </button>
          </>
        )}
      </div>

      {/* YouTube Trailer Embed */}
      {youtubeVideoId && (
        <div className="mb-6">
          <div className="aspect-video w-full">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${youtubeVideoId}`}
              title={`${movie.title} Trailer`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="rounded-lg"
            ></iframe>
          </div>
        </div>
      )}

      {/* Basic Info */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2">
          <span className={`font-medium ${getRatingColor(movie.vote_average)}`}>
            ⭐ {movie.vote_average?.toFixed(1)}
          </span>
          <span className="text-muted-foreground text-sm">
            ({movie.vote_count?.toLocaleString()} votes)
          </span>
        </div>

        {releaseYear && (
          <div className="text-muted-foreground">
            📅 {releaseYear}
          </div>
        )}

        {runtime && (
          <div className="text-muted-foreground">
            ⏱️ {runtime}
          </div>
        )}

        {movie.status && (
          <div className="text-muted-foreground">
            📊 {movie.status.replace('_', ' ').toUpperCase()}
          </div>
        )}
      </div>

      {/* Genres */}
      {movie.genres && movie.genres.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-foreground mb-2">Genres</h4>
          <div className="flex flex-wrap gap-1">
            {movie.genres.map((genre: any) => (
              <span
                key={genre.id}
                className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded"
              >
                {genre.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tagline */}
      {movie.tagline && (
        <div className="mb-4">
          <p className="text-sm italic text-muted-foreground">
            "{movie.tagline}"
          </p>
        </div>
      )}

      {/* Overview */}
      {movie.overview && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-foreground mb-2">Overview</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {movie.overview}
          </p>
        </div>
      )}

      {/* Budget & Revenue */}
      {(movie.budget > 0 || movie.revenue > 0) && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-foreground mb-2">Box Office</h4>
          <div className="space-y-1 text-sm text-muted-foreground">
            {movie.budget > 0 && (
              <div>💰 Budget: ${movie.budget.toLocaleString()}</div>
            )}
            {movie.revenue > 0 && (
              <div>💵 Revenue: ${movie.revenue.toLocaleString()}</div>
            )}
          </div>
        </div>
      )}

      {/* Production Companies */}
      {movie.production_companies && movie.production_companies.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-foreground mb-2">Production</h4>
          <div className="space-y-1">
            {movie.production_companies.slice(0, 3).map((company: any) => (
              <div key={company.id} className="text-sm text-muted-foreground">
                🏢 {company.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Streaming Providers */}
      {movie.streamingProviders && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-foreground mb-2">Where to Watch</h4>
          <div className="space-y-2">
            {movie.streamingProviders.flatrate && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Stream</div>
                <div className="flex flex-wrap gap-1">
                  {movie.streamingProviders.flatrate.map((provider: any) => (
                    <span
                      key={provider.provider_id}
                      className="text-xs bg-primary/10 text-primary px-2 py-1 rounded flex items-center gap-1"
                    >
                      <StreamingServiceIcon providerName={provider.provider_name} size={12} />
                      {provider.provider_name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {movie.streamingProviders.rent && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Rent</div>
                <div className="flex flex-wrap gap-1">
                  {movie.streamingProviders.rent.map((provider: any) => (
                    <span
                      key={provider.provider_id}
                      className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded flex items-center gap-1"
                    >
                      <StreamingServiceIcon providerName={provider.provider_name} size={12} />
                      {provider.provider_name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {movie.streamingProviders.buy && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Buy</div>
                <div className="flex flex-wrap gap-1">
                  {movie.streamingProviders.buy.map((provider: any) => (
                    <span
                      key={provider.provider_id}
                      className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded flex items-center gap-1"
                    >
                      <StreamingServiceIcon providerName={provider.provider_name} size={12} />
                      {provider.provider_name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3 pt-4 border-t border-border">
        {/* Trailer Button - Only show if no embedded trailer */}
        {movie.trailerUrl && !youtubeVideoId && (
          <button
            onClick={handleWatchTrailer}
            className="w-full bg-secondary text-secondary-foreground px-4 py-2 rounded-lg font-medium hover:bg-secondary/80 transition-colors"
          >
            🎥 Watch Trailer
          </button>
        )}


        {/* External Links */}
        <div className="grid grid-cols-2 gap-2">
          {movie.imdb_id && (
            <a
              href={`https://www.imdb.com/title/${movie.imdb_id}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-center bg-accent text-accent-foreground px-4 py-2 rounded-lg font-medium hover:bg-accent/80 transition-colors"
            >
              📺 IMDb
            </a>
          )}
          {movie.homepage && (
            <a
              href={movie.homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="text-center bg-accent text-accent-foreground px-4 py-2 rounded-lg font-medium hover:bg-accent/80 transition-colors"
            >
              🏠 Website
            </a>
          )}
        </div>
      </div>
    </div>
  )
}