import React, { useState, useEffect } from 'react';
import { RecommendationItem, EditableSection } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import ListInputField from '@/components/ui/ListInputField';
import { normalizeAchievements } from '../../utils/achievementNormalizer';

interface RecommendationsCarouselProps {
  recommendations: RecommendationItem[];
  currentCVData: EditableSection[];
  onComplete: (updatedRecommendations: RecommendationItem[]) => void;
}

// Smart input component that can handle both list and text input based on content type
const SmartInputField: React.FC<{
  value: string;
  onChange: (value: string) => void;
  suggestedContent: string;
  placeholder?: string;
}> = ({ value, onChange, suggestedContent, placeholder = "Enter your own version or leave empty to accept suggestion" }) => {
  const [inputMode, setInputMode] = useState<'auto' | 'list' | 'text'>('auto');
  const [listItems, setListItems] = useState<string[]>([]);

  // Reset internal state when value is cleared externally
  useEffect(() => {
    if (!value.trim()) {
      setListItems([]);
      setInputMode('auto');
    }
  }, [value]);

  // Determine if the suggested content is a JSON array
  const isSuggestedList = React.useMemo(() => {
    const content = String(suggestedContent);
    if (content.startsWith('[') && content.endsWith(']')) {
      try {
        const parsed = JSON.parse(content);
        return Array.isArray(parsed);
      } catch {
        return false;
      }
    }
    return false;
  }, [suggestedContent]);

  // Initialize list items from value or suggested content
  useEffect(() => {
    if (value) {
      // Try to parse the current value as JSON array
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          setListItems(parsed.map(String));
          return;
        }
      } catch {
        // If not JSON, split by newlines and filter empty lines
        const lines = value.split('\n').map(line => line.trim()).filter(Boolean);
        if (lines.length > 1) {
          setListItems(lines);
          return;
        }
      }
    }
    
    // If no value, initialize from suggested content if it's a list
    if (isSuggestedList && !value) {
      try {
        const parsed = JSON.parse(suggestedContent);
        if (Array.isArray(parsed)) {
          setListItems(parsed.map(String));
        }
      } catch {
        setListItems([]);
      }
    }
  }, [value, suggestedContent, isSuggestedList]);

  // Determine current input mode
  const currentMode = React.useMemo(() => {
    if (inputMode !== 'auto') return inputMode;
    
    // Auto-detect based on content
    if (isSuggestedList || listItems.length > 0) {
      return 'list';
    }
    return 'text';
  }, [inputMode, isSuggestedList, listItems.length]);

  // Handle list changes
  const handleListChange = (newItems: string[]) => {
    setListItems(newItems);
    // Convert back to appropriate format
    if (newItems.length === 0) {
      onChange('');
    } else if (newItems.length === 1) {
      onChange(newItems[0]);
    } else {
      // If original was JSON array, keep as JSON, otherwise use newlines
      if (isSuggestedList) {
        onChange(JSON.stringify(newItems));
      } else {
        onChange(newItems.join('\n'));
      }
    }
  };

  // Handle text area changes
  const handleTextChange = (newValue: string) => {
    onChange(newValue);
    // Update list items if switching modes
    const lines = newValue.split('\n').map(line => line.trim()).filter(Boolean);
    if (lines.length > 1) {
      setListItems(lines);
    }
  };

  useEffect(() => {
    console.log("SmartInputField initialized with mode:", currentMode, "and items:", listItems);
  },[]);

  return (
    <div className="space-y-3">
      {/* Mode toggle buttons */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Input mode:</span>
        <div className="flex rounded-md border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setInputMode('text')}
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              currentMode === 'text' 
                ? 'bg-blue-100 text-blue-700 border-blue-200' 
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Text
          </button>
          <button
            type="button"
            onClick={() => setInputMode('list')}
            className={`px-3 py-1 text-xs font-medium transition-colors border-l ${
              currentMode === 'list' 
                ? 'bg-blue-100 text-blue-700 border-blue-200' 
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* Input field based on current mode */}
      {currentMode === 'list' ? (
        <ListInputField<string[]>
          label=""
          items={listItems}
          onChange={handleListChange}
          placeholder="Add item"
          isObjectList={false}
          addButtonText="Add Item"
          className="border border-gray-300 rounded-lg p-3 bg-white"
        />
      ) : (
        <textarea 
          className="w-full p-3 bg-white rounded border border-gray-300 text-gray-800"
          rows={3}
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleTextChange(e.target.value)}
        />
      )}
    </div>
  );
};



// Enhanced content renderer that can parse and display JSON strings as formatted content
const SmartContentRenderer: React.FC<{ content: any; className?: string }> = ({ content, className = "" }) => {
  const renderContent = () => {
    if (content === null || content === undefined) {
      return <span className="text-gray-400 italic">No content</span>;
    }

    const contentStr = String(content);
    
    // Try to parse as JSON if it looks like JSON
    if ((contentStr.startsWith('[') && contentStr.endsWith(']')) || 
        (contentStr.startsWith('{') && contentStr.endsWith('}'))) {
      try {
        const parsed = JSON.parse(contentStr);
        
        // Handle arrays
        if (Array.isArray(parsed)) {
          if (parsed.length === 0) {
            return <span className="text-gray-400 italic">Empty list</span>;
          }
          return (
            <div className="space-y-1">
              {parsed.map((item, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold text-xs mt-1">•</span>
                  <span className="flex-1">{String(item)}</span>
                </div>
              ))}
            </div>
          );
        }
        
        // Handle objects
        if (typeof parsed === 'object') {
          const entries = Object.entries(parsed);
          if (entries.length === 0) {
            return <span className="text-gray-400 italic">Empty object</span>;
          }
          return (
            <div className="space-y-2">
              {entries.map(([key, val], index) => (
                <div key={index} className="border-l-2 border-gray-200 pl-3">
                  <div className="text-sm font-medium text-gray-600 capitalize">
                    {key.replace(/_/g, ' ')}:
                  </div>
                  <div className="text-gray-800">
                    {Array.isArray(val) ? (
                      <div className="ml-2 space-y-1">
                        {val.map((item, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-blue-500 text-xs mt-1">•</span>
                            <span>{String(item)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      String(val)
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        }
      } catch (e) {
        // If parsing fails, fall through to plain text rendering
      }
    }
    
    // Handle plain text with line breaks
    const lines = contentStr.split('\n').filter(line => line.trim());
    if (lines.length > 1) {
      return (
        <div className="space-y-1">
          {lines.map((line, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="text-blue-500 font-bold text-xs mt-1">•</span>
              <span className="flex-1">{line.trim()}</span>
            </div>
          ))}
        </div>
      );
    }
    
    // Single line text
    return <span>{contentStr}</span>;
  };

  return (
    <div className={className}>
      {renderContent()}
    </div>
  );
};

// Component to render a preview of how the entire section will look with the changes
const CVSectionPreview: React.FC<{
  section: string;
  field: string;
  suggested: string;
  userInput: string;
  recommendations: RecommendationItem[];
  currentCVData: EditableSection[];
}> = ({ section, field, suggested, userInput, recommendations, currentCVData }) => {
  // The content to display (either user input or suggestion)
  const newContent = userInput.trim() || suggested;
  
  // Helper function to get section recommendations
  const getSectionRecommendations = () => {
    // Get all recommendations for this section
    return recommendations.filter(rec => 
      rec.section.toLowerCase() === section.toLowerCase()
    );
  };
  
  // Helper function to format the preview based on section type
  const renderPreview = () => {
    const sectionLower = section.toLowerCase();
    
    switch (sectionLower) {
      case 'header':
        return renderHeaderSection(field, newContent);
      case 'education':
        return renderEducationSection(field, newContent);
      case 'experience':
        return renderExperienceSection(field, newContent);
      case 'skills':
        return renderSkillsSection(field, newContent);
      case 'projects':
        return renderProjectsSection(field, newContent);
      default:
        return (
          <div className="p-4 bg-white rounded-md">
            <h3 className="text-base font-medium">{sectionLower}</h3>
            <p className="mt-1 text-gray-800 whitespace-pre-wrap">
              {field === 'general' ? newContent : `Field "${field}" updated to: ${newContent}`}
            </p>
          </div>
        );
    }
  };
    // Render header section with all contact info
  const renderHeaderSection = (changedField: string, changedContent: string) => {
    // Find the header section from current CV data
    const headerSection = currentCVData.find(section => section.id === 'header' || section.name?.toLowerCase().includes('header'));
    
    // Initialize with actual header data or fallback values
    const actualHeader = {
      name: "",
      email: "",
      phone: "",
      location: ""
    };
    
    // Extract data from the actual CV structure
    if (headerSection && headerSection.type === 'object') {
      const fields = (headerSection as any).fields || [];
      fields.forEach((field: any) => {
        const fieldId = field.id?.toLowerCase() || field.name?.toLowerCase() || '';
        if (fieldId.includes('name') || fieldId === 'full_name') {
          actualHeader.name = field.value || '';
        } else if (fieldId.includes('email')) {
          actualHeader.email = field.value || '';
        } else if (fieldId.includes('phone')) {
          actualHeader.phone = field.value || '';
        } else if (fieldId.includes('location') || fieldId.includes('address')) {
          actualHeader.location = field.value || '';
        }
      });
    }
    
    // Apply the current change
    if (changedField === 'name') {
      actualHeader.name = changedContent;
    } else if (changedField === 'email') {
      actualHeader.email = changedContent;
    } else if (changedField === 'phone') {
      actualHeader.phone = changedContent;
    } else if (changedField === 'location') {
      actualHeader.location = changedContent;
    }
    
    // Apply other pending changes from recommendations
    getSectionRecommendations().forEach(rec => {
      if (rec.field === 'name' && rec.field !== changedField) {
        actualHeader.name = rec.suggested;
      } else if (rec.field === 'email' && rec.field !== changedField) {
        actualHeader.email = rec.suggested;
      } else if (rec.field === 'phone' && rec.field !== changedField) {
        actualHeader.phone = rec.suggested;
      } else if (rec.field === 'location' && rec.field !== changedField) {
        actualHeader.location = rec.suggested;
      }
    });    
    return (
      <div className="p-4 bg-white rounded-md">
        <h2 className={`text-xl font-bold ${changedField === 'name' ? 'text-blue-800 bg-blue-50 px-1' : 'text-gray-800'}`}>
          {actualHeader.name || 'Your Name'}
        </h2>
        <div className="mt-3 flex flex-col sm:flex-row sm:flex-wrap gap-y-1 gap-x-4">
          <div className={`flex items-center ${changedField === 'email' ? 'text-blue-800 bg-blue-50 px-1' : 'text-gray-600'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            <span>{actualHeader.email || 'your.email@example.com'}</span>
          </div>
          
          <div className={`flex items-center ${changedField === 'phone' ? 'text-blue-800 bg-blue-50 px-1' : 'text-gray-600'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
            <span>{actualHeader.phone || '+1 (555) 000-0000'}</span>
          </div>
          
          <div className={`flex items-center ${changedField === 'location' ? 'text-blue-800 bg-blue-50 px-1' : 'text-gray-600'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span>{actualHeader.location || 'Your City, State'}</span>
          </div>
        </div>
      </div>
    );
  };
    // Render education section
  const renderEducationSection = (changedField: string, changedContent: string) => {
    // Find the education section from current CV data
    const educationSection = currentCVData.find(section => 
      section.id === 'education' || section.name?.toLowerCase().includes('education')
    );
    
    // Initialize with actual education data or fallback values
    let actualEducation: any[] = [];
    
    if (educationSection && educationSection.type === 'list') {
      actualEducation = (educationSection as any).items || [];
    }
    
    // If no actual data, provide a fallback template
    if (actualEducation.length === 0) {
      actualEducation = [{
        id: "education_0",
        institution: "Your University",
        degree: "Your Degree",
        location: "City, State",
        graduation_date: "Year",
        dates: "",
        relevant_coursework: "",
        gpa: "",
        honors: ""
      }];
    }    
    // Parse the field to extract index and property if it follows pattern like "education.0.institution"
    let targetIndex = -1;
    let targetProperty = "";
    
    if (changedField.includes('.')) {
      const parts = changedField.split('.');
      if (parts.length === 3) {
        targetIndex = parseInt(parts[1]);
        targetProperty = parts[2];
        
        // Apply the change to the actual data
        if (targetIndex >= 0 && targetIndex < actualEducation.length) {
          // Check if the property exists on our object before setting it
          if (Object.prototype.hasOwnProperty.call(actualEducation[targetIndex], targetProperty)) {
            actualEducation[targetIndex][targetProperty] = changedContent;
          }
        }
      }
    }
    
    return (
      <div className="p-4 bg-white rounded-md">
        <h3 className="text-lg font-semibold mb-3 text-gray-700 border-b pb-1">Education</h3>
        <div className="space-y-4">
          {actualEducation.map((edu: any, index: number) => (
            <div key={edu.id || `education_${index}`} className={index === targetIndex ? "border-l-2 border-blue-500 pl-3" : "pl-3"}>
              <h4 className={`font-bold ${targetIndex === index && targetProperty === 'institution' ? 'text-blue-800 bg-blue-50 px-1' : 'text-gray-800'}`}>
                {edu.institution || 'Institution Name'}
              </h4>
              <p className={`${targetIndex === index && targetProperty === 'degree' ? 'text-blue-800 bg-blue-50 px-1' : 'text-gray-800'} italic`}>
                {edu.degree || 'Degree Title'}
              </p>
              <div className="flex justify-between text-sm text-gray-600 mt-1">
                <span className={targetIndex === index && targetProperty === 'location' ? 'text-blue-800 bg-blue-50 px-1' : ''}>
                  {edu.location || 'Location'}
                </span>
                <span className={targetIndex === index && targetProperty === 'graduation_date' ? 'text-blue-800 bg-blue-50 px-1' : ''}>
                  {edu.graduation_date || edu.end_date || 'Year'}
                </span>
              </div>
              
              {edu.gpa && (
                <div className={`mt-1 text-sm ${targetIndex === index && targetProperty === 'gpa' ? 'text-blue-800 bg-blue-50 px-1' : 'text-gray-600'}`}>
                  GPA: {edu.gpa}
                </div>
              )}
              
              {edu.relevant_coursework && (
                <div className={`mt-1 text-sm ${targetIndex === index && targetProperty === 'relevant_coursework' ? 'text-blue-800 bg-blue-50 px-1' : 'text-gray-600'}`}>
                  Relevant Coursework: {edu.relevant_coursework}
                </div>
              )}
              
              {edu.honors && (
                <div className={`mt-1 text-sm ${targetIndex === index && targetProperty === 'honors' ? 'text-blue-800 bg-blue-50 px-1' : 'text-gray-600'}`}>
                  Honors: {edu.honors}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );  };

  // Render experience section
  const renderExperienceSection = (changedField: string, changedContent: string) => {
    // Find the experience section from current CV data
    const experienceSection = currentCVData.find(section => 
      section.id === 'experience' || section.name?.toLowerCase().includes('experience')
    );
    
    // Initialize with actual experience data or fallback values
    let actualExperience: any[] = [];
    
    if (experienceSection && experienceSection.type === 'list') {
      actualExperience = (experienceSection as any).items || [];
    }
    
    // If no actual data, provide a fallback template
    if (actualExperience.length === 0) {
      actualExperience = [{
        id: "experience_0",
        company: "Your Company",
        title: "Your Job Title",
        location: "City, State",
        start_date: "Start Date",
        end_date: "End Date",
        achievements: ["Your key achievement here"]
      }];
    }
    
    // Normalize achievements data for all experience items
    actualExperience = actualExperience.map(exp => ({
      ...exp,
      achievements: normalizeAchievements(exp.achievements)
    }));
    
    console.log("[Recommendations] Normalized experience data:", actualExperience);
    
    // Parse the field to extract index and property
    let targetIndex = -1;
    let targetProperty = "";
    
    if (changedField.includes('.')) {
      const parts = changedField.split('.');
      if (parts.length === 3) {
        targetIndex = parseInt(parts[1]);
        targetProperty = parts[2];
        
        // Apply the change to the actual data
        if (targetIndex >= 0 && targetIndex < actualExperience.length) {
          if (targetProperty === 'achievements') {
            // Handle achievements as an array - parse if it's a JSON string
            const newAchievements = normalizeAchievements(changedContent);
            actualExperience[targetIndex].achievements = newAchievements;
            console.log("[Recommendations] Updated achievements for experience", targetIndex, ":", newAchievements);
          } else if (Object.prototype.hasOwnProperty.call(actualExperience[targetIndex], targetProperty)) {
            // Safe indexing for string properties
            (actualExperience[targetIndex] as any)[targetProperty] = changedContent;
          }
        }
      }
    }
    
    return (
      <div className="p-4 bg-white rounded-md">
        <h3 className="text-lg font-semibold mb-3 text-gray-700 border-b pb-1">Experience</h3>
        <div className="space-y-4">
          {actualExperience.map((exp: any, index: number) => (
            <div key={exp.id || `experience_${index}`} className={index === targetIndex ? "border-l-2 border-blue-500 pl-3" : "pl-3"}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <h4 className={`font-bold ${targetIndex === index && targetProperty === 'company' ? 'text-blue-800 bg-blue-50 px-1' : 'text-gray-800'}`}>
                  {exp.company || 'Company Name'}
                </h4>
                <div className="text-sm text-gray-600">
                  <span className={targetIndex === index && (targetProperty === 'start_date' || targetProperty === 'end_date') ? 'text-blue-800 bg-blue-50 px-1' : ''}>
                    {exp.start_date || 'Start'} - {exp.end_date || 'End'}
                  </span>
                </div>
              </div>
              <p className={`${targetIndex === index && targetProperty === 'title' ? 'text-blue-800 bg-blue-50 px-1' : 'text-gray-800'} font-medium`}>
                {exp.title || 'Job Title'}
              </p>
              <p className={`text-sm text-gray-600 mb-1 ${targetIndex === index && targetProperty === 'location' ? 'text-blue-800 bg-blue-50 px-1' : ''}`}>
                {exp.location || 'Location'}
              </p>              <ul className={`list-disc list-inside text-gray-700 text-sm space-y-1 ${targetIndex === index && targetProperty === 'achievements' ? 'bg-blue-50 px-2 py-1 rounded' : ''}`}>
                {normalizeAchievements(exp.achievements).map((achievement: string, i: number) => (
                  <li key={i}>{achievement}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  };
    // Render skills section
  const renderSkillsSection = (changedField: string, changedContent: string) => {
    // Find the skills section from current CV data
    const skillsSection = currentCVData.find(section => 
      section.id === 'skills' || section.name?.toLowerCase().includes('skill')
    );
    
    // Initialize with actual skills data or fallback values
    let actualSkills: any[] = [];
    
    if (skillsSection && skillsSection.type === 'list') {
      actualSkills = (skillsSection as any).items || [];
    }
    
    // If no actual data, provide fallback template
    if (actualSkills.length === 0) {
      actualSkills = [
        {
          id: "skill_category_0",
          name: "Technical Skills",
          items: ["Add your skills here"]
        }
      ];
    }
    
    // Parse the field to extract category index and skill index if applicable
    let targetCategoryIndex = -1;
    let targetSkillIndex = -1;
    
    if (changedField.includes('.')) {
      const parts = changedField.split('.');
      if (parts.length === 3) {
        targetCategoryIndex = parseInt(parts[1]);
        targetSkillIndex = parseInt(parts[2]);
        
        // Apply the change to the actual data
        if (targetCategoryIndex >= 0 && targetCategoryIndex < actualSkills.length) {
          if (targetSkillIndex >= 0 && actualSkills[targetCategoryIndex].items && targetSkillIndex < actualSkills[targetCategoryIndex].items.length) {
            actualSkills[targetCategoryIndex].items[targetSkillIndex] = changedContent;
          } else if (changedField.endsWith('.name')) {
            actualSkills[targetCategoryIndex].name = changedContent;
          }
        }
      }
    }
    
    return (
      <div className="p-4 bg-white rounded-md">
        <h3 className="text-lg font-semibold mb-3 text-gray-700 border-b pb-1">Skills</h3>
        <div className="space-y-3">
          {actualSkills.map((category, catIndex) => (
            <div key={category.id || `skill_category_${catIndex}`} className={catIndex === targetCategoryIndex ? "border-l-2 border-blue-500 pl-3" : "pl-3"}>
              <h4 className={`font-medium mb-1 ${catIndex === targetCategoryIndex && targetSkillIndex === -1 ? 'text-blue-800 bg-blue-50 px-1' : 'text-gray-700'}`}>
                {category.name || 'Skill Category'}
              </h4>
              <div className="flex flex-wrap gap-2">
                {(category.items || []).map((skill: string, skillIndex: number) => (
                  <span 
                    key={skillIndex} 
                    className={`px-2 py-1 rounded-full text-sm ${
                      catIndex === targetCategoryIndex && skillIndex === targetSkillIndex
                        ? 'bg-blue-200 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
    // Render projects section
  const renderProjectsSection = (changedField: string, changedContent: string) => {
    // Find the projects section from current CV data
    const projectsSection = currentCVData.find(section => 
      section.id === 'projects' || section.name?.toLowerCase().includes('project')
    );
    
    // Initialize with actual projects data or fallback values
    let actualProjects: any[] = [];
    
    if (projectsSection && projectsSection.type === 'list') {
      actualProjects = (projectsSection as any).items || [];
    }
    
    // If no actual data, provide a fallback template
    if (actualProjects.length === 0) {
      actualProjects = [{
        id: "project_0",
        title: "Your Project Title",
        description: "Project description here",
        start_date: "Start Date",
        end_date: "End Date",
        technologies: ["Technology 1", "Technology 2"],
        contributions: ["Your key contribution here"]
      }];
    }
    
    // Parse the field to extract index and property
    let targetIndex = -1;
    let targetProperty = "";
    
    if (changedField.includes('.')) {
      const parts = changedField.split('.');
      if (parts.length === 3) {
        targetIndex = parseInt(parts[1]);
        targetProperty = parts[2];
        
        // Apply the change to the actual data
        if (targetIndex >= 0 && targetIndex < actualProjects.length) {
          if (targetProperty === 'technologies') {
            // Handle technologies as an array
            actualProjects[targetIndex].technologies = String(changedContent).split(',').map((t: string) => t.trim());
          } else if (targetProperty === 'contributions') {
            // Handle contributions as an array
            actualProjects[targetIndex].contributions = String(changedContent).split('\n').map((c: string) => c.trim()).filter((c: string) => c);
          } else if (Object.prototype.hasOwnProperty.call(actualProjects[targetIndex], targetProperty)) {
            // Safe indexing for string properties
            (actualProjects[targetIndex] as any)[targetProperty] = changedContent;
          }
        }
      }
    }
    
    return (
      <div className="p-4 bg-white rounded-md">
        <h3 className="text-lg font-semibold mb-3 text-gray-700 border-b pb-1">Projects</h3>
        <div className="space-y-4">
          {actualProjects.map((project, index) => (
            <div key={project.id || `project_${index}`} className={index === targetIndex ? "border-l-2 border-blue-500 pl-3" : "pl-3"}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <h4 className={`font-bold ${targetIndex === index && targetProperty === 'title' ? 'text-blue-800 bg-blue-50 px-1' : 'text-gray-800'}`}>
                  {project.title || 'Project Title'}
                </h4>
                <div className="text-xs text-gray-600">
                  <span className={targetIndex === index && (targetProperty === 'start_date' || targetProperty === 'end_date') ? 'text-blue-800 bg-blue-50 px-1' : ''}>
                    {project.start_date || 'Start'} - {project.end_date || 'End'}
                  </span>
                </div>
              </div>
              <p className={`mt-1 text-sm ${targetIndex === index && targetProperty === 'description' ? 'text-blue-800 bg-blue-50 px-1' : 'text-gray-700'}`}>
                {project.description || 'Project description'}
              </p>
              
              {project.technologies && project.technologies.length > 0 && (
                <div className={`mt-2 ${targetIndex === index && targetProperty === 'technologies' ? 'bg-blue-50 px-2 py-1 rounded' : ''}`}>
                  <span className="text-xs font-medium text-gray-500">Technologies: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {project.technologies.map((tech: string, i: number) => (
                      <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-gray-800 rounded text-xs">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {project.contributions && project.contributions.length > 0 && (
                <div className={`mt-2 ${targetIndex === index && targetProperty === 'contributions' ? 'bg-blue-50 px-2 py-1 rounded' : ''}`}>
                  <span className="text-xs font-medium text-gray-500">Key Contributions:</span>
                  <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 mt-1">
                    {project.contributions.map((contribution: string, i: number) => (
                      <li key={i}>{contribution}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="mt-6 border border-gray-200 rounded-md overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <h3 className="font-medium text-gray-700">Section Preview</h3>
        <p className="text-xs text-gray-500">This shows how the entire section will look with your change applied</p>
      </div>
      <div className="p-2">
        {renderPreview()}
      </div>
    </div>
  );
};

const RecommendationsCarousel: React.FC<RecommendationsCarouselProps> = ({
  recommendations,
  currentCVData,
  onComplete
}) => {
  // Group recommendations by section
  const [groupedRecommendations, setGroupedRecommendations] = useState<{[key: string]: RecommendationItem[]}>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [editedRecommendations, setEditedRecommendations] = useState<RecommendationItem[]>(recommendations);
  const [userInput, setUserInput] = useState('');

  // Group recommendations by section
  useEffect(() => {
    const grouped: {[key: string]: RecommendationItem[]} = {};
    recommendations.forEach(rec => {
      if (!grouped[rec.section]) {
        grouped[rec.section] = [];
      }
      grouped[rec.section].push(rec);
    });
    setGroupedRecommendations(grouped);
    setCategories(Object.keys(grouped));
  }, [recommendations]);

  // Handle next recommendation in current category
  const handleNextInCategory = () => {
    const currentCategoryItems = groupedRecommendations[categories[currentCategoryIndex]] || [];
    
    if (currentItemIndex < currentCategoryItems.length - 1) {
      // Move to next item in current category
      setCurrentItemIndex(currentItemIndex + 1);
      setUserInput(''); // Reset user input
    } else {
      // We've reached the end of this category
      handleNextCategory();
    }
  };

  // Handle moving to next category
  const handleNextCategory = () => {
    if (currentCategoryIndex < categories.length - 1) {
      // Move to next category
      setCurrentCategoryIndex(currentCategoryIndex + 1);
      setCurrentItemIndex(0); // Reset to first item in new category
      setUserInput(''); // Reset user input
    } else {
      // We've reached the end of all categories
      console.log("[Recommendations] Task completed with edited recommendations:", editedRecommendations);
      onComplete(editedRecommendations);
    }
  };

  // Handle user accepting suggestion
  const handleAccept = () => {
    // Just move to the next without changing anything
    handleNextInCategory();
  };

  // Handle user editing the suggestion
  const handleEdit = () => {
    if (userInput.trim()) {
      // Find the current recommendation
      const currentCategory = categories[currentCategoryIndex];
      const currentRec = groupedRecommendations[currentCategory][currentItemIndex];
      
      // Update recommendation in our state
      const updatedRecommendations = editedRecommendations.map(rec => {
        if (rec.id === currentRec.id) {
          return { ...rec, suggested: userInput };
        }
        return rec;
      });
      
      console.log("[Recommendations] User edited recommendation:", {
        section: currentCategory,
        field: currentRec.field,
        originalValue: currentRec.suggested,
        newValue: userInput
      });
      
      setEditedRecommendations(updatedRecommendations);
    }
    
    handleNextInCategory();
  };

  // If no recommendations, show a message
  if (recommendations.length === 0) {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
          <CardDescription>No recommendations available</CardDescription>
        </CardHeader>
        <CardContent>
          <p>No specific recommendations were generated for your CV.</p>
        </CardContent>
        <CardFooter>
          <Button onClick={() => onComplete([])}>Continue</Button>
        </CardFooter>
      </Card>
    );
  }

  // Calculate current category & item
  const currentCategory = categories[currentCategoryIndex] || "";
  const currentCategoryItems = groupedRecommendations[currentCategory] || [];
  const currentRecommendation = currentCategoryItems[currentItemIndex] || recommendations[0];
  
  // Calculate progress
  const currentCategoryProgress = ((currentItemIndex + 1) / currentCategoryItems.length) * 100;
  const overallProgress = (
    (categories.slice(0, currentCategoryIndex).reduce((acc, cat) => 
      acc + (groupedRecommendations[cat]?.length || 0), 0) + currentItemIndex + 1
    ) / recommendations.length
  ) * 100;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Personalized Recommendations</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Review and apply these AI-generated suggestions to enhance your CV.
        </p>
      </div>
      
      {/* Category indicator */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-500">
          Category {currentCategoryIndex + 1} of {categories.length}: <span className="text-blue-600 font-semibold">{currentCategory}</span>
        </span>
        <span className="text-sm font-medium text-gray-500">
          Overall: {Math.round(overallProgress)}% complete
        </span>
      </div>
      
      {/* Overall progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
        <div 
          className="bg-blue-600 h-1.5 rounded-full transition-all duration-300 ease-in-out" 
          style={{ width: `${overallProgress}%` }}
        ></div>
      </div>
      
      {/* Category progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-1 mb-4">
        <div 
          className="bg-blue-400 h-1 rounded-full transition-all duration-300 ease-in-out" 
          style={{ width: `${currentCategoryProgress}%` }}
        ></div>
      </div>
      
      <Card className="w-full border-blue-200">        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <SmartContentRenderer content={currentRecommendation.section} className="font-bold" />
          </CardTitle>
          <CardDescription>
            <span className="text-sm font-medium text-gray-600">Field: </span>
            <SmartContentRenderer content={currentRecommendation.field} className="inline" />
          </CardDescription>
        </CardHeader><CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Current Content:</h4>
            <div className="p-3 bg-gray-50 rounded border border-gray-200 text-gray-800">
              <SmartContentRenderer content={currentRecommendation.current} />
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Suggested Improvement:</h4>
            <div className="p-3 bg-blue-50 rounded border border-blue-200 text-blue-800">
              <SmartContentRenderer content={currentRecommendation.suggested} />
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Reason for Change:</h4>
            <div className="p-2 bg-yellow-50 rounded border border-yellow-200 text-yellow-800 text-sm">
              <SmartContentRenderer content={currentRecommendation.reason} />
            </div>
          </div>
            <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Your Edited Version (Optional):</h4>
            <SmartInputField
              value={userInput}
              onChange={setUserInput}
              suggestedContent={currentRecommendation.suggested}
              placeholder="Enter your own version or leave empty to accept suggestion"
            />
          </div><CVSectionPreview 
            section={currentRecommendation.section}
            field={currentRecommendation.field}
            suggested={currentRecommendation.suggested}
            userInput={userInput}
            recommendations={recommendations}
            currentCVData={currentCVData}
          />
        </CardContent>
        <CardFooter className="justify-between space-x-2 border-t border-gray-100 pt-4">
          <div className="text-sm text-muted-foreground">
            {currentItemIndex + 1} of {currentCategoryItems.length} in current category
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleAccept}>
              Skip
            </Button>
            {userInput ? (
              <Button onClick={handleEdit}>
                Save & Continue
              </Button>
            ) : (
              <Button onClick={handleNextInCategory}>
                Accept & Continue
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
      
      {/* Skip category button */}
      <div className="flex justify-end mt-4">
        <Button variant="ghost" size="sm" onClick={handleNextCategory} className="text-sm">
          Skip all in this category &rarr;
        </Button>
      </div>
    </div>
  );
};

export default RecommendationsCarousel;