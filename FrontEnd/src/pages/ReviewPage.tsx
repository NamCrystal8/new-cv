import React, { useEffect, useState } from 'react';
import { 
  FlowResponse, 
  EditableSection,
  ContactSection,
  RawInputSection
} from '../types';
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
import { preprocessExperienceData } from '../utils/achievementNormalizer';

interface ReviewPageProps {
  isLoading: boolean;
  flowResponse: FlowResponse;
  completeCvFlow: (editableSections: EditableSection[]) => void;  // Updated type
  resetFlow: () => void;
}

const ImprovementSuggestions: React.FC<{ suggestions: string[] }> = ({ suggestions }) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow mb-6">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex gap-2 items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Suggestions for Enhancement
        </h3>
        <ul className="list-disc list-inside space-y-2 text-gray-600">
          {suggestions.map((suggestion, index) => (
            <li key={`suggestion-${index}`} className="pl-1">{suggestion}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const ReviewPage: React.FC<ReviewPageProps> = ({ 
  isLoading,
  flowResponse,
  completeCvFlow,
  resetFlow
}) => {
  // Transform sections and apply preprocessing
  const transformedSections = (flowResponse.editable_sections || []).map(section => {
    // Apply achievement normalization to experience sections
    if (section.id === 'experience' && section.type === 'list') {
      console.log("[ReviewPage] Normalizing achievements for experience section");
      return preprocessExperienceData(section);
    }

    return section;
  });
  
  const [editableSections, setEditableSections] = useState<EditableSection[]>(transformedSections);

  const updateSection = (index: number, updatedSection: EditableSection) => {
    const newSections = [...editableSections];
    newSections[index] = updatedSection;
    setEditableSections(newSections);
  };

  // Handle submission with current edited sections
  const handleSubmit = () => {
    // Normalize achievements in experience sections before final submission
    const normalizedSections = editableSections.map(section => {
      if (section.id === 'experience' && section.type === 'list') {
        console.log("[ReviewPage] Final normalization of experience achievements before submission");
        return preprocessExperienceData(section);
      }
      return section;
    });
    
    console.log("[Review] Submitting final CV sections:", normalizedSections);
    completeCvFlow(normalizedSections);
  };

  useEffect(() => {
    console.log("Flow response analysis: %o", flowResponse.editable_sections);
  },[]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">CV Review & Enhancement</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {typeof flowResponse.analysis.summary === 'string' 
            ? flowResponse.analysis.summary 
            : typeof flowResponse.analysis.summary === 'object' && flowResponse.analysis.summary !== null
              ? JSON.stringify(flowResponse.analysis.summary)
              : "Review and enhance your CV based on our analysis."}
        </p>
      </div>
      
      {/* Suggestions Section */}
      {flowResponse.analysis.improvement_suggestions && 
       flowResponse.analysis.improvement_suggestions.length > 0 && (
        <ImprovementSuggestions 
          suggestions={flowResponse.analysis.improvement_suggestions} 
        />
      )}
      
      {/* Missing Sections Alert */}
      {flowResponse.analysis.missing_sections && 
       flowResponse.analysis.missing_sections.length > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-md shadow-sm mb-6">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="font-semibold text-amber-800">Missing Sections</h3>
              <div className="text-sm text-amber-700">
                Your CV is missing these important sections:
                <ul className="list-disc list-inside mt-1">
                  {flowResponse.analysis.missing_sections.map((section, index) => (
                    <li key={index}>{section}</li>
                  ))}
                </ul>
              </div>
            </div>
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
      
      <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10">
        <Button 
          onClick={handleSubmit} 
          disabled={isLoading}
          variant="default"
          size="lg"
        >
          {isLoading ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-opacity-50 border-t-transparent rounded-full"></div>
              Generating...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V8z" clipRule="evenodd" />
              </svg>
              Generate Enhanced CV
            </>
          )}
        </Button>
        
        <Button 
          onClick={resetFlow}
          variant="outline"
          size="lg"
        >
          Start Over
        </Button>
      </div>
    </div>
  );
};

export default ReviewPage;