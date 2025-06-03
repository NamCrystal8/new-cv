// Types related to CV analysis and flow responses
import {
  EducationSection,
  ExperienceSection,
  SkillsSection,
  ProjectsSection,
  LanguagesSection
} from '../components/cv-editors/new-editors';

export interface SectionAnalysis {
  is_complete: boolean;
  missing_fields: string[];
  item_count?: number;
  items_without_achievements?: number;
  items_without_quantifiables?: number;
  total_skills?: number;
  category_count?: number;
  missing_categories?: string[];
  items_without_contributions?: number;
}

export interface CVAnalysis {
  summary: string;
  missing_sections: string[];
  improvement_suggestions: string[];
  section_analysis: {
    [key: string]: SectionAnalysis;
  };
}

// New interfaces for the weakness analysis and recommendations
export interface WeaknessAnalysis {
  category: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface RecommendationItem {
  id: string;
  section: string;
  field: string;
  current: string;
  suggested: string;
  reason: string;
}

// Field types for editable sections
export interface Field {
  id: string;
  name: string;
  value: string;
}

// Contact information section
export interface ContactSection {
  id: string;
  name: string;
  type: 'object';
  fields: Field[];
}

// Raw input section (fallback)
export interface RawInputSection {
  id: string;
  name: string;
  type: 'textarea';
  value: string;
}

// Union type for all section types
export type EditableSection = 
  | ContactSection 
  | EducationSection 
  | ExperienceSection 
  | SkillsSection 
  | ProjectsSection
  | LanguagesSection
  | RawInputSection;

export interface FlowResponse {
  cv_data: any;
  analysis: CVAnalysis;
  flow_id: string;
  editable_sections: EditableSection[];
  detailed_analysis: {
    weaknesses: WeaknessAnalysis[];
    recommendations: RecommendationItem[];
  };
}

export interface JobDescriptionWeakness {
  category: string;
  description: string;
}

export interface RecommendedCourse {
  title: string;
  platform: string;
  url: string;
  reason: string;
  skill_addressed?: string;
  estimated_time?: string;
  level?: string;
  is_free?: boolean;
}

export interface JobDescriptionAnalysis {
  missing_requirements: string[];
  weaknesses: JobDescriptionWeakness[];
  recommended_courses: RecommendedCourse[];
  error?: string;
  // Add grading system properties - support both old and new formats
  matches?: SkillMatchOrString[];
  missing?: SkillMatchOrString[];
  not_needed?: SkillMatchOrString[];
  overall_grade?: CVGrade;
  experience_analysis?: ExperienceAnalysis;
}

// Experience analysis interfaces
export interface CandidateExperience {
  years: number;
  months: number;
  level: string;
}

export interface JobRequirements {
  minimum_years: number;
  preferred_years: number;
  seniority_level: string;
  specific_requirements: string[];
  special_requirements: string[];
}

export interface ExperienceAnalysisDetails {
  meets_minimum: boolean;
  experience_gap_years: number;
  level_match: string;
  strengths: string[];
  gaps: string[];
  recommendations: string[];
}

export interface ExperienceAnalysis {
  candidate_total_experience: CandidateExperience;
  job_requirements: JobRequirements;
  experience_analysis: ExperienceAnalysisDetails;
  notable_requirements: string[];
  error?: string;
}

// New interfaces for grading system
export interface SkillMatch {
  category: string;
  description: string;
  skill?: string;
}

// For backward compatibility, allow both object and string formats
export type SkillMatchOrString = SkillMatch | string;

export type GradeLevel = 'PASS' | 'NEGOTIABLE' | 'NOT_RECOMMEND';

export interface CVGrade {
  level: GradeLevel;
  score: number; // 0-100
  feedback: string;
  color: string;
}

export interface JobDescriptionFlowResponse {
  cv_data: any;
  job_analysis: JobDescriptionAnalysis;
}