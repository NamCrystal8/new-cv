import React from 'react';
import GenericListEditor, { FieldConfig } from '../ui/GenericListEditor';

// Types from the original editor
export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  technologies: string[];
  contributions: string[];
}

export interface ProjectsSection {
  id: string;
  name: string;
  type: 'list';
  items: ProjectItem[];
  template: Omit<ProjectItem, 'id'>;
}

const ProjectsEditorNew: React.FC<{ 
  section: ProjectsSection, 
  onChange: (section: ProjectsSection) => void 
}> = ({ section, onChange }) => {
  // Define field configuration for project items
  const fields: FieldConfig[] = [
    { 
      key: 'title', 
      label: 'Project Title',
      placeholder: 'Enter project title',
      required: true
    },
    { 
      key: 'description', 
      label: 'Description',
      placeholder: 'Brief description of the project',
      type: 'textarea',
      span: 2 // Make this field span both columns
    },
    { 
      key: 'start_date', 
      label: 'Start Date',
      placeholder: 'e.g., Jan 2020',
      type: 'date'
    },
    { 
      key: 'end_date', 
      label: 'End Date',
      placeholder: 'e.g., Present or Dec 2022',
      type: 'date'
    },
    { 
      key: 'technologies', 
      label: 'Technologies Used',
      span: 2 // Make this field span both columns
    },
    { 
      key: 'contributions', 
      label: 'Key Contributions',
      span: 2 // Make this field span both columns
    }
  ];

  // Ensure the template has empty arrays for technologies and contributions
  const ensuredTemplate = {
    ...section.template,
    technologies: Array.isArray(section.template.technologies) ? 
      section.template.technologies : [],
    contributions: Array.isArray(section.template.contributions) ? 
      section.template.contributions : []
  };

  // Handle changes to the project items
  const handleItemsChange = (newItems: ProjectItem[]) => {
    // Ensure each item has technologies and contributions arrays
    const validatedItems = newItems.map(item => ({
      ...item,
      technologies: Array.isArray(item.technologies) ? item.technologies : [],
      contributions: Array.isArray(item.contributions) ? item.contributions : []
    }));

    onChange({
      ...section,
      items: validatedItems
    });
  };

  return (
    <GenericListEditor
      title="Projects"
      items={section.items}
      onChange={handleItemsChange}
      template={ensuredTemplate}
      fields={fields}
      addButtonText="Add Project"
    />
  );
};

export default ProjectsEditorNew; 