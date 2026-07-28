import type { components, operations } from './generated/contract';

/**
 * Convenience aliases over the generated OpenAPI schemas. The API client layer
 * types its payloads with these, so any contract change surfaces at compile time.
 */
export type Schemas = components['schemas'];

export type ResumeDto = Schemas['Resume'];
export type TraceDto = Schemas['Trace'];
export type TraceStageDto = Schemas['TraceStage'];
export type SqlInjectionResultDto = Schemas['SqlInjectionResult'];
export type XssResultDto = Schemas['XssResult'];
export type ApiErrorDto = Schemas['ApiError'];

export type ExerciseCategoryDto = Schemas['ExerciseCategory'];
export type ExerciseDto = Schemas['Exercise'];
export type SetEntryDto = Schemas['SetEntry'];
export type SetEntryInputDto = Schemas['SetEntryInput'];
export type WorkoutSessionDto = Schemas['WorkoutSession'];
export type CreateSessionRequestDto = Schemas['CreateSessionRequest'];
export type StatsOverviewDto = Schemas['StatsOverview'];
export type PaginationMetaDto = Schemas['PaginationMeta'];

/**
 * Query-param shapes for the gym list endpoints, sourced from the generated
 * `operations` map (not hand-written) so a contract change to these filters
 * surfaces as a compile error here rather than silently drifting.
 */
export type ListExercisesQuery = NonNullable<operations['listGymExercises']['parameters']['query']>;
export type ListSessionsQuery = NonNullable<operations['listGymSessions']['parameters']['query']>;
