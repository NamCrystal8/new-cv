import React from 'react';
import GenericListEditor, { FieldConfig } from '../ui/GenericListEditor';

// Types for certifications
export interface CertificationItem {
  id: string;
  title: string;
  institution: string;
  date: string;
}

export interface CertificationsSection {
  id: string;
  name: string;
  type: 'list';
  items: CertificationItem[];
  template: Omit<CertificationItem, 'id'>;
}

const CertificationsEditorNew: React.FC<{ 
  section: CertificationsSection, 
  onChange: (section: CertificationsSection) => void 
}> = ({ section, onChange }) => {
  // Define field configuration for certification items
  const fields: FieldConfig[] = [
    { 
      key: 'title', 
      label: 'Certification Name',
      placeholder: 'Enter certification title',
      required: true
    },
    { 
      key: 'institution', 
      label: 'Issuing Institution',
      placeholder: 'Enter issuing organization',
      required: true
    },
    { 
      key: 'date', 
      label: 'Issue Date',
      placeholder: 'e.g., Jan 2023',
      type: 'date'
    }
  ];

  // Handle changes to the certification items
  const handleItemsChange = (newItems: CertificationItem[]) => {
    onChange({
      ...section,
      items: newItems
    });
  };

  return (
    <GenericListEditor
      title="Certifications"
      items={section.items}
      onChange={handleItemsChange}
      template={section.template}
      fields={fields}
      addButtonText="Add Certification"
    />
  );
};

export default CertificationsEditorNew;
