import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ContactInfoEditor,
  RawInputEditor
} from '../components/cv-editors';
import {
  EducationEditorNew,
  ExperienceEditorNew,
  SkillsEditorNew,
  ProjectsEditorNew,
  LanguagesEditorNew,
  EducationSection,
  ExperienceSection,
  SkillsSection,
  ProjectsSection,
  LanguagesSection
} from '../components/cv-editors/new-editors';
import { Button } from '@/components/ui/button';
import { 
  ContactSection,
  RawInputSection,
  EditableSection
} from '../types';

const EditCVPage: React.FC = () => {
  const { cvId } = useParams<{ cvId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [cvData, setCvData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editableSections, setEditableSections] = useState<EditableSection[]>([]);
  const [flowId] = useState<string>(`edit-${Date.now()}`);

  useEffect(() => {
    const fetchCVData = async () => {
      if (!cvId) return;
      
      setIsLoading(true);
      setErrorMessage(null);
      
      try {
        const response = await fetch(`/api/cv/${cvId}`);
        
        if (!response.ok) {
          throw new Error(`Error fetching CV data: ${response.status}`);
        }
        
        const data = await response.json();
        setCvData(data);

        if (data.cv_structure) {
          const sections = convertStructureToEditableSections(data.cv_structure);
          setEditableSections(sections);
        } else {
          setErrorMessage('This CV does not have editable structure data');
        }
      } catch (err: any) {
        console.error('Error fetching CV:', err);
        setErrorMessage(err.message || 'Failed to fetch CV data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCVData();
  }, [cvId]);

  // Convert CV structure to editable sections
  const convertStructureToEditableSections = (structure: any): EditableSection[] => {
    const sections: EditableSection[] = [];
    
    if (!structure.cv_template || !structure.cv_template.sections) {
      return sections;
    }
    
    const cvData = structure.cv_template.sections;
    
    // Add header section
    if (cvData.header) {
      const header = cvData.header;
      const contactInfo = header.contact_info || {};
      
      sections.push({
        id: 'header',
        name: 'Contact Information',
        type: 'object',
        fields: [
          { id: 'name', name: 'Full Name', value: header.name || '' },
          { id: 'email', name: 'Email', value: contactInfo.email?.value || '' },
          { id: 'phone', name: 'Phone', value: contactInfo.phone?.value || '' },
          { id: 'location', name: 'Location', value: contactInfo.location?.value || '' }
        ]
      });
    }
    
    if (cvData.education) {
      const educationItems = cvData.education.items || [];
      
      sections.push({
        id: 'education',
        name: 'Education',
        type: 'list',
        items: educationItems.map((item: any, index: number) => ({
          id: `education_${index}`,
          institution: item.institution || '',
          degree: item.degree || '',
          location: item.location || '',
          graduation_date: item.graduation_date || '',
          gpa: item.gpa || '',
          relevant_coursework: item.relevant_coursework || '',
          academic_achievements: item.academic_achievements || []
        })),
        template: {
          institution: '',
          degree: '',
          location: '',
          graduation_date: '',
          gpa: '',
          relevant_coursework: '',
          academic_achievements: []
        }
      });
    }

    if (cvData.experience) {
      const experienceItems = cvData.experience.items || [];
      
      sections.push({
        id: 'experience',
        name: 'Work Experience',
        type: 'list',
        items: experienceItems.map((item: any, index: number) => ({
          id: `experience_${index}`,
          company: item.company || '',
          title: item.title || '',
          location: item.location || '',
          start_date: item.dates?.start || '',
          end_date: item.dates?.end || '',
          is_current: item.dates?.is_current || false,
          achievements: item.achievements || []
        })),
        template: {
          company: '',
          title: '',
          location: '',
          start_date: '',
          end_date: '',
          is_current: false,
          achievements: []
        }
      });
    }
    
    // Add skills section
    if (cvData.skills) {
      const skillCategories = cvData.skills.categories || [];
      
      sections.push({
        id: 'skills',
        name: 'Skills',
        type: 'nested_list',
        categories: skillCategories.map((category: any, index: number) => ({
          id: `skill_category_${index}`,
          name: category.name || '',
          items: category.items || []
        })),
        template: {
          name: '',
          items: []
        }
      });
    }
    
    // Add languages section
    if (cvData.languages) {
      const languageItems = cvData.languages.items || [];
      
      sections.push({
        id: 'languages',
        name: 'Languages',
        type: 'list',
        items: languageItems.map((item: any, index: number) => ({
          id: `language_${index}`,
          language: item.language || '',
          proficiency: item.proficiency || 'Intermediate'
        })),
        template: {
          language: '',
          proficiency: 'Intermediate'
        }
      });
    }
    
    // Add projects section
    if (cvData.projects) {
      const projectItems = cvData.projects.items || [];
      
      sections.push({
        id: 'projects',
        name: 'Projects',
        type: 'list',
        items: projectItems.map((item: any, index: number) => ({
          id: `project_${index}`,
          title: item.title || '',
          description: item.description || '',
          start_date: item.dates?.start || '',
          end_date: item.dates?.end || '',
          technologies: item.technologies || [],
          contributions: item.key_contributions || []
        })),
        template: {
          title: '',
          description: '',
          start_date: '',
          end_date: '',
          technologies: [],
          contributions: []
        }
      });
    }
    
    return sections;
  };

  // Update a section in the editable sections array
  const updateSection = (index: number, updatedSection: EditableSection) => {
    const newSections = [...editableSections];
    newSections[index] = updatedSection;
    setEditableSections(newSections);
  };

  // Format editable sections for the backend API
  const formatSectionsForBackend = (sections: EditableSection[]) => {
    const formattedData: Record<string, string> = {};
    sections.forEach(section => {
      switch (section.type) {
        case 'object':
          if (section.id === 'header') {
            section.fields.forEach(field => {
              formattedData[`header.${field.id}`] = field.value;
            });
          }
          break;
        case 'list':
          if (['education', 'experience', 'projects', 'languages'].includes(section.id)) {
            formattedData[section.id] = JSON.stringify(section.items);
          }
          break;
        case 'nested_list':
          if (section.id === 'skills') {
            formattedData[section.id] = JSON.stringify(section.categories);
          }
          break;
        case 'textarea':
          formattedData['raw_text'] = section.value;
          break;
      }
    });
    return formattedData;
  };

  // Handle save changes and regenerate PDF
  const handleSave = async () => {
    if (!cvId) return;
    
    setIsSaving(true);
    setErrorMessage(null);
    
    try {
      const formattedSections = formatSectionsForBackend(editableSections);
      
      const response = await fetch(`/api/cv/${cvId}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flow_id: flowId,
          additional_inputs: formattedSections
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: `Server responded with status ${response.status}` }));
        throw new Error(errorData.detail || `Error updating CV: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Navigate to My CVs page with success message
      navigate('/my-cvs', { 
        state: { 
          message: 'Your CV has been successfully updated!',
          pdf_url: data.pdf_url 
        } 
      });
    } catch (err: any) {
      console.error('Error updating CV:', err);
      setErrorMessage(err.message || 'Failed to update CV');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-opacity-50 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="bg-destructive/10 border-l-4 border-destructive p-4 rounded-md shadow-sm">
        <div className="flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-destructive mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-semibold text-destructive-foreground">Error</h3>
            <div className="text-sm text-destructive-foreground/80">{errorMessage}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Edit Your CV</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Make changes to your CV and regenerate the PDF with your updates
        </p>
      </div>
      
      {/* Preview of current CV */}
      {cvData?.file_url && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden mb-6">
          <div className="h-96 bg-gray-50 overflow-hidden">
            <iframe 
              src={cvData.file_url}
              title={`CV ${cvId}`}
              className="w-full h-full pointer-events-none"
              style={{ border: 'none' }}
            ></iframe>
          </div>
        </div>
      )}
      
      {/* Editable Sections */}
      <div className="space-y-4">
        {editableSections.map((section, index) => {
          switch (section.type) {
            case 'object':
              return (
                <ContactInfoEditor 
                  key={section.id} 
                  section={section as ContactSection}
                  onChange={(updatedSection) => updateSection(index, updatedSection)} 
                />
              );
            case 'list':
              if (section.id === 'education') {
                return (
                  <EducationEditorNew 
                    key={section.id} 
                    section={section as EducationSection}
                    onChange={(updatedSection) => updateSection(index, updatedSection)} 
                  />
                );
              } else if (section.id === 'experience') {
                return (
                  <ExperienceEditorNew 
                    key={section.id} 
                    section={section as ExperienceSection}
                    onChange={(updatedSection) => updateSection(index, updatedSection)} 
                  />
                );
              } else if (section.id === 'projects') {
                return (
                  <ProjectsEditorNew 
                    key={section.id} 
                    section={section as ProjectsSection}
                    onChange={(updatedSection) => updateSection(index, updatedSection)} 
                  />
                );
              } else if (section.id === 'languages') {
                return (
                  <LanguagesEditorNew 
                    key={section.id} 
                    section={section as LanguagesSection}
                    onChange={(updatedSection) => updateSection(index, updatedSection)} 
                  />
                );
              }
              return null;
            case 'nested_list':
              return (
                <SkillsEditorNew 
                  key={section.id} 
                  section={section as SkillsSection}
                  onChange={(updatedSection) => updateSection(index, updatedSection)} 
                />
              );
            case 'textarea':
              return (
                <RawInputEditor 
                  key={section.id} 
                  section={section as RawInputSection}
                  onChange={(updatedSection) => updateSection(index, updatedSection)} 
                />
              );
            default:
              return null;
          }
        })}
      </div>
      
      <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10">
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          variant="default"
          size="lg"
        >
          {isSaving ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-opacity-50 border-t-transparent rounded-full"></div>
              Saving...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Save Changes
            </>
          )}
        </Button>
        
        <Button 
          onClick={() => navigate('/my-cvs')}
          variant="outline"
          size="lg"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default EditCVPage;
