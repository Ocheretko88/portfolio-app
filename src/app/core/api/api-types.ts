import type { components } from './generated/contract';

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
