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
  InterestsEditorNew,
  CertificationsEditorNew,
  EducationSection,
  ExperienceSection,
  SkillsSection,
  ProjectsSection,
  InterestsSection,
  CertificationsSection
} from '../components/cv-editors/new-editors';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  ContactSection,
  RawInputSection,
  EditableSection
} from '../types';

import { authenticatedFetch } from '@/utils/auth';

const EditCVPage: React.FC = () => {
  const { cvId } = useParams<{ cvId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [cvData, setCvData] = useState<any>(null);
  const [editableSections, setEditableSections] = useState<EditableSection[]>([]);
  const [flowId] = useState<string>(`edit-${Date.now()}`);

  useEffect(() => {
    const fetchCVData = async () => {
      if (!cvId) return;
      
      setIsLoading(true);
      
      try {
        const response = await authenticatedFetch(`/cv/${cvId}`);

        if (!response.ok) {
          throw new Error(`Error fetching CV data: ${response.status}`);
        }
        
        const data = await response.json();
        setCvData(data);

        if (data.cv_structure) {
          const sections = convertStructureToEditableSections(data.cv_structure);
          setEditableSections(sections);
        } else {
          toast({
            title: "Limited editing available",
            description: "This CV does not have editable structure data",
            variant: "warning",
          });
        }
      } catch (err: any) {
        console.error('Error fetching CV:', err);
        toast({
          title: "Error loading CV",
          description: err.message || 'Failed to fetch CV data',
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCVData();
  }, [cvId, toast]);

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
          start_date: item.start_date || '',
          graduation_date: item.graduation_date || '',
          gpa: item.gpa || ''
        })),
        template: {
          institution: '',
          degree: '',
          start_date: '',
          graduation_date: '',
          gpa: ''
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
    
    // Add skills section (including migration of standalone languages)
    if (cvData.skills) {
      const skillCategories = cvData.skills.categories || [];

      // Check if we need to migrate standalone languages to skills
      let migratedCategories = [...skillCategories];

      // If there's a standalone languages section, migrate it to skills
      if (cvData.languages && cvData.languages.items && cvData.languages.items.length > 0) {
        const languageItems = cvData.languages.items.map((item: any) => {
          const name = item.name || item.language || '';
          const level = item.proficiency || item.level || 'Intermediate';
          return `${name} (${level})`;
        });

        // Check if Languages category already exists
        const existingLanguageCategory = migratedCategories.find(cat =>
          cat.name && cat.name.toLowerCase() === 'languages'
        );

        if (existingLanguageCategory) {
          // Merge with existing languages category
          existingLanguageCategory.items = [...(existingLanguageCategory.items || []), ...languageItems];
        } else {
          // Add new languages category
          migratedCategories.push({
            name: 'Languages',
            items: languageItems
          });
        }
      }

      sections.push({
        id: 'skills',
        name: 'Skills',
        type: 'nested_list',
        categories: migratedCategories.map((category: any, index: number) => ({
          id: `skill_category_${index}`,
          name: category.name || '',
          items: category.items || []
        })),
        template: {
          name: '',
          items: []
        }
      });
    } else if (cvData.languages && cvData.languages.items && cvData.languages.items.length > 0) {
      // If there's no skills section but there are languages, create a skills section with languages
      const languageItems = cvData.languages.items.map((item: any) => {
        const name = item.name || item.language || '';
        const level = item.proficiency || item.level || 'Intermediate';
        return `${name} (${level})`;
      });

      sections.push({
        id: 'skills',
        name: 'Skills',
        type: 'nested_list',
        categories: [{
          id: 'skill_category_0',
          name: 'Languages',
          items: languageItems
        }],
        template: {
          name: '',
          items: []
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

    // Add interests section
    if (cvData.interests) {
      const interestItems = cvData.interests.items || [];

      sections.push({
        id: 'interests',
        name: 'Interests',
        type: 'interests',
        items: interestItems,
        template: ''
      } as any);
    }

    // Add certifications section
    if (cvData.certifications) {
      const certificationItems = cvData.certifications.items || [];

      sections.push({
        id: 'certifications',
        name: 'Certifications',
        type: 'list',
        items: certificationItems.map((item: any, index: number) => ({
          id: `certification_${index}`,
          title: item.title || '',
          institution: item.institution || '',
          date: item.date || ''
        })),
        template: {
          title: '',
          institution: '',
          date: ''
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
          if (['education', 'experience', 'projects', 'certifications'].includes(section.id)) {
            formattedData[section.id] = JSON.stringify(section.items);
          }
          break;
        case 'interests':
          formattedData[section.id] = JSON.stringify(section.items);
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
    
    try {
      setIsSaving(true);
      
      // DEBUG: Log the sections being saved
      console.log('🔍 DEBUG: Saving CV with sections:', editableSections);
      const experienceSection = editableSections.find(s => s.id === 'experience');
      console.log('🔍 DEBUG: Experience section being saved:', experienceSection);
      if (experienceSection && 'items' in experienceSection) {
        console.log('🔍 DEBUG: Experience items count:', experienceSection.items.length);
        experienceSection.items.forEach((item: any, index: number) => {
          console.log(`🔍 DEBUG: Experience item ${index + 1}:`, {
            title: item.title,
            company: item.company,
            achievements: item.achievements
          });
        });
      }

      const formattedData = formatSectionsForBackend(editableSections);
      // DEBUG: Log formatted data
      console.log('🔍 DEBUG: Formatted data for backend:', formattedData);
      if (formattedData.experience) {
        console.log('🔍 DEBUG: Experience JSON string:', formattedData.experience);
      }
      
      const response = await authenticatedFetch(`/cv/${cvId}/update`, {
        method: 'POST',
        body: JSON.stringify({
          flow_id: flowId,
          additional_inputs: formattedData
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: `Server responded with status ${response.status}` }));
        throw new Error(errorData.detail || `Error updating CV: ${response.status}`);
      }
      
      const data = await response.json();
      
      toast({
        title: "CV updated successfully!",
        description: "Your CV has been regenerated with the latest changes.",
        variant: "success",
      });
      
      // Navigate to My CVs page with success message
      navigate('/my-cvs', { 
        state: { 
          message: 'Your CV has been successfully updated!',
          pdf_url: data.pdf_url 
        } 
      });
    } catch (err: any) {
      console.error('Error updating CV:', err);
      toast({
        title: "Error updating CV",
        description: err.message || 'Failed to update CV',
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="relative mb-6">
              <div className="animate-spin h-16 w-16 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Your CV</h3>
            <p className="text-gray-600">Preparing your CV for editing...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .custom-height {
          height: calc(100% - 80px);
        }
        .iframe-no-border {
          border: none;
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Edit Your CV
              </h1>
              <p className="text-gray-600 mt-1">
                Make changes and see live preview
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => navigate('/my-cvs')}
                variant="outline"
                size="lg"
                className="gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to My CVs
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                variant="default"
                size="lg"
                className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-opacity-50 border-t-transparent rounded-full"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Split Layout */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 h-full">
          
          {/* Left Panel - Editor */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">CV Sections</h2>
                  <p className="text-gray-600 text-sm">Edit your CV content below</p>
                </div>
              </div>
              
              {/* Editable Sections */}
              <div className="space-y-6">
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
                      } else if (section.id === 'certifications') {
                        return (
                          <CertificationsEditorNew
                            key={section.id}
                            section={section as CertificationsSection}
                            onChange={(updatedSection) => updateSection(index, updatedSection)}
                          />
                        );
                      }
                      return null;
                    case 'interests':
                      return (
                        <InterestsEditorNew
                          key={section.id}
                          section={section as InterestsSection}
                          onChange={(updatedSection) => updateSection(index, updatedSection)}
                        />
                      );
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
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="xl:sticky xl:top-24 xl:h-[calc(100vh-8rem)]">
            {cvData?.file_url && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Live Preview</h3>
                      <p className="text-white/80 text-sm">Your CV as it appears</p>
                    </div>
                  </div>
                </div>
                <div className="h-full bg-gray-50 overflow-hidden custom-height">
                  <iframe 
                    src={cvData.file_url}
                    title={`CV ${cvId} Preview`}
                    className="w-full h-full pointer-events-none border-0 iframe-no-border"
                  />
                </div>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
    </>
  );
};

export default EditCVPage;
