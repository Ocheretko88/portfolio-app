/**
 * Domain models for the portfolio's resume content.
 *
 * The whole site is data-driven: every section renders from these typed
 * structures rather than hard-coded template markup. That keeps content and
 * presentation separate and makes the CV trivially exportable (JSON, PDF, API).
 */

export interface SocialLink {
  readonly label: string;
  readonly href: string;
  /** Short handle shown in the UI, e.g. "@ocheretko". */
  readonly handle: string;
  /** primeicons class or local icon key. */
  readonly icon: string;
}

export interface Profile {
  readonly name: string;
  readonly title: string;
  readonly location: string;
  readonly summary: string;
  readonly email: string;
  readonly links: readonly SocialLink[];
}

export interface Stat {
  readonly value: string;
  readonly label: string;
}

/** A named group of skills, e.g. "Frontend" or "Security". */
export interface SkillGroup {
  readonly name: string;
  readonly items: readonly string[];
}

export interface ExperienceRole {
  readonly company: string;
  readonly title: string;
  readonly period: string;
  /** Optional sub-track shown under a single employer (e.g. "Python & Angular"). */
  readonly track?: string;
  readonly highlights: readonly string[];
  readonly stack: readonly string[];
}

export interface EducationEntry {
  readonly institution: string;
  readonly qualification: string;
  readonly period?: string;
}

export interface Certification {
  readonly name: string;
  readonly issuer: string;
  readonly issued: string;
  readonly credentialUrl?: string;
}

export interface Resume {
  readonly profile: Profile;
  readonly stats: readonly Stat[];
  readonly skillGroups: readonly SkillGroup[];
  readonly experience: readonly ExperienceRole[];
  readonly education: readonly EducationEntry[];
  readonly certifications: readonly Certification[];
}
