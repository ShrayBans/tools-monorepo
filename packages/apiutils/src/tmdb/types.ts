// TMDb API Response Types

export interface TMDbMovie {
  id: number
  imdb_id?: string
  title: string
  original_title?: string
  overview?: string
  poster_path?: string
  backdrop_path?: string
  vote_average: number
  vote_count: number
  popularity: number
  release_date?: string
  runtime?: number
  status?: string
  tagline?: string
  genres?: TMDbGenre[]
  production_companies?: TMDbProductionCompany[]
  production_countries?: TMDbProductionCountry[]
  spoken_languages?: TMDbSpokenLanguage[]
  original_language?: string
  adult: boolean
  budget?: number
  revenue?: number
  homepage?: string
  belongs_to_collection?: TMDbCollection
}

export interface TMDbGenre {
  id: number
  name: string
}

export interface TMDbProductionCompany {
  id: number
  logo_path?: string
  name: string
  origin_country: string
}

export interface TMDbProductionCountry {
  iso_3166_1: string
  name: string
}

export interface TMDbSpokenLanguage {
  english_name: string
  iso_639_1: string
  name: string
}

export interface TMDbCollection {
  id: number
  name: string
  poster_path?: string
  backdrop_path?: string
}

export interface TMDbDiscoverResponse {
  page: number
  results: TMDbMovie[]
  total_pages: number
  total_results: number
}

export interface TMDbVideo {
  id: string
  iso_639_1: string
  iso_3166_1: string
  key: string
  name: string
  official: boolean
  published_at: string
  site: string // "YouTube", "Vimeo"
  size: number // 360, 480, 720, 1080
  type: string // "Trailer", "Teaser", "Clip", "Featurette"
}

export interface TMDbVideosResponse {
  id: number
  results: TMDbVideo[]
}

export interface TMDbWatchProvider {
  display_priority: number
  logo_path: string
  provider_id: number
  provider_name: string
}

export interface TMDbWatchProvidersRegion {
  link?: string
  flatrate?: TMDbWatchProvider[]
  rent?: TMDbWatchProvider[]
  buy?: TMDbWatchProvider[]
}

export interface TMDbWatchProvidersResponse {
  id: number
  results: {
    [region: string]: TMDbWatchProvidersRegion
  }
}

export interface TMDbSearchResponse {
  page: number
  results: TMDbMovie[]
  total_pages: number
  total_results: number
}

// Application-specific types for processed data
export interface ProcessedMovie {
  tmdbId: number
  imdbId?: string
  title: string
  originalTitle?: string
  overview?: string
  posterPath?: string
  backdropPath?: string
  voteAverage: number
  voteCount: number
  popularity: number
  releaseDate?: string
  runtime?: number
  status?: string
  tagline?: string
  genres?: TMDbGenre[]
  productionCompanies?: TMDbProductionCompany[]
  productionCountries?: TMDbProductionCountry[]
  spokenLanguages?: TMDbSpokenLanguage[]
  originalLanguage?: string
  adult: boolean
  budget?: number
  revenue?: number
  homepage?: string
  trailerUrl?: string
  watchProviders?: TMDbWatchProvidersRegion
}

export interface MovieDiscoveryFilters {
  minRating?: number
  minVoteCount?: number
  genres?: number[]
  year?: number
  minRuntime?: number
  maxRuntime?: number
  region?: string
  page?: number
  sortBy?: 'popularity.desc' | 'release_date.desc' | 'vote_average.desc' | 'vote_count.desc'
  originalLanguage?: string
  originCountry?: string
  releaseDateGte?: string // Release date greater than or equal to (YYYY-MM-DD)
  releaseDateLte?: string // Release date less than or equal to (YYYY-MM-DD)
}

export interface MovieSearchParams {
  query: string
  page?: number
  year?: number
  region?: string
}