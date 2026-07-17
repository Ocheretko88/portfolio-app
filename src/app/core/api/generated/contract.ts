/**
 * GENERATED FILE — do not edit by hand.
 *
 * Types generated from the API's OpenAPI spec (`src/app/core/api/openapi.yaml`,
 * mirrored from portfolio-api/docs/openapi.yaml). Regenerate with:
 *
 *   npm run api:types
 *
 * The structure matches `openapi-typescript` output (a `components.schemas`
 * map), so regeneration overwrites this file in place.
 */

export interface components {
  schemas: {
    Meta: {
      version: string;
      generatedAt: string;
    };
    ApiError: {
      code: string;
      message: string;
      details?: Record<string, unknown>;
    };
    DemoInput: {
      input: string;
    };
    SocialLink: {
      label: string;
      href: string;
      handle?: string;
      icon?: string;
    };
    Stat: {
      value: string;
      label: string;
    };
    SkillGroup: {
      name: string;
      items: string[];
    };
    ExperienceRole: {
      company: string;
      title: string;
      period: string;
      track?: string;
      highlights: string[];
      stack: string[];
    };
    EducationEntry: {
      institution: string;
      qualification: string;
      period?: string;
    };
    Certification: {
      name: string;
      issuer: string;
      issued: string;
      credentialUrl?: string;
    };
    Profile: {
      name: string;
      title: string;
      location: string;
      summary: string;
      email: string;
      links: components['schemas']['SocialLink'][];
    };
    Resume: {
      profile: components['schemas']['Profile'];
      stats: components['schemas']['Stat'][];
      skillGroups: components['schemas']['SkillGroup'][];
      experience: components['schemas']['ExperienceRole'][];
      education: components['schemas']['EducationEntry'][];
      certifications: components['schemas']['Certification'][];
    };
    TraceStage: {
      key: string;
      label: string;
      durationMs: number;
    };
    Trace: {
      stages: components['schemas']['TraceStage'][];
      totalMs: number;
      payloadBytes: number;
    };
    SqlInjectionSide: {
      query: string;
      explanation: string;
      breached: boolean;
      simulatedRows?: Record<string, unknown>[];
      rows?: Record<string, unknown>[];
    };
    SqlInjectionResult: {
      input: string;
      vulnerable: components['schemas']['SqlInjectionSide'];
      hardened: components['schemas']['SqlInjectionSide'];
    };
    XssSide: {
      rendered: string;
      explanation: string;
      executed: boolean;
      csp?: string;
    };
    XssResult: {
      input: string;
      vulnerable: components['schemas']['XssSide'];
      hardened: components['schemas']['XssSide'];
    };
  };
}
