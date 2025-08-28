import { axiosPost } from "@shray/apiutils/src/axios"
import { getRedisCache, setRedisCache } from "@shray/apiutils/src/redisBase"
import { reportErrorToSentry } from "@shray/apiutils/src/sentry"
import { TMDbService } from "@shray/apiutils/src/tmdb"
import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm"
import { z } from "zod"

import { getDb } from "../db"
import {
  movieDiscoveryHistory,
  movies,
  movieStreamingAvailability,
  movieWatchlist,
  NewMovie,
  NewMovieDiscoveryHistory,
  NewMovieStreamingAvailability,
  NewMovieWatchlist,
} from "../db/schema"
import { createTRPCRouter, protectedProcedure } from "../lib/trpc"

export const moviesRouter = createTRPCRouter({
  /**
   * Discover movies with filters - main endpoint for movie discovery
   */
  discoverMovies: protectedProcedure
    .input(
      z.object({
        minRating: z.number().min(0).max(10).default(5.0),
        minVoteCount: z.number().min(1).default(100),
        genres: z.array(z.number()).optional(),
        year: z.number().optional(),
        minRuntime: z.number().optional(),
        maxRuntime: z.number().optional(),
        page: z.number().min(1).default(1),
        sortBy: z.enum(['popularity.desc', 'release_date.desc', 'vote_average.desc', 'vote_count.desc']).default('popularity.desc'),
        source: z.enum(['discover', 'trending', 'popular', 'now_playing', 'upcoming']).default('discover'),
        useCache: z.boolean().default(true),
        originalLanguage: z.string().optional(),
        originCountry: z.string().optional(),
        releaseDateGte: z.string().optional(), // Release date greater than or equal to (YYYY-MM-DD)
        releaseDateLte: z.string().optional(), // Release date less than or equal to (YYYY-MM-DD)
      })
    )
    .query(async ({ input, ctx }) => {
      const { user } = ctx
      const tmdbService = new TMDbService(process.env.TMDB_API_TOKEN!)

      try {
        // Create cache key based on input
        const cacheKey = `movies_discover_${JSON.stringify(input)}`

        // Check cache first
        if (input.useCache) {
          const cached = await getRedisCache(cacheKey)
          if (cached) {
            return cached
          }
        }

        let tmdbResponse

        // Get movies based on source
        switch (input.source) {
          case 'trending':
            tmdbResponse = await tmdbService.getTrendingMovies('week', input.page)
            break
          case 'popular':
            tmdbResponse = await tmdbService.getPopularMovies(input.page)
            break
          case 'now_playing':
            tmdbResponse = await tmdbService.getNowPlayingMovies(input.page)
            break
          case 'upcoming':
            tmdbResponse = await tmdbService.getUpcomingMovies(input.page)
            break
          default:
            tmdbResponse = await tmdbService.discoverMovies({
              minRating: input.minRating,
              minVoteCount: input.minVoteCount,
              genres: input.genres,
              year: input.year,
              minRuntime: input.minRuntime,
              maxRuntime: input.maxRuntime,
              page: input.page,
              sortBy: input.sortBy,
              originalLanguage: input.originalLanguage,
              originCountry: input.originCountry,
              releaseDateGte: input.releaseDateGte,
              releaseDateLte: input.releaseDateLte,
            })
        }

        // Filter movies by rating if not using discover
        let filteredMovies = tmdbResponse.results
        if (input.source !== 'discover') {
          filteredMovies = tmdbResponse.results.filter(movie =>
            movie.vote_average >= input.minRating &&
            movie.vote_count >= input.minVoteCount
          )
        }

        const db = await getDb()

        // Track discovery history for the user
        const movieIds = filteredMovies.map(movie => movie.id)
        if (movieIds.length > 0) {
          // Upsert movies to database
          for (const movie of filteredMovies) {
            try {
              await db.insert(movies)
                .values({
                  tmdbId: movie.id,
                  imdbId: movie.imdb_id,
                  title: movie.title,
                  originalTitle: movie.original_title,
                  overview: movie.overview,
                  posterPath: movie.poster_path,
                  backdropPath: movie.backdrop_path,
                  voteAverage: movie.vote_average.toString(),
                  voteCount: movie.vote_count,
                  popularity: movie.popularity.toString(),
                  releaseDate: movie.release_date,
                  runtime: movie.runtime,
                  status: movie.status,
                  tagline: movie.tagline,
                  genres: movie.genres,
                  productionCompanies: movie.production_companies,
                  productionCountries: movie.production_countries,
                  spokenLanguages: movie.spoken_languages,
                  originalLanguage: movie.original_language,
                  adult: movie.adult.toString(),
                  budget: movie.budget,
                  revenue: movie.revenue,
                  homepage: movie.homepage,
                })
                .onConflictDoUpdate({
                  target: movies.tmdbId,
                  set: {
                    title: movie.title,
                    overview: movie.overview,
                    voteAverage: movie.vote_average.toString(),
                    voteCount: movie.vote_count,
                    popularity: movie.popularity.toString(),
                    lastUpdated: new Date(),
                  }
                })
            } catch (error) {
              // Continue if individual movie fails
              console.warn(`Failed to upsert movie ${movie.id}:`, error)
            }
          }

          // Record discovery history
          try {
            const existingMovies = await db.select().from(movies).where(
              inArray(movies.tmdbId, movieIds)
            )

            const historyEntries: NewMovieDiscoveryHistory[] = existingMovies.map(movie => ({
              userId: user.id,
              movieId: movie.id,
              discoverySource: input.source,
              discoveryContext: input,
            }))

            if (historyEntries.length > 0) {
              await db.insert(movieDiscoveryHistory).values(historyEntries)
            }
          } catch (error) {
            // Don't fail the request if history tracking fails
            console.warn('Failed to record discovery history:', error)
          }
        }

        // Get streaming providers for the first few movies for better performance
        const moviesWithStreamingData = await Promise.all(
          filteredMovies.slice(0, 20).map(async (movie) => {
            try {
              const streamingProviders = await tmdbService.getStreamingProviders(movie.id)
              return {
                tmdbId: movie.id,
                title: movie.title,
                overview: movie.overview,
                posterPath: movie.poster_path ? tmdbService.getImageUrl(movie.poster_path, 'w500') : null,
                backdropPath: movie.backdrop_path ? tmdbService.getImageUrl(movie.backdrop_path, 'w780') : null,
                voteAverage: movie.vote_average,
                voteCount: movie.vote_count,
                releaseDate: movie.release_date,
                runtime: movie.runtime,
                genres: movie.genres,
                streamingProviders: streamingProviders.results.US || null,
              }
            } catch (error) {
              // Return movie without streaming data if provider fetch fails
              return {
                tmdbId: movie.id,
                title: movie.title,
                overview: movie.overview,
                posterPath: movie.poster_path ? tmdbService.getImageUrl(movie.poster_path, 'w500') : null,
                backdropPath: movie.backdrop_path ? tmdbService.getImageUrl(movie.backdrop_path, 'w780') : null,
                voteAverage: movie.vote_average,
                voteCount: movie.vote_count,
                releaseDate: movie.release_date,
                runtime: movie.runtime,
                genres: movie.genres,
                streamingProviders: null,
              }
            }
          })
        )

        // For remaining movies (if any), return without streaming data
        const remainingMovies = filteredMovies.slice(20).map(movie => ({
          tmdbId: movie.id,
          title: movie.title,
          overview: movie.overview,
          posterPath: movie.poster_path ? tmdbService.getImageUrl(movie.poster_path, 'w500') : null,
          backdropPath: movie.backdrop_path ? tmdbService.getImageUrl(movie.backdrop_path, 'w780') : null,
          voteAverage: movie.vote_average,
          voteCount: movie.vote_count,
          releaseDate: movie.release_date,
          runtime: movie.runtime,
          genres: movie.genres,
          streamingProviders: null,
        }))

        const result = {
          page: tmdbResponse.page,
          totalPages: tmdbResponse.total_pages,
          totalResults: tmdbResponse.total_results,
          movies: [...moviesWithStreamingData, ...remainingMovies]
        }

        // Cache the result for 1 hour
        if (input.useCache) {
          await setRedisCache(cacheKey, result, 3600)
        }

        return result
      } catch (error: any) {
        reportErrorToSentry(error, "movies-discover-error", { input, userId: user.id })
        throw new Error(`Failed to discover movies: ${error.message}`)
      }
    }),

  /**
   * Get detailed movie information including trailers and streaming availability
   */
  getMovieDetails: protectedProcedure
    .input(z.object({
      tmdbId: z.number(),
      useCache: z.boolean().default(true),
    }))
    .query(async ({ input }) => {
      const tmdbService = new TMDbService(process.env.TMDB_API_TOKEN!)

      try {
        const cacheKey = `movie_details_${input.tmdbId}`

        // Check cache first
        if (input.useCache) {
          const cached = await getRedisCache(cacheKey)
          if (cached) {
            return cached
          }
        }

        // Get detailed movie info with trailers and streaming
        const [movieDetails, videos, streamingProviders] = await Promise.all([
          tmdbService.getMovieDetails(input.tmdbId),
          tmdbService.getMovieVideos(input.tmdbId),
          tmdbService.getStreamingProviders(input.tmdbId),
        ])

        // Find best trailer
        const trailer = videos.results.find(video =>
          video.site === 'YouTube' && video.type === 'Trailer'
        ) || videos.results.find(video => video.site === 'YouTube')

        const result = {
          ...movieDetails,
          posterPath: movieDetails.poster_path ? tmdbService.getImageUrl(movieDetails.poster_path, 'w500') : null,
          backdropPath: movieDetails.backdrop_path ? tmdbService.getImageUrl(movieDetails.backdrop_path, 'original') : null,
          trailerUrl: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null,
          streamingProviders: streamingProviders.results.US || null,
        }

        // Cache for 4 hours
        if (input.useCache) {
          await setRedisCache(cacheKey, result, 14400)
        }

        return result
      } catch (error: any) {
        reportErrorToSentry(error, "movies-details-error", { input })
        throw new Error(`Failed to get movie details: ${error.message}`)
      }
    }),

  /**
   * Add movie to user's watchlist with optional task integration
   */
  addToWatchlist: protectedProcedure
    .input(z.object({
      tmdbId: z.number(),
      status: z.enum(['to_watch', 'maybe', 'watched', 'skipped']).default('to_watch'),
      notes: z.string().optional(),
      addTotask: z.boolean().default(true),
      taskProjectId: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { user } = ctx
      const db = await getDb()

      try {
        // Get or create movie in database
        let movie = await db.select().from(movies).where(eq(movies.tmdbId, input.tmdbId)).limit(1)

        if (movie.length === 0) {
          // Fetch movie details from TMDb and save
          const tmdbService = new TMDbService(process.env.TMDB_API_TOKEN!)
          const movieDetails = await tmdbService.getMovieDetails(input.tmdbId)

          const newMovie: NewMovie = {
            tmdbId: movieDetails.id,
            imdbId: movieDetails.imdb_id,
            title: movieDetails.title,
            originalTitle: movieDetails.original_title,
            overview: movieDetails.overview,
            posterPath: movieDetails.poster_path,
            backdropPath: movieDetails.backdrop_path,
            voteAverage: movieDetails.vote_average.toString(),
            voteCount: movieDetails.vote_count,
            popularity: movieDetails.popularity.toString(),
            releaseDate: movieDetails.release_date,
            runtime: movieDetails.runtime,
            status: movieDetails.status,
            tagline: movieDetails.tagline,
            genres: movieDetails.genres,
            productionCompanies: movieDetails.production_companies,
            productionCountries: movieDetails.production_countries,
            spokenLanguages: movieDetails.spoken_languages,
            originalLanguage: movieDetails.original_language,
            adult: movieDetails.adult.toString(),
            budget: movieDetails.budget,
            revenue: movieDetails.revenue,
            homepage: movieDetails.homepage,
          }

          const insertedMovie = await db.insert(movies).values(newMovie).returning()
          movie = insertedMovie
        }

        // Check if already in watchlist
        const existingWatchlistEntry = await db.select()
          .from(movieWatchlist)
          .where(and(
            eq(movieWatchlist.userId, user.id),
            eq(movieWatchlist.movieId, movie[0].id)
          ))
          .limit(1)

        let taskTaskId: string | undefined
        let taskProjectId: string | undefined

        // Add to task if requested
        if (input.addTotask && input.status !== 'skipped') {
          try {
            const taskApiKey = process.env.task_API_KEY
            if (taskApiKey) {
              const taskContent = `Watch: ${movie[0].title} ${movie[0].releaseDate ? `(${movie[0].releaseDate.split('-')[0]})` : ''}`
              const taskDescription = movie[0].overview || ''

              const labels = []
              if (input.status === 'maybe') {
                labels.push('maybe')
              }
              if (input.status === 'to_watch') {
                labels.push('to-watch')
              }

              const taskPayload = {
                content: taskContent,
                description: taskDescription,
                project_id: input.taskProjectId,
                labels: labels,
              }

              const taskResponse = await axiosPost<any>(
                'https://api.task.com/rest/v2/tasks',
                taskPayload,
                {
                  'Authorization': `Bearer ${taskApiKey}`,
                  'Content-Type': 'application/json',
                },
                'movies-task-create-task'
              )

              if (taskResponse?.id) {
                taskTaskId = taskResponse.id
                taskProjectId = input.taskProjectId
              }
            }
          } catch (error) {
            // Don't fail the whole operation if task fails
            console.warn('Failed to add to task:', error)
          }
        }

        // Add or update watchlist entry
        const watchlistData: NewMovieWatchlist = {
          userId: user.id,
          movieId: movie[0].id,
          status: input.status,
          notes: input.notes,
          taskTaskId,
          taskProjectId,
          addedTotaskAt: taskTaskId ? new Date() : undefined,
        }

        if (existingWatchlistEntry.length > 0) {
          // Update existing entry
          await db.update(movieWatchlist)
            .set({
              status: input.status,
              notes: input.notes,
              taskTaskId: taskTaskId || existingWatchlistEntry[0].taskTaskId,
              taskProjectId: taskProjectId || existingWatchlistEntry[0].taskProjectId,
              addedTotaskAt: taskTaskId ? new Date() : existingWatchlistEntry[0].addedTotaskAt,
              updatedAt: new Date(),
            })
            .where(eq(movieWatchlist.id, existingWatchlistEntry[0].id))
        } else {
          // Create new entry
          await db.insert(movieWatchlist).values(watchlistData)
        }

        return {
          success: true,
          addedTotask: !!taskTaskId,
          taskTaskId,
          status: input.status,
        }
      } catch (error: any) {
        reportErrorToSentry(error, "movies-add-to-watchlist-error", { input, userId: user.id })
        throw new Error(`Failed to add movie to watchlist: ${error.message}`)
      }
    }),

  /**
   * Get user's watchlist with filtering and pagination
   */
  getWatchlist: protectedProcedure
    .input(z.object({
      status: z.enum(['to_watch', 'maybe', 'watched', 'skipped']).optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(50).default(20),
      sortBy: z.enum(['added_date', 'movie_title', 'movie_rating', 'movie_release_date']).default('added_date'),
      sortOrder: z.enum(['asc', 'desc']).default('desc'),
    }))
    .query(async ({ input, ctx }) => {
      const { user } = ctx
      const db = await getDb()

      try {
        const conditions = [eq(movieWatchlist.userId, user.id)]

        if (input.status) {
          conditions.push(eq(movieWatchlist.status, input.status))
        }

        const offset = (input.page - 1) * input.limit

        const watchlistEntries = await db
          .select({
            id: movieWatchlist.id,
            status: movieWatchlist.status,
            rating: movieWatchlist.rating,
            watchedDate: movieWatchlist.watchedDate,
            notes: movieWatchlist.notes,
            taskTaskId: movieWatchlist.taskTaskId,
            addedAt: movieWatchlist.createdAt,
            // Movie details
            movieId: movies.id,
            tmdbId: movies.tmdbId,
            title: movies.title,
            overview: movies.overview,
            posterPath: movies.posterPath,
            voteAverage: movies.voteAverage,
            voteCount: movies.voteCount,
            releaseDate: movies.releaseDate,
            runtime: movies.runtime,
            genres: movies.genres,
          })
          .from(movieWatchlist)
          .innerJoin(movies, eq(movieWatchlist.movieId, movies.id))
          .where(and(...conditions))
          .orderBy(
            input.sortOrder === 'desc'
              ? desc(movieWatchlist.createdAt)
              : movieWatchlist.createdAt
          )
          .limit(input.limit)
          .offset(offset)

        // Get total count
        const totalCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(movieWatchlist)
          .where(and(...conditions))

        const tmdbService = new TMDbService(process.env.TMDB_API_TOKEN!)

        return {
          entries: watchlistEntries.map(entry => ({
            ...entry,
            posterPath: entry.posterPath ? tmdbService.getImageUrl(entry.posterPath, 'w342') : null,
          })),
          pagination: {
            page: input.page,
            limit: input.limit,
            total: totalCount[0]?.count || 0,
            totalPages: Math.ceil((totalCount[0]?.count || 0) / input.limit),
          }
        }
      } catch (error: any) {
        reportErrorToSentry(error, "movies-get-watchlist-error", { input, userId: user.id })
        throw new Error(`Failed to get watchlist: ${error.message}`)
      }
    }),

  /**
   * Update movie status in watchlist
   */
  updateWatchlistStatus: protectedProcedure
    .input(z.object({
      tmdbId: z.number(),
      status: z.enum(['to_watch', 'maybe', 'watched', 'skipped']),
      rating: z.number().min(1).max(10).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { user } = ctx
      const db = await getDb()

      try {
        // Find the movie and watchlist entry
        const movie = await db.select().from(movies).where(eq(movies.tmdbId, input.tmdbId)).limit(1)
        if (movie.length === 0) {
          throw new Error('Movie not found')
        }

        const watchlistEntry = await db.select()
          .from(movieWatchlist)
          .where(and(
            eq(movieWatchlist.userId, user.id),
            eq(movieWatchlist.movieId, movie[0].id)
          ))
          .limit(1)

        if (watchlistEntry.length === 0) {
          throw new Error('Movie not in watchlist')
        }

        // Update the entry
        await db.update(movieWatchlist)
          .set({
            status: input.status,
            rating: input.rating,
            notes: input.notes,
            watchedDate: input.status === 'watched' ? new Date() : null,
            updatedAt: new Date(),
          })
          .where(eq(movieWatchlist.id, watchlistEntry[0].id))

        return {
          success: true,
          status: input.status,
        }
      } catch (error: any) {
        reportErrorToSentry(error, "movies-update-watchlist-status-error", { input, userId: user.id })
        throw new Error(`Failed to update watchlist status: ${error.message}`)
      }
    }),

  /**
   * Search movies by title
   */
  searchMovies: protectedProcedure
    .input(z.object({
      query: z.string().min(1),
      page: z.number().min(1).default(1),
      year: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const tmdbService = new TMDbService(process.env.TMDB_API_TOKEN!)

      try {
        const response = await tmdbService.searchMovies({
          query: input.query,
          page: input.page,
          year: input.year,
        })

        return {
          page: response.page,
          totalPages: response.total_pages,
          totalResults: response.total_results,
          movies: response.results.map(movie => ({
            tmdbId: movie.id,
            title: movie.title,
            overview: movie.overview,
            posterPath: movie.poster_path ? tmdbService.getImageUrl(movie.poster_path, 'w342') : null,
            voteAverage: movie.vote_average,
            voteCount: movie.vote_count,
            releaseDate: movie.release_date,
            genres: movie.genres,
          }))
        }
      } catch (error: any) {
        reportErrorToSentry(error, "movies-search-error", { input })
        throw new Error(`Failed to search movies: ${error.message}`)
      }
    }),

  /**
   * Get movie discovery statistics for user
   */
  getDiscoveryStats: protectedProcedure
    .query(async ({ ctx }) => {
      const { user } = ctx
      const db = await getDb()

      try {
        const stats = await db
          .select({
            totalMoviesShown: sql<number>`count(*)`,
            totalWatchlistItems: sql<number>`count(*) filter (where ${movieWatchlist.id} is not null)`,
            toWatchCount: sql<number>`count(*) filter (where ${movieWatchlist.status} = 'to_watch')`,
            maybeCount: sql<number>`count(*) filter (where ${movieWatchlist.status} = 'maybe')`,
            watchedCount: sql<number>`count(*) filter (where ${movieWatchlist.status} = 'watched')`,
            skippedCount: sql<number>`count(*) filter (where ${movieWatchlist.status} = 'skipped')`,
          })
          .from(movieDiscoveryHistory)
          .leftJoin(movieWatchlist, and(
            eq(movieDiscoveryHistory.movieId, movieWatchlist.movieId),
            eq(movieWatchlist.userId, user.id)
          ))
          .where(eq(movieDiscoveryHistory.userId, user.id))

        return stats[0] || {
          totalMoviesShown: 0,
          totalWatchlistItems: 0,
          toWatchCount: 0,
          maybeCount: 0,
          watchedCount: 0,
          skippedCount: 0,
        }
      } catch (error: any) {
        reportErrorToSentry(error, "movies-discovery-stats-error", { userId: user.id })
        throw new Error(`Failed to get discovery stats: ${error.message}`)
      }
    }),
})