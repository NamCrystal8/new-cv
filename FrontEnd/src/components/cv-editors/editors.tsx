import EducationEditor from './EducationEditor';
import ExperienceEditor from './ExperienceEditor';
import SkillsEditor from './SkillsEditor';
import ProjectsEditor from './ProjectsEditor';
import LanguagesEditor from './LanguagesEditor';

export {
  EducationEditor,
  ExperienceEditor,
  SkillsEditor,
  ProjectsEditor,
  LanguagesEditor
};

// Re-export types
export type {
  EducationItem,
  EducationSection
} from './EducationEditor';

export type {
  ExperienceItem,
  ExperienceSection
} from './ExperienceEditor';

export type {
  SkillCategory,
  SkillsSection
} from './SkillsEditor';

export type {
  ProjectItem,
  ProjectsSection
} from './ProjectsEditor';

export type {
  Language,
  LanguagesSection
} from './LanguagesEditor';