import React, { useState } from 'react';
import { SocialMediaLink } from '../ui/SocialMediaInputs';
import SocialMediaInputs from '../ui/SocialMediaInputs';
import { EducationSection } from './EducationEditorNew';
import { ExperienceSection } from './ExperienceEditorNew';
import { LanguagesSection } from './LanguagesEditorNew';
import { ProjectsSection } from './ProjectsEditorNew';
import { SkillsSection } from './SkillsEditorNew';

// Define interfaces for the components
export interface Field {
  id: string;
  name: string;
  value: string;
}

export interface ContactSection {
  id: string;
  name: string;
  type: 'object';
  fields: Field[];
}

export interface RawInputSection {
  id: string;
  name: string;
  type: 'textarea';
  value: string;
}

// Re-export types from individual editors
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

export type EditableSection = 
  | ContactSection
  | EducationSection
  | ExperienceSection
  | SkillsSection
  | ProjectsSection
  | LanguagesSection
  | RawInputSection;

// Helper component for contact information
export const ContactInfoEditor: React.FC<{ 
  section: ContactSection, 
  onChange: (section: ContactSection) => void 
}> = ({ section, onChange }) => {
  const [socialLinks, setSocialLinks] = useState<SocialMediaLink[]>(() => {
    // Extract social media links from fields
    const links: SocialMediaLink[] = [];
    
    section.fields.forEach(field => {
      if (field.name.toLowerCase().includes('linkedin')) {
        links.push({ platform: 'LinkedIn', url: field.value, id: field.id });
      } else if (field.name.toLowerCase().includes('github')) {
        links.push({ platform: 'GitHub', url: field.value, id: field.id });
      } else if (field.name.toLowerCase().includes('twitter')) {
        links.push({ platform: 'Twitter', url: field.value, id: field.id });
      } else if (field.name.toLowerCase().includes('portfolio') || field.name.toLowerCase().includes('website')) {
        links.push({ platform: 'Portfolio', url: field.value, id: field.id });
      }
    });
    
    return links;
  });

  const handleFieldChange = (fieldId: string, value: string) => {
    const newFields = section.fields.map(field => 
      field.id === fieldId ? { ...field, value } : field
    );
    onChange({ ...section, fields: newFields });
  };

  const handleSocialLinksChange = (links: SocialMediaLink[]) => {
    setSocialLinks(links);
    
    // Update the section fields with the new social media links
    let newFields = [...section.fields];
    
    // Remove existing social media fields
    newFields = newFields.filter(field => 
      !field.name.toLowerCase().includes('linkedin') &&
      !field.name.toLowerCase().includes('github') &&
      !field.name.toLowerCase().includes('twitter') &&
      !field.name.toLowerCase().includes('portfolio') &&
      !field.name.toLowerCase().includes('website')
    );
    
    // Add new social media fields
    links.forEach(link => {
      newFields.push({
        id: link.id || `social_${Date.now()}_${Math.random()}`,
        name: link.platform.toLowerCase(),
        value: link.url
      });
    });
    
    onChange({ ...section, fields: newFields });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6 overflow-hidden">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">{section.name}</h3>
            <p className="text-sm text-gray-600 mt-1">Personal contact information</p>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {section.fields
            .filter(field => 
              !field.name.toLowerCase().includes('linkedin') &&
              !field.name.toLowerCase().includes('github') &&
              !field.name.toLowerCase().includes('twitter') &&
              !field.name.toLowerCase().includes('portfolio') &&
              !field.name.toLowerCase().includes('website')
            )
            .map(field => (
            <div key={field.id} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 capitalize">
                {field.name.replace(/_/g, ' ')}
              </label>
              <input
                type={field.name.toLowerCase().includes('email') ? 'email' : 
                     field.name.toLowerCase().includes('phone') ? 'tel' : 'text'}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                value={field.value}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                placeholder={`Enter your ${field.name.replace(/_/g, ' ').toLowerCase()}`}
              />
            </div>
          ))}
        </div>
        
        {/* Social Media Section */}
        <div className="mt-8">
          <SocialMediaInputs 
            links={socialLinks}
            onChange={handleSocialLinksChange}
          />
        </div>
      </div>
    </div>
  );
};

// Helper component for raw input (fallback)
export const RawInputEditor: React.FC<{ 
  section: RawInputSection, 
  onChange: (section: RawInputSection) => void 
}> = ({ section, onChange }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6 overflow-hidden">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10,9 9,9 8,9"/>
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">{section.name}</h3>
            <p className="text-sm text-gray-600 mt-1">Raw text input</p>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Raw JSON Data
          </label>
          <textarea
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 font-mono text-sm bg-gray-50"
            rows={10}
            value={section.value}
            onChange={(e) => onChange({ ...section, value: e.target.value })}
            placeholder="Enter raw JSON data here..."
          />
          <p className="text-xs text-gray-500 mt-2">
            This is a fallback editor for sections that don't have a specialized interface.
          </p>
        </div>
      </div>
    </div>
  );
};
