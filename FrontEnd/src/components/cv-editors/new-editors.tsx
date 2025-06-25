import EducationEditorNew from './EducationEditorNew';
import ExperienceEditorNew from './ExperienceEditorNew';
import SkillsEditorNew from './SkillsEditorNew';
import ProjectsEditorNew from './ProjectsEditorNew';
import LanguagesEditorNew from './LanguagesEditorNew';
import InterestsEditorNew from './InterestsEditorNew';
import CertificationsEditorNew from './CertificationsEditorNew';

export {
  EducationEditorNew,
  ExperienceEditorNew,
  SkillsEditorNew,
  ProjectsEditorNew,
  LanguagesEditorNew,
  InterestsEditorNew,
  CertificationsEditorNew
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

export type {
  InterestsSection
} from './InterestsEditorNew';

export type {
  CertificationItem,
  CertificationsSection
} from './CertificationsEditorNew';