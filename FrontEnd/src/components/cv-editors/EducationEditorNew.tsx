import React from 'react';
import GenericListEditor, { FieldConfig } from '../ui/GenericListEditor';

// Types from the original editor
export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  location: string;
  graduation_date: string;
  gpa: string;
  relevant_coursework?: string;
  academic_achievements?: string[];
}

export interface EducationSection {
  id: string;
  name: string;
  type: 'list';
  items: EducationItem[];
  template: Omit<EducationItem, 'id'>;
}

const EducationEditorNew: React.FC<{ 
  section: EducationSection, 
  onChange: (section: EducationSection) => void 
}> = ({ section, onChange }) => {
  // Define field configuration for education items
  const fields: FieldConfig[] = [
    { 
      key: 'institution', 
      label: 'Institution',
      placeholder: 'Enter institution name',
      required: true
    },
    { 
      key: 'degree', 
      label: 'Degree',
      placeholder: 'Enter degree or qualification',
      required: true
    },
    { 
      key: 'location', 
      label: 'Location',
      placeholder: 'City, Country'
    },
    { 
      key: 'graduation_date', 
      label: 'Graduation Date',
      placeholder: 'e.g., May 2023',
      type: 'date'
    },
    { 
      key: 'gpa', 
      label: 'GPA (Optional)',
      placeholder: 'e.g., 3.8/4.0'
    },
    {
      key: 'relevant_coursework',
      label: 'Relevant Coursework',
      placeholder: 'Enter relevant courses',
      type: 'textarea'
    },
    {
      key: 'academic_achievements',
      label: 'Academic Achievements',
      placeholder: 'Add achievement'
    }
  ];

  // Handle changes to the education items
  const handleItemsChange = (newItems: EducationItem[]) => {
    onChange({
      ...section,
      items: newItems
    });
  };

  return (
    <GenericListEditor
      title="Education"
      items={section.items}
      onChange={handleItemsChange}
      template={section.template}
      fields={fields}
      addButtonText="Add Education"
    />
  );
};

export default EducationEditorNew; 