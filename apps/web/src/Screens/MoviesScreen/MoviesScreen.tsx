import React, { useState, useEffect, useCallback, useRef } from "react"
import { useNavigate, useSearch } from "@tanstack/react-router"
import toast from "react-hot-toast"
import { useHotkeys } from "react-hotkeys-hook"
import { trpc } from "../../lib/trpc"
import { MovieCard } from "./components/MovieCard"
import { MovieFilters } from "./components/MovieFilters"
import { MovieDetails } from "./components/MovieDetails"
import { WatchlistTab } from "./components/WatchlistTab"
import DebugTab from "./DebugTab"

type TabType = 'discover' | 'watchlist' | 'search' | 'debug'
type LanguageFilter = 'all' | 'english' | 'bollywood' | 'korean'

const MoviesScreen: React.FC = () => {
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as { 
    tab?: string
    genre?: string
    year?: string
    language?: string
  }

  // State management
  const [activeTab, setActiveTab] = useState<TabType>((search.tab as TabType) || 'discover')
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [languageFilter, setLanguageFilter] = useState<LanguageFilter>((search.language as LanguageFilter) || 'all')
  const [selectedMovieIndex, setSelectedMovieIndex] = useState<number>(-1)
  const [allMovies, setAllMovies] = useState<any[]>([]) // Store all loaded movies for infinite scroll
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const prefetchedMoviesRef = useRef<Set<number>>(new Set()) // Track prefetched movie details
  const [hideMarkedMovies, setHideMarkedMovies] = useState(false) // Filter out movies with marked responses
  
  // Filters state
  const [filters, setFilters] = useState({
    minRating: 5.0,
    minVoteCount: 100,
    genres: [] as number[],
    year: search.year ? parseInt(search.year) : undefined,
    minRuntime: undefined as number | undefined,
    maxRuntime: undefined as number | undefined,
    sortBy: 'popularity.desc' as const,
    source: 'discover' as const,
    releaseDateGte: (() => {
      // Default to last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return thirtyDaysAgo.toISOString().split('T')[0]
    })(),
    releaseDateLte: undefined as string | undefined,
  })

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)

  // Sync URL with tab and language state
  useEffect(() => {
    if (search.tab !== activeTab || search.language !== languageFilter) {
      navigate({
        to: "/movies",
        // @ts-ignore
        search: { ...search, tab: activeTab, language: languageFilter },
      })
    }
  }, [activeTab, languageFilter, navigate, search])

  // Sync URL filters with state
  useEffect(() => {
    if (search.genre && !filters.genres.includes(parseInt(search.genre))) {
      setFilters(prev => ({
        ...prev,
        genres: [parseInt(search.genre!)]
      }))
    }
  }, [search.genre])

  // Get language-specific filter parameters
  const getLanguageFilters = () => {
    switch (languageFilter) {
      case 'bollywood':
        return { originalLanguage: 'hi' }
      case 'korean':
        return { originCountry: 'KR' }
      case 'english':
        return { originalLanguage: 'en' }
      default:
        return {}
    }
  }

  // API queries
  const { 
    data: moviesData, 
    isLoading: moviesLoading, 
    refetch: refetchMovies 
  } = trpc.movies.discoverMovies.useQuery(
    { ...filters, ...getLanguageFilters(), page: currentPage },
    { enabled: activeTab === 'discover' }
  )

  const { 
    data: searchResults, 
    isLoading: searchLoading 
  } = trpc.movies.searchMovies.useQuery(
    { query: searchQuery, page: currentPage },
    { enabled: activeTab === 'search' && searchQuery.length > 0 }
  )

  const { 
    data: watchlistData, 
    isLoading: watchlistLoading,
    refetch: refetchWatchlist 
  } = trpc.movies.getWatchlist.useQuery(
    { page: currentPage },
    { enabled: activeTab === 'watchlist' }
  )

  // Get full watchlist for filtering and status badges (separate from paginated watchlist above)
  const { data: fullWatchlistData } = trpc.movies.getWatchlist.useQuery(
    { page: 1, limit: 1000 } // Get a large number to capture most watchlist items
    // Always fetch for status badges on cards
  )

  const { 
    data: movieDetails, 
    isLoading: detailsLoading 
  } = trpc.movies.getMovieDetails.useQuery(
    { tmdbId: selectedMovieId! },
    { enabled: !!selectedMovieId }
  )

  const { data: discoveryStats } = trpc.movies.getDiscoveryStats.useQuery()

  // Get tRPC utils for prefetching
  const utils = trpc.useUtils()

  // Mutations
  const addToWatchlistMutation = trpc.movies.addToWatchlist.useMutation({
    onSuccess: (data) => {
      toast.success(
        data.addedToTodoist 
          ? `Added to watchlist and Todoist!` 
          : `Added to watchlist!`
      )
      refetchWatchlist()
    },
    onError: (error) => {
      toast.error(`Failed to add to watchlist: ${error.message}`)
    }
  })

  const updateStatusMutation = trpc.movies.updateWatchlistStatus.useMutation({
    onSuccess: () => {
      toast.success('Movie status updated!')
      refetchWatchlist()
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`)
    }
  })

  // Event handlers
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    setCurrentPage(1)
    setSelectedMovieId(null)
  }

  const handleMovieClick = (movieId: number) => {
    setSelectedMovieId(movieId)
  }

  const handleAddToWatchlist = (movieId: number, status: 'to_watch' | 'maybe') => {
    addToWatchlistMutation.mutate({
      tmdbId: movieId,
      status,
      addToTodoist: true,
    })
  }

  const handleUpdateStatus = (movieId: number, status: 'to_watch' | 'maybe' | 'watched' | 'skipped') => {
    updateStatusMutation.mutate({
      tmdbId: movieId,
      status,
    })
  }

  const handleFiltersChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setCurrentPage(1)
  }

  const handleLanguageFilterChange = (language: LanguageFilter) => {
    setLanguageFilter(language)
    setCurrentPage(1)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.trim()) {
      setActiveTab('search')
      setCurrentPage(1)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Prefetch movie details for visible movies
  const prefetchMovieDetails = useCallback(async (movies: any[]) => {
    // Prefetch details for first 8 movies that haven't been prefetched yet
    const moviesToPrefetch = movies
      .slice(0, 8)
      .filter(movie => !prefetchedMoviesRef.current.has(movie.tmdbId || movie.id))
      .slice(0, 3) // Only prefetch 3 at a time to avoid overwhelming

    for (const movie of moviesToPrefetch) {
      const movieId = movie.tmdbId || movie.id
      if (movieId) {
        try {
          await utils.movies.getMovieDetails.prefetch({ tmdbId: movieId })
          prefetchedMoviesRef.current.add(movieId)
        } catch (error) {
          // Silently ignore prefetch errors
          console.warn('Failed to prefetch movie details:', movieId)
        }
      }
    }
  }, [utils.movies.getMovieDetails])

  // Update allMovies when new data arrives
  useEffect(() => {
    if (moviesData && activeTab === 'discover') {
      if (currentPage === 1) {
        // Reset for first page or filter changes
        setAllMovies(moviesData.movies)
        prefetchedMoviesRef.current.clear() // Clear prefetch cache on filter change
        // Prefetch details for new movies
        prefetchMovieDetails(moviesData.movies)
      } else {
        // Append new movies for subsequent pages
        setAllMovies(prev => {
          const newMovies = [...prev, ...moviesData.movies]
          // Prefetch details for new movies
          prefetchMovieDetails(newMovies)
          return newMovies
        })
      }
      setIsLoadingMore(false)
    }
  }, [moviesData, activeTab, currentPage]) // Remove prefetchMovieDetails from deps

  useEffect(() => {
    if (searchResults && activeTab === 'search') {
      if (currentPage === 1) {
        setAllMovies(searchResults.movies)
        prefetchedMoviesRef.current.clear() // Clear prefetch cache on new search
        // Prefetch details for search results
        prefetchMovieDetails(searchResults.movies)
      } else {
        setAllMovies(prev => {
          const newMovies = [...prev, ...searchResults.movies]
          // Prefetch details for search results
          prefetchMovieDetails(newMovies)
          return newMovies
        })
      }
      setIsLoadingMore(false)
    }
  }, [searchResults, activeTab, currentPage]) // Remove prefetchMovieDetails from deps

  // Load next page function
  const loadNextPage = useCallback(() => {
    if (isLoadingMore) return
    setIsLoadingMore(true)
    setCurrentPage(prev => prev + 1)
  }, [isLoadingMore])

  // Filter movies based on hideMarkedMovies setting
  const filterMoviesWithMarked = (movies: any[]) => {
    if (!hideMarkedMovies) return movies
    
    // If movie already has status (like in watchlist tab), filter it out
    if (movies.some(movie => movie.status)) {
      return movies.filter(movie => !movie.status || movie.status === null)
    }
    
    // For discover/search movies, check against user's watchlist
    if (!fullWatchlistData?.entries) return movies
    
    const watchlistTmdbIds = new Set(
      fullWatchlistData.entries.map(entry => entry.tmdbId)
    )
    
    return movies.filter(movie => {
      const movieTmdbId = movie.tmdbId || movie.id
      return !watchlistTmdbIds.has(movieTmdbId)
    })
  }

  // Get current data based on active tab
  const getCurrentData = () => {
    switch (activeTab) {
      case 'discover':
        const hasMoreDiscoverPages = moviesData ? currentPage < moviesData.totalPages : false
        return {
          movies: filterMoviesWithMarked(allMovies),
          isLoading: moviesLoading,
          hasNextPage: hasMoreDiscoverPages,
          isFetchingNextPage: isLoadingMore,
          fetchNextPage: loadNextPage,
          pagination: moviesData ? {
            page: moviesData.page,
            totalPages: moviesData.totalPages,
            totalResults: moviesData.totalResults
          } : null
        }
      case 'search':
        const hasMoreSearchPages = searchResults ? currentPage < searchResults.totalPages : false
        return {
          movies: filterMoviesWithMarked(allMovies),
          isLoading: searchLoading,
          hasNextPage: hasMoreSearchPages,
          isFetchingNextPage: isLoadingMore,
          fetchNextPage: loadNextPage,
          pagination: searchResults ? {
            page: searchResults.page,
            totalPages: searchResults.totalPages,
            totalResults: searchResults.totalResults
          } : null
        }
      case 'watchlist':
        return {
          movies: watchlistData?.entries || [],
          isLoading: watchlistLoading,
          hasNextPage: false,
          isFetchingNextPage: false,
          fetchNextPage: () => {},
          pagination: watchlistData ? {
            page: watchlistData.pagination.page,
            totalPages: watchlistData.pagination.totalPages,
            totalResults: watchlistData.pagination.total
          } : null
        }
      case 'debug':
        return { movies: [], isLoading: false, hasNextPage: false, isFetchingNextPage: false, fetchNextPage: () => {}, pagination: null }
      default:
        return { movies: [], isLoading: false, hasNextPage: false, isFetchingNextPage: false, fetchNextPage: () => {}, pagination: null }
    }
  }

  const currentData = getCurrentData()
  const { movies, isLoading, pagination } = currentData
  const hasMorePages = currentData.hasNextPage
  const isFetchingMore = currentData.isFetchingNextPage
  const fetchMore = currentData.fetchNextPage

  // Auto-select first movie when movies load or filter changes
  useEffect(() => {
    if (movies.length > 0 && !isLoading) {
      const firstMovie = movies[0]
      const movieId = firstMovie.tmdbId || firstMovie.id
      if (movieId && selectedMovieId !== movieId) {
        setSelectedMovieId(movieId)
        setSelectedMovieIndex(0)
      }
    }
  }, [movies.length, isLoading, hideMarkedMovies, activeTab, selectedMovieId]) // Use movies.length instead of movies array

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
      document.documentElement.offsetHeight - 1000 && // Load more when 1000px from bottom
      hasMorePages &&
      !isFetchingMore &&
      (activeTab === 'discover' || activeTab === 'search')
    ) {
      fetchMore()
    }
  }, [hasMorePages, isFetchingMore, fetchMore, activeTab])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  // Navigation functions for hotkeys
  const navigateToNext = useCallback(() => {
    if (movies.length === 0) return
    const newIndex = selectedMovieIndex < movies.length - 1 ? selectedMovieIndex + 1 : selectedMovieIndex
    if (newIndex !== selectedMovieIndex) {
      setSelectedMovieIndex(newIndex)
      const movie = movies[newIndex]
      setSelectedMovieId(movie.tmdbId || movie.id!)
    }
  }, [selectedMovieIndex, movies])

  const navigateToPrevious = useCallback(() => {
    if (movies.length === 0) return
    const newIndex = selectedMovieIndex > 0 ? selectedMovieIndex - 1 : 0
    if (newIndex !== selectedMovieIndex) {
      setSelectedMovieIndex(newIndex)
      const movie = movies[newIndex]
      setSelectedMovieId(movie.tmdbId || movie.id!)
    }
  }, [selectedMovieIndex, movies])

  const openSelectedMovie = useCallback(() => {
    if (selectedMovieIndex >= 0 && selectedMovieIndex < movies.length) {
      const movie = movies[selectedMovieIndex]
      handleMovieClick(movie.tmdbId || movie.id!)
    }
  }, [selectedMovieIndex, movies, handleMovieClick])

  const clearSelection = useCallback(() => {
    setSelectedMovieIndex(-1)
    setSelectedMovieId(null)
  }, [])

  // Keyboard navigation with react-hotkeys-hook
  useHotkeys('right,down', navigateToNext, { enableOnFormTags: false })
  useHotkeys('left,up', navigateToPrevious, { enableOnFormTags: false })
  useHotkeys('enter', openSelectedMovie, { enableOnFormTags: false })
  useHotkeys('escape', clearSelection, { enableOnFormTags: false })

  // Reset selected index and clear movies when filters change
  useEffect(() => {
    setSelectedMovieIndex(-1)
    setSelectedMovieId(null)
    setAllMovies([]) // Clear accumulated movies when filters change
    prefetchedMoviesRef.current.clear() // Clear prefetch cache when filters change
    setCurrentPage(1)
  }, [activeTab, languageFilter, filters, searchQuery])

  return (
    <div className="min-h-screen bg-background">
      <div className="px-6 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">🎬 Movie Discovery</h1>
          <p className="text-muted-foreground">
            Discover quality movies to stream at home. Find movies with 5+ ratings and save them to your Todoist.
          </p>
          
          {/* Stats */}
          {discoveryStats && (
            <div className="flex gap-4 mt-4 text-sm">
              <div className="bg-card px-3 py-1 rounded border">
                📊 {discoveryStats.totalMoviesShown} movies shown
              </div>
              <div className="bg-card px-3 py-1 rounded border">
                ⭐ {discoveryStats.toWatchCount} to watch
              </div>
              <div className="bg-card px-3 py-1 rounded border">
                💬 {discoveryStats.maybeCount} ask Ayesha
              </div>
              <div className="bg-card px-3 py-1 rounded border">
                ✅ {discoveryStats.watchedCount} watched
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1">
            {/* Tabs */}
            <div className="flex border-b border-border mb-6">
              <button
                onClick={() => handleTabChange('discover')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'discover'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                🔍 Discover
              </button>
              <button
                onClick={() => handleTabChange('watchlist')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'watchlist'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                📋 Watchlist
              </button>
              <button
                onClick={() => handleTabChange('debug')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'debug'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                🐛 Debug
              </button>
            </div>

            {/* Language Filter Tabs - Only show on discover tab */}
            {activeTab === 'discover' && (
              <div className="flex border-b border-border mb-4">
                <button
                  onClick={() => handleLanguageFilterChange('all')}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    languageFilter === 'all'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  🌍 All Languages
                </button>
                <button
                  onClick={() => handleLanguageFilterChange('english')}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    languageFilter === 'english'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  🇺🇸 English
                </button>
                <button
                  onClick={() => handleLanguageFilterChange('bollywood')}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    languageFilter === 'bollywood'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  🇮🇳 Bollywood
                </button>
                <button
                  onClick={() => handleLanguageFilterChange('korean')}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    languageFilter === 'korean'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  🇰🇷 Korean
                </button>
              </div>
            )}

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for movies..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div className="absolute right-3 top-2.5 text-muted-foreground">
                  🔍
                </div>
              </div>
              
              {/* Keyboard shortcuts hint */}
              {activeTab === 'discover' && movies.length > 0 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  💡 Use arrow keys to navigate movies, Enter to view details, Escape to deselect
                </div>
              )}

              {/* Hide Marked Movies Filter */}
              <div className="mt-3 flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hideMarkedMovies}
                    onChange={(e) => setHideMarkedMovies(e.target.checked)}
                    className="rounded border-border"
                  />
                  Hide movies with marked responses (Watched, Ask Ayesha, etc.)
                </label>
              </div>
            </div>

            {/* Filters (only show on discover tab) */}
            {activeTab === 'discover' && (
              <MovieFilters
                filters={filters}
                onChange={handleFiltersChange}
                onRefresh={() => refetchMovies()}
              />
            )}

            {/* Content based on active tab */}
            {activeTab === 'watchlist' ? (
              <WatchlistTab
                watchlistData={watchlistData}
                isLoading={watchlistLoading}
                onMovieClick={handleMovieClick}
                onUpdateStatus={handleUpdateStatus}
                pagination={pagination}
                onPageChange={handlePageChange}
              />
            ) : activeTab === 'debug' ? (
              <DebugTab />
            ) : (
              <>
                {/* Movies Grid */}
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="bg-card rounded-lg overflow-hidden border animate-pulse">
                        <div className="aspect-[2/3] bg-muted" />
                        <div className="p-4 space-y-2">
                          <div className="h-4 bg-muted rounded" />
                          <div className="h-3 bg-muted rounded w-2/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : movies.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {movies.map((movie: any, index: number) => (
                      <MovieCard
                        key={movie.tmdbId || movie.id}
                        movie={movie}
                        onClick={() => handleMovieClick(movie.tmdbId || movie.id)}
                        onAddToWatchlist={handleAddToWatchlist}
                        showWatchlistActions={true}
                        addToWatchlistLoading={addToWatchlistMutation.isLoading}
                        isSelected={selectedMovieIndex === index}
                        watchlistData={fullWatchlistData?.entries?.map(entry => ({
                          tmdbId: entry.tmdbId,
                          status: entry.status
                        }))}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🎬</div>
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      {activeTab === 'search' ? 'No movies found' : 'No movies to show'}
                    </h3>
                    <p className="text-muted-foreground">
                      {activeTab === 'search' 
                        ? 'Try searching for a different movie title'
                        : 'Try adjusting your filters or refresh the page'
                      }
                    </p>
                  </div>
                )}

                {/* Infinite scroll loading indicator */}
                {isFetchingMore && (
                  <div className="flex justify-center items-center gap-2 mt-8 py-4">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-muted-foreground">Loading more movies...</span>
                  </div>
                )}

                {/* End of results indicator */}
                {!hasMorePages && movies.length > 0 && (activeTab === 'discover' || activeTab === 'search') && (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground">
                      🎬 That's all the movies we found!
                    </div>
                  </div>
                )}

                {/* Pagination for watchlist only */}
                {(activeTab as TabType) === 'watchlist' && pagination && pagination.totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
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
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-1 border border-border rounded ${
                              page === pagination.page
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-accent'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="px-3 py-1 border border-border rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Movie Details Sidebar */}
          {selectedMovieId && (
            <div className="w-1/2 flex-shrink-0">
              <MovieDetails
                movie={movieDetails}
                isLoading={detailsLoading}
                onClose={() => setSelectedMovieId(null)}
                onAddToWatchlist={handleAddToWatchlist}
                onUpdateStatus={handleUpdateStatus}
                addToWatchlistLoading={addToWatchlistMutation.isLoading}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MoviesScreen