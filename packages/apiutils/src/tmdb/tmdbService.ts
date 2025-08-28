import { axiosGet } from "../axios"
import { reportErrorToSentry } from "../sentry"
import { 
  TMDbMovie, 
  TMDbDiscoverResponse, 
  TMDbVideosResponse, 
  TMDbWatchProvidersResponse,
  TMDbSearchResponse,
  ProcessedMovie,
  MovieDiscoveryFilters,
  MovieSearchParams,
  TMDbVideo
} from "./types"

export class TMDbService {
  private readonly baseUrl = "https://api.themoviedb.org/3"
  private readonly apiToken: string

  constructor(apiToken: string) {
    this.apiToken = apiToken
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json',
    }
  }

  /**
   * Discover movies with filters - main endpoint for movie discovery
   */
  async discoverMovies(filters: MovieDiscoveryFilters = {}): Promise<TMDbDiscoverResponse> {
    const params = {
      page: filters.page || 1,
      'vote_average.gte': filters.minRating || 5.0,
      'vote_count.gte': filters.minVoteCount || 100,
      with_genres: filters.genres?.join(','),
      year: filters.year,
      'with_runtime.gte': filters.minRuntime,
      'with_runtime.lte': filters.maxRuntime,
      region: filters.region || 'US',
      sort_by: filters.sortBy || 'popularity.desc',
      include_adult: false,
      include_video: false,
      language: 'en-US',
      with_original_language: filters.originalLanguage,
      with_origin_country: filters.originCountry,
      'release_date.gte': filters.releaseDateGte,
      'release_date.lte': filters.releaseDateLte,
    }

    // Remove undefined values
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined)
    )

    try {
      const response = await axiosGet<TMDbDiscoverResponse>(
        `${this.baseUrl}/discover/movie`,
        this.getHeaders(),
        "tmdb-discover-movies",
        { queryParams: cleanParams, timeout: 10000 }
      )

      return response
    } catch (error: any) {
      reportErrorToSentry(error, "tmdb-discover-movies-error", { filters })
      throw new Error(`Failed to discover movies: ${error.message}`)
    }
  }

  /**
   * Get detailed movie information by TMDb ID
   */
  async getMovieDetails(movieId: number): Promise<TMDbMovie> {
    try {
      const response = await axiosGet<TMDbMovie>(
        `${this.baseUrl}/movie/${movieId}`,
        this.getHeaders(),
        "tmdb-movie-details",
        { 
          queryParams: { 
            language: 'en-US',
            append_to_response: 'credits,keywords,similar,recommendations'
          }, 
          timeout: 10000 
        }
      )

      return response
    } catch (error: any) {
      reportErrorToSentry(error, "tmdb-movie-details-error", { movieId })
      throw new Error(`Failed to get movie details for ID ${movieId}: ${error.message}`)
    }
  }

  /**
   * Get movie trailers and videos
   */
  async getMovieVideos(movieId: number): Promise<TMDbVideosResponse> {
    try {
      const response = await axiosGet<TMDbVideosResponse>(
        `${this.baseUrl}/movie/${movieId}/videos`,
        this.getHeaders(),
        "tmdb-movie-videos",
        { queryParams: { language: 'en-US' }, timeout: 10000 }
      )

      return response
    } catch (error: any) {
      reportErrorToSentry(error, "tmdb-movie-videos-error", { movieId })
      throw new Error(`Failed to get movie videos for ID ${movieId}: ${error.message}`)
    }
  }

  /**
   * Get streaming availability for a movie
   */
  async getStreamingProviders(movieId: number): Promise<TMDbWatchProvidersResponse> {
    try {
      const response = await axiosGet<TMDbWatchProvidersResponse>(
        `${this.baseUrl}/movie/${movieId}/watch/providers`,
        this.getHeaders(),
        "tmdb-streaming-providers",
        { timeout: 10000 }
      )

      return response
    } catch (error: any) {
      reportErrorToSentry(error, "tmdb-streaming-providers-error", { movieId })
      throw new Error(`Failed to get streaming providers for ID ${movieId}: ${error.message}`)
    }
  }

  /**
   * Search for movies by title
   */
  async searchMovies(params: MovieSearchParams): Promise<TMDbSearchResponse> {
    const queryParams = {
      query: params.query,
      page: params.page || 1,
      year: params.year,
      region: params.region || 'US',
      language: 'en-US',
      include_adult: false,
    }

    // Remove undefined values
    const cleanParams = Object.fromEntries(
      Object.entries(queryParams).filter(([_, value]) => value !== undefined)
    )

    try {
      const response = await axiosGet<TMDbSearchResponse>(
        `${this.baseUrl}/search/movie`,
        this.getHeaders(),
        "tmdb-search-movies",
        { queryParams: cleanParams, timeout: 10000 }
      )

      return response
    } catch (error: any) {
      reportErrorToSentry(error, "tmdb-search-movies-error", { params })
      throw new Error(`Failed to search movies: ${error.message}`)
    }
  }

  /**
   * Get trending movies
   */
  async getTrendingMovies(timeWindow: 'day' | 'week' = 'week', page: number = 1): Promise<TMDbDiscoverResponse> {
    try {
      const response = await axiosGet<TMDbDiscoverResponse>(
        `${this.baseUrl}/trending/movie/${timeWindow}`,
        this.getHeaders(),
        "tmdb-trending-movies",
        { queryParams: { page, language: 'en-US' }, timeout: 10000 }
      )

      return response
    } catch (error: any) {
      reportErrorToSentry(error, "tmdb-trending-movies-error", { timeWindow, page })
      throw new Error(`Failed to get trending movies: ${error.message}`)
    }
  }

  /**
   * Get popular movies
   */
  async getPopularMovies(page: number = 1, region: string = 'US'): Promise<TMDbDiscoverResponse> {
    try {
      const response = await axiosGet<TMDbDiscoverResponse>(
        `${this.baseUrl}/movie/popular`,
        this.getHeaders(),
        "tmdb-popular-movies",
        { queryParams: { page, region, language: 'en-US' }, timeout: 10000 }
      )

      return response
    } catch (error: any) {
      reportErrorToSentry(error, "tmdb-popular-movies-error", { page, region })
      throw new Error(`Failed to get popular movies: ${error.message}`)
    }
  }

  /**
   * Get now playing movies (currently in theaters)
   */
  async getNowPlayingMovies(page: number = 1, region: string = 'US'): Promise<TMDbDiscoverResponse> {
    try {
      const response = await axiosGet<TMDbDiscoverResponse>(
        `${this.baseUrl}/movie/now_playing`,
        this.getHeaders(),
        "tmdb-now-playing-movies",
        { queryParams: { page, region, language: 'en-US' }, timeout: 10000 }
      )

      return response
    } catch (error: any) {
      reportErrorToSentry(error, "tmdb-now-playing-movies-error", { page, region })
      throw new Error(`Failed to get now playing movies: ${error.message}`)
    }
  }

  /**
   * Get upcoming movies
   */
  async getUpcomingMovies(page: number = 1, region: string = 'US'): Promise<TMDbDiscoverResponse> {
    try {
      const response = await axiosGet<TMDbDiscoverResponse>(
        `${this.baseUrl}/movie/upcoming`,
        this.getHeaders(),
        "tmdb-upcoming-movies",
        { queryParams: { page, region, language: 'en-US' }, timeout: 10000 }
      )

      return response
    } catch (error: any) {
      reportErrorToSentry(error, "tmdb-upcoming-movies-error", { page, region })
      throw new Error(`Failed to get upcoming movies: ${error.message}`)
    }
  }

  /**
   * Process a TMDb movie response into our internal format with trailer URL
   */
  async processMovieData(movie: TMDbMovie): Promise<ProcessedMovie> {
    try {
      // Get trailer URL
      let trailerUrl: string | undefined
      try {
        const videosResponse = await this.getMovieVideos(movie.id)
        const trailer = this.findBestTrailer(videosResponse.results)
        if (trailer) {
          trailerUrl = `https://www.youtube.com/watch?v=${trailer.key}`
        }
      } catch (error) {
        // Don't fail the whole process if trailer fetch fails
        console.warn(`Failed to get trailer for movie ${movie.id}:`, error)
      }

      // Get streaming providers
      let watchProviders
      try {
        const providersResponse = await this.getStreamingProviders(movie.id)
        watchProviders = providersResponse.results.US // Default to US region
      } catch (error) {
        // Don't fail the whole process if providers fetch fails
        console.warn(`Failed to get streaming providers for movie ${movie.id}:`, error)
      }

      return {
        tmdbId: movie.id,
        imdbId: movie.imdb_id,
        title: movie.title,
        originalTitle: movie.original_title,
        overview: movie.overview,
        posterPath: movie.poster_path,
        backdropPath: movie.backdrop_path,
        voteAverage: movie.vote_average,
        voteCount: movie.vote_count,
        popularity: movie.popularity,
        releaseDate: movie.release_date,
        runtime: movie.runtime,
        status: movie.status,
        tagline: movie.tagline,
        genres: movie.genres,
        productionCompanies: movie.production_companies,
        productionCountries: movie.production_countries,
        spokenLanguages: movie.spoken_languages,
        originalLanguage: movie.original_language,
        adult: movie.adult,
        budget: movie.budget,
        revenue: movie.revenue,
        homepage: movie.homepage,
        trailerUrl,
        watchProviders,
      }
    } catch (error: any) {
      reportErrorToSentry(error, "tmdb-process-movie-data-error", { movieId: movie.id })
      throw new Error(`Failed to process movie data for ID ${movie.id}: ${error.message}`)
    }
  }

  /**
   * Find the best trailer from a list of videos
   */
  private findBestTrailer(videos: TMDbVideo[]): TMDbVideo | undefined {
    // Filter for YouTube trailers only
    const trailers = videos.filter(
      video => video.site === 'YouTube' && video.type === 'Trailer'
    )

    if (trailers.length === 0) {
      // Fall back to any YouTube video if no trailers
      const youtubeVideos = videos.filter(video => video.site === 'YouTube')
      return youtubeVideos[0]
    }

    // Prefer official trailers
    const officialTrailers = trailers.filter(trailer => trailer.official)
    if (officialTrailers.length > 0) {
      // Sort by size (higher is better quality) and return the best
      return officialTrailers.sort((a, b) => b.size - a.size)[0]
    }

    // Fall back to any trailer, sorted by size
    return trailers.sort((a, b) => b.size - a.size)[0]
  }

  /**
   * Get TMDb image URL with proper base path
   */
  getImageUrl(imagePath: string | null | undefined, size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500'): string | null {
    if (!imagePath) return null
    return `https://image.tmdb.org/t/p/${size}${imagePath}`
  }

  /**
   * Get movies suitable for streaming at home with quality filters
   */
  async getQualityMoviesForStreaming(filters: MovieDiscoveryFilters = {}): Promise<TMDbDiscoverResponse> {
    const qualityFilters: MovieDiscoveryFilters = {
      minRating: 5.0,
      minVoteCount: 100,
      ...filters,
    }

    return this.discoverMovies(qualityFilters)
  }
}