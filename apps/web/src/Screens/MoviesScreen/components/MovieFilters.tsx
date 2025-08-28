import React, { useState } from "react"

const GENRE_OPTIONS = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 36, name: "History" },
  { id: 27, name: "Horror" },
  { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Science Fiction" },
  { id: 10770, name: "TV Movie" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "War" },
  { id: 37, name: "Western" },
]

const SOURCE_OPTIONS = [
  { value: 'discover', label: '🔍 Discover' },
  { value: 'trending', label: '🔥 Trending' },
  { value: 'popular', label: '⭐ Popular' },
  { value: 'now_playing', label: '🎬 Now Playing' },
  { value: 'upcoming', label: '📅 Upcoming' },
]

const SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Popularity ↓' },
  { value: 'release_date.desc', label: 'Release Date ↓' },
  { value: 'vote_average.desc', label: 'Rating ↓' },
  { value: 'vote_count.desc', label: 'Vote Count ↓' },
]

interface MovieFiltersProps {
  filters: {
    minRating: number
    minVoteCount: number
    genres: number[]
    year?: number
    minRuntime?: number
    maxRuntime?: number
    sortBy: string
    source: string
    releaseDateGte?: string
    releaseDateLte?: string
  }
  onChange: (filters: Partial<MovieFiltersProps['filters']>) => void
  onRefresh: () => void
}

export const MovieFilters: React.FC<MovieFiltersProps> = ({
  filters,
  onChange,
  onRefresh,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleGenreToggle = (genreId: number) => {
    const newGenres = filters.genres.includes(genreId)
      ? filters.genres.filter(id => id !== genreId)
      : [...filters.genres, genreId]
    onChange({ genres: newGenres })
  }

  const resetFilters = () => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    onChange({
      minRating: 5.0,
      minVoteCount: 100,
      genres: [],
      year: undefined,
      minRuntime: undefined,
      maxRuntime: undefined,
      sortBy: 'popularity.desc',
      source: 'discover',
      releaseDateGte: thirtyDaysAgo.toISOString().split('T')[0],
      releaseDateLte: undefined,
    })
  }

  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 30 }, (_, i) => currentYear - i)

  return (
    <div className="bg-card border rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-foreground">🎛️ Filters</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isExpanded ? 'Hide' : 'Show'} Advanced
          </button>
          <button
            onClick={resetFilters}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Reset
          </button>
          <button
            onClick={onRefresh}
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Source */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Source
          </label>
          <div className="flex flex-wrap gap-2">
            {SOURCE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => onChange({ source: option.value })}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  filters.source === option.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Min Rating: {filters.minRating}
            </label>
            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              value={filters.minRating}
              onChange={(e) => onChange({ minRating: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Vote Count */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Min Votes: {filters.minVoteCount}
            </label>
            <input
              type="range"
              min="0"
              max="1000"
              step="50"
              value={filters.minVoteCount}
              onChange={(e) => onChange({ minVoteCount: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Year */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Year
            </label>
            <select
              value={filters.year || ''}
              onChange={(e) => onChange({ year: e.target.value ? parseInt(e.target.value) : undefined })}
              className="w-full px-3 py-1 border border-border rounded bg-background text-foreground"
            >
              <option value="">Any Year</option>
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => onChange({ sortBy: e.target.value })}
              className="w-full px-3 py-1 border border-border rounded bg-background text-foreground"
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Advanced Filters */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t border-border">
            {/* Premiere Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Premiere Date From
                </label>
                <input
                  type="date"
                  value={filters.releaseDateGte || ''}
                  onChange={(e) => onChange({ releaseDateGte: e.target.value || undefined })}
                  className="w-full px-3 py-1 border border-border rounded bg-background text-foreground"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Default: Last 30 days
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Premiere Date To
                </label>
                <input
                  type="date"
                  value={filters.releaseDateLte || ''}
                  onChange={(e) => onChange({ releaseDateLte: e.target.value || undefined })}
                  className="w-full px-3 py-1 border border-border rounded bg-background text-foreground"
                  placeholder="Any"
                />
              </div>
            </div>

            {/* Runtime */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Min Runtime (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  max="300"
                  step="5"
                  value={filters.minRuntime || ''}
                  onChange={(e) => onChange({ minRuntime: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-3 py-1 border border-border rounded bg-background text-foreground"
                  placeholder="Any"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Max Runtime (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  max="300"
                  step="5"
                  value={filters.maxRuntime || ''}
                  onChange={(e) => onChange({ maxRuntime: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-3 py-1 border border-border rounded bg-background text-foreground"
                  placeholder="Any"
                />
              </div>
            </div>

            {/* Genres */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Genres {filters.genres.length > 0 && `(${filters.genres.length} selected)`}
              </label>
              <div className="flex flex-wrap gap-2">
                {GENRE_OPTIONS.map((genre) => (
                  <button
                    key={genre.id}
                    onClick={() => handleGenreToggle(genre.id)}
                    className={`px-3 py-1 rounded-md text-sm transition-colors ${
                      filters.genres.includes(genre.id)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {genre.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}