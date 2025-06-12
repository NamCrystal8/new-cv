import EducationEditor from './EducationEditorNew';
import ExperienceEditor from './ExperienceEditorNew';
import SkillsEditor from './SkillsEditorNew';
import ProjectsEditor from './ProjectsEditorNew';
import LanguagesEditor from './LanguagesEditorNew';

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
} from './EducationEditorNew';

export type {
  ExperienceItem,
  ExperienceSection
} from './ExperienceEditorNew';

export type {
  SkillCategory,
  SkillsSection
} from './SkillsEditorNew';

export type {
  ProjectItem,
  ProjectsSection
} from './ProjectsEditorNew';

export type {
  Language,
  LanguagesSection
} from './LanguagesEditorNew';