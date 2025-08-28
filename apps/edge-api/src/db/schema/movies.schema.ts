import { relations } from "drizzle-orm"
import { decimal, index, integer, json, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

import { users } from "./auth.schema"

/**
 * Movies table - stores TMDb movie data
 */
export const movies = pgTable(
	"movies",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		tmdbId: integer("tmdb_id").notNull().unique(), // TMDb movie ID
		imdbId: text("imdb_id"), // IMDb ID for cross-referencing
		title: text("title").notNull(),
		originalTitle: text("original_title"),
		overview: text("overview"),
		posterPath: text("poster_path"), // TMDb poster image path
		backdropPath: text("backdrop_path"), // TMDb backdrop image path
		voteAverage: decimal("vote_average", { precision: 3, scale: 1 }), // Rating out of 10
		voteCount: integer("vote_count"), // Number of votes
		popularity: decimal("popularity", { precision: 10, scale: 3 }),
		releaseDate: text("release_date"), // YYYY-MM-DD format
		runtime: integer("runtime"), // Runtime in minutes
		status: text("status"), // released, post_production, etc.
		tagline: text("tagline"),
		genres: json("genres"), // Array of genre objects from TMDb
		productionCompanies: json("production_companies"), // Array of production company objects
		productionCountries: json("production_countries"), // Array of country objects
		spokenLanguages: json("spoken_languages"), // Array of language objects
		originalLanguage: text("original_language"),
		adult: text("adult"), // boolean as text for consistency
		budget: integer("budget"),
		revenue: integer("revenue"),
		homepage: text("homepage"),
		trailerUrl: text("trailer_url"), // YouTube trailer URL
		watchProviders: json("watch_providers"), // Streaming availability data from TMDb
		lastUpdated: timestamp("last_updated").defaultNow().notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => ({
		tmdbIdIdx: index("movies_tmdb_id_idx").on(table.tmdbId),
		imdbIdIdx: index("movies_imdb_id_idx").on(table.imdbId),
		titleIdx: index("movies_title_idx").on(table.title),
		releaseDateIdx: index("movies_release_date_idx").on(table.releaseDate),
		voteAverageIdx: index("movies_vote_average_idx").on(table.voteAverage),
		voteCountIdx: index("movies_vote_count_idx").on(table.voteCount),
		popularityIdx: index("movies_popularity_idx").on(table.popularity),
		runtimeIdx: index("movies_runtime_idx").on(table.runtime),
		statusIdx: index("movies_status_idx").on(table.status),
		lastUpdatedIdx: index("movies_last_updated_idx").on(table.lastUpdated),
	}),
);


/**
 * Movie Streaming Availability table - stores where movies can be watched
 */
export const movieStreamingAvailability = pgTable(
	"movie_streaming_availability",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		movieId: uuid("movie_id")
			.notNull()
			.references(() => movies.id),
		providerId: integer("provider_id").notNull(), // TMDb watch provider ID
		providerName: text("provider_name").notNull(), // e.g., "Netflix", "Amazon Prime Video"
		logoPath: text("logo_path"), // Provider logo from TMDb
		displayPriority: integer("display_priority"), // Provider display priority from TMDb
		region: text("region").notNull().default("US"), // ISO country code
		offerType: text("offer_type").notNull(), // flatrate, rent, buy
		monetizationType: text("monetization_type"), // flatrate, ads, rent, buy
		currency: text("currency"), // USD, EUR, etc.
		price: decimal("price", { precision: 6, scale: 2 }), // Price for rent/buy
		quality: text("quality"), // HD, 4K, etc.
		audioLanguages: json("audio_languages"), // Available audio languages
		subtitleLanguages: json("subtitle_languages"), // Available subtitle languages
		deeplink: text("deeplink"), // Direct link to watch the movie
		lastUpdated: timestamp("last_updated").defaultNow().notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => ({
		movieIdIdx: index("movie_streaming_movie_id_idx").on(table.movieId),
		providerIdIdx: index("movie_streaming_provider_id_idx").on(table.providerId),
		regionIdx: index("movie_streaming_region_idx").on(table.region),
		offerTypeIdx: index("movie_streaming_offer_type_idx").on(table.offerType),
		movieProviderRegionIdx: index("movie_streaming_movie_provider_region_idx").on(
			table.movieId,
			table.providerId,
			table.region,
		),
		lastUpdatedIdx: index("movie_streaming_last_updated_idx").on(table.lastUpdated),
	}),
);

/**
 * Movie Discovery History table - tracks what movies were shown to users to avoid duplicates
 */
export const movieDiscoveryHistory = pgTable(
	"movie_discovery_history",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id),
		movieId: uuid("movie_id")
			.notNull()
			.references(() => movies.id),
		discoverySource: text("discovery_source").notNull(), // trending, new_releases, popular, search
		discoveryContext: json("discovery_context"), // Additional context like filters used
		shownAt: timestamp("shown_at").defaultNow().notNull(),
	},
	(table) => ({
		userIdIdx: index("movie_discovery_user_id_idx").on(table.userId),
		movieIdIdx: index("movie_discovery_movie_id_idx").on(table.movieId),
		userMovieIdx: index("movie_discovery_user_movie_idx").on(table.userId, table.movieId),
		discoverySourceIdx: index("movie_discovery_source_idx").on(table.discoverySource),
		shownAtIdx: index("movie_discovery_shown_at_idx").on(table.shownAt),
	}),
);

// Relations
export const moviesRelations = relations(movies, ({ many }) => ({
	watchlistEntries: many(movieWatchlist),
	streamingAvailability: many(movieStreamingAvailability),
	discoveryHistory: many(movieDiscoveryHistory),
}));

export const movieWatchlistRelations = relations(movieWatchlist, ({ one }) => ({
	user: one(users, {
		fields: [movieWatchlist.userId],
		references: [users.id],
	}),
	movie: one(movies, {
		fields: [movieWatchlist.movieId],
		references: [movies.id],
	}),
}));

export const movieStreamingAvailabilityRelations = relations(
	movieStreamingAvailability,
	({ one }) => ({
		movie: one(movies, {
			fields: [movieStreamingAvailability.movieId],
			references: [movies.id],
		}),
	}),
);

export const movieDiscoveryHistoryRelations = relations(
	movieDiscoveryHistory,
	({ one }) => ({
		user: one(users, {
			fields: [movieDiscoveryHistory.userId],
			references: [users.id],
		}),
		movie: one(movies, {
			fields: [movieDiscoveryHistory.movieId],
			references: [movies.id],
		}),
	}),
);

// Export types
export type Movie = typeof movies.$inferSelect;
export type NewMovie = typeof movies.$inferInsert;
export type MovieWatchlist = typeof movieWatchlist.$inferSelect;
export type NewMovieWatchlist = typeof movieWatchlist.$inferInsert;
export type MovieStreamingAvailability = typeof movieStreamingAvailability.$inferSelect;
export type NewMovieStreamingAvailability = typeof movieStreamingAvailability.$inferInsert;
export type MovieDiscoveryHistory = typeof movieDiscoveryHistory.$inferSelect;
export type NewMovieDiscoveryHistory = typeof movieDiscoveryHistory.$inferInsert;