import React from 'react';
import GenericListEditor, { FieldConfig } from '../ui/GenericListEditor';

// Types from the original editor
export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  start_date: string;
  graduation_date: string;
  gpa: string;
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
      placeholder: 'e.g., Bachelor of Computer Science',
      required: true
    },
    {
      key: 'start_date',
      label: 'Start Date',
      placeholder: 'e.g., Aug 2019',
      type: 'date'
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