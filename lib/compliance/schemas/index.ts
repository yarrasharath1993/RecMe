/**
 * Compliance Validation Schemas
 * 
 * Zod-based validation schemas for data from external sources.
 * Ensures data integrity before storage.
 */

// Movie schemas
export {
  TMDBMovieSchema,
  OMDBMovieSchema,
  NormalizedMovieSchema,
  ExternalRatingSchema,
  GenreSchema,
  ProductionCompanySchema,
  validateTMDBMovie,
  safeParseTMDBMovie,
  validateOMDBMovie,
  validateNormalizedMovie,
  isTMDBMovieValid,
} from './movie-schema';
export type {
  TMDBMovie,
  OMDBMovie,
  NormalizedMovie,
  ExternalRating,
} from './movie-schema';

// Cast/crew schemas
export {
  PersonSchema,
  CastMemberSchema,
  CrewMemberSchema,
  TMDBCreditsSchema,
  PersonDetailsSchema,
  NormalizedCastSchema,
  NormalizedCrewSchema,
  CelebritySchema,
  validateTMDBCredits,
  safeParseTMDBCredits,
  validatePersonDetails,
  validateCelebrity,
  extractDirector,
  extractMusicDirector,
  extractWriters,
  extractLeadActors,
} from './cast-schema';
export type {
  Person,
  CastMember,
  CrewMember,
  TMDBCredits,
  PersonDetails,
  NormalizedCast,
  NormalizedCrew,
  Celebrity,
} from './cast-schema';

// Image schemas
export {
  ALLOWED_IMAGE_DOMAINS,
  TMDBImageConfigSchema,
  TMDBImageSchema,
  TMDBImagesResponseSchema,
  WikimediaImageSchema,
  LicenseTypeSchema,
  NormalizedImageSchema,
  ImageSetSchema,
  validateTMDBImages,
  safeParseTMDBImages,
  validateNormalizedImage,
  isAllowedImageDomain,
  buildTMDBImageUrl,
  getBestPoster,
  getBestBackdrop,
  parseLicenseFromWikimedia,
} from './image-schema';
export type {
  TMDBImageConfig,
  TMDBImage,
  TMDBImagesResponse,
  WikimediaImage,
  LicenseType,
  NormalizedImage,
  ImageSet,
} from './image-schema';

