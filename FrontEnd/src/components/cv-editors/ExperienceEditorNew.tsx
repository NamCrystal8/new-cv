import React from 'react';
import GenericListEditor, { FieldConfig } from '../ui/GenericListEditor';

// Types from the original editor
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

export interface ExperienceSection {
  id: string;
  name: string;
  type: 'list';
  items: ExperienceItem[];
  template: Omit<ExperienceItem, 'id'>;
}

const ExperienceEditorNew: React.FC<{ 
  section: ExperienceSection, 
  onChange: (section: ExperienceSection) => void 
}> = ({ section, onChange }) => {
  // Define field configuration for experience items
  const fields: FieldConfig[] = [
    { 
      key: 'company', 
      label: 'Company',
      placeholder: 'Enter company name',
      required: true
    },
    { 
      key: 'title', 
      label: 'Job Title',
      placeholder: 'Enter your job title',
      required: true
    },
    { 
      key: 'location', 
      label: 'Location',
      placeholder: 'City, Country'
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
      key: 'is_current', 
      label: 'Current Position',
      type: 'checkbox'
    },
    { 
      key: 'achievements', 
      label: 'Achievements & Responsibilities',
      span: 2 // Make this field span both columns
    }
  ];

  // Ensure the template has an empty achievements array
  const ensuredTemplate = {
    ...section.template,
    achievements: Array.isArray(section.template.achievements) ? 
      section.template.achievements : []
  };

  // Handle changes to the experience items
  const handleItemsChange = (newItems: ExperienceItem[]) => {
    // Ensure each item has an achievements array
    const validatedItems = newItems.map(item => ({
      ...item,
      achievements: Array.isArray(item.achievements) ? item.achievements : []
    }));

    onChange({
      ...section,
      items: validatedItems
    });
  };

  return (
    <GenericListEditor
      title="Experience"
      items={section.items}
      onChange={handleItemsChange}
      template={ensuredTemplate}
      fields={fields}
      addButtonText="Add Experience"
    />
  );
};

export default ExperienceEditorNew; 