// Language proficiency levels that match the backend enum
export const LANGUAGE_PROFICIENCY_LEVELS = [
  'Native/Bilingual',
  'Fluent', 
  'Advanced',
  'Intermediate',
  'Basic/Elementary'
] as const;

export type LanguageProficiencyLevel = typeof LANGUAGE_PROFICIENCY_LEVELS[number];

export const DEFAULT_PROFICIENCY: LanguageProficiencyLevel = 'Intermediate';
