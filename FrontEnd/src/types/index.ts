// Types related to CV analysis and flow responses
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

// Education item
export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  location: string;
  graduation_date: string;
  gpa: string;
}

// Education section
export interface EducationSection {
  id: string;
  name: string;
  type: 'list';
  items: EducationItem[];
  template: Omit<EducationItem, 'id'>;
}

// Experience item
export interface ExperienceItem {
  id: string;
  company: string;
  title: string;
  location: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  achievements: string[];
}

// Experience section
export interface ExperienceSection {
  id: string;
  name: string;
  type: 'list';
  items: ExperienceItem[];
  template: Omit<ExperienceItem, 'id'>;
}

// Skill category
export interface SkillCategory {
  id: string;
  name: string;
  items: string[];
}

// Skills section
export interface SkillsSection {
  id: string;
  name: string;
  type: 'nested_list';
  categories: SkillCategory[];
  template: Omit<SkillCategory, 'id'>;
}

// Project item
export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  technologies: string[];
  contributions: string[];
}

// Projects section
export interface ProjectsSection {
  id: string;
  name: string;
  type: 'list';
  items: ProjectItem[];
  template: Omit<ProjectItem, 'id'>;
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
  | RawInputSection;

export interface FlowResponse {
  cv_data: any;
  analysis: CVAnalysis;
  flow_id: string;
  editable_sections: EditableSection[];
}