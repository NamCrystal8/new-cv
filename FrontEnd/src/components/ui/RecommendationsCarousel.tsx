import React, { useState, useEffect } from 'react';
import { RecommendationItem, EditableSection } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import ListInputField from '@/components/ui/ListInputField';
import { Badge } from '@/components/ui/badge';
import './CVPreview.css';

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

  // Reset internal state when value is cleared externally or when suggested content type changes
  useEffect(() => {
    if (!value.trim()) {
      setListItems([]);
      setInputMode('auto');
    }
  }, [value]);

  // Reset state when suggested content type changes
  useEffect(() => {
    // Reset to auto mode when suggested content type changes
    setInputMode('auto');
    setListItems([]);
  }, [isSuggestedList]);

  // Initialize list items from value or suggested content
  useEffect(() => {
    if (value) {
      // Try to parse the current value as JSON array
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          setListItems(parsed);
          setInputMode('list');
          return;
        }
      } catch {
        // Not a JSON array, keep as text
        setListItems([]);
        if (inputMode === 'auto') {
          setInputMode(isSuggestedList ? 'list' : 'text');
        }
      }
    } else {
      // No current value - initialize based on suggested content
      if (isSuggestedList) {
        try {
          const parsed = JSON.parse(suggestedContent);
          setListItems(parsed);
          setInputMode('list');
        } catch {
          setListItems([]);
          setInputMode('text');
        }
      } else {
        setListItems([]);
        setInputMode('text');
      }
    }
  }, [value, suggestedContent, isSuggestedList, inputMode]);

  const handleListChange = (newItems: string[]) => {
    setListItems(newItems);
    onChange(JSON.stringify(newItems));
  };

  const handleTextChange = (newValue: string) => {
    onChange(newValue);
  };

  const handleModeSwitch = (mode: 'list' | 'text') => {
    setInputMode(mode);
    if (mode === 'list' && !value) {
      // Start with suggested items if available
      if (isSuggestedList) {
        try {
          const parsed = JSON.parse(suggestedContent);
          setListItems(parsed);
          onChange(JSON.stringify(parsed));
        } catch {
          setListItems([]);
          onChange('[]');
        }
      } else {
        setListItems([]);
        onChange('[]');
      }
    } else if (mode === 'text' && Array.isArray(listItems) && listItems.length > 0) {
      // Convert list items to text format
      const textValue = listItems.join('\n');
      onChange(textValue);
    }
  };

  // Determine current mode
  const currentMode = inputMode === 'auto' ? (isSuggestedList ? 'list' : 'text') : inputMode;

  return (
    <div className="space-y-2">
      {/* Mode selector */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={currentMode === 'text' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleModeSwitch('text')}
        >
          Text
        </Button>
        <Button
          type="button"
          variant={currentMode === 'list' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleModeSwitch('list')}
        >
          List
        </Button>
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

// Component for rendering form to add missing sections
const MissingSectionForm: React.FC<{
  sectionName: string;
  onComplete: (data: any) => void;
  onSkip: () => void;
}> = ({ sectionName, onComplete, onSkip }) => {
  const [formData, setFormData] = useState<any>({});

  const renderForm = () => {
    switch (sectionName.toLowerCase()) {
      case 'experience':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Add Work Experience</h3>
            <p className="text-gray-600">You don't have any work experience listed. Let's add your first position:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Company Name"
                className="p-3 border rounded"
                value={formData.company || ''}
                onChange={(e) => setFormData({...formData, company: e.target.value})}
              />
              <input
                type="text"
                placeholder="Job Title"
                className="p-3 border rounded"
                value={formData.title || ''}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
              <input
                type="text"
                placeholder="Start Date (e.g., Jan 2020)"
                className="p-3 border rounded"
                value={formData.start_date || ''}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
              />
              <input
                type="text"
                placeholder="End Date (e.g., Present)"
                className="p-3 border rounded"
                value={formData.end_date || ''}
                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
              />
            </div>
            <textarea
              placeholder="Key achievements (one per line)"
              className="w-full p-3 border rounded"
              rows={4}
              value={formData.achievements || ''}
              onChange={(e) => setFormData({...formData, achievements: e.target.value})}
            />
          </div>
        );
      
      case 'education':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Add Education</h3>
            <p className="text-gray-600">Add your educational background:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Institution Name"
                className="p-3 border rounded"
                value={formData.institution || ''}
                onChange={(e) => setFormData({...formData, institution: e.target.value})}
              />
              <input
                type="text"
                placeholder="Degree"
                className="p-3 border rounded"
                value={formData.degree || ''}
                onChange={(e) => setFormData({...formData, degree: e.target.value})}
              />
              <input
                type="text"
                placeholder="Graduation Year"
                className="p-3 border rounded"
                value={formData.graduation_date || ''}
                onChange={(e) => setFormData({...formData, graduation_date: e.target.value})}
              />
              <input
                type="text"
                placeholder="Location"
                className="p-3 border rounded"
                value={formData.location || ''}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
            </div>
          </div>
        );
      
      default:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Add {sectionName}</h3>
            <p className="text-gray-600">This section is missing from your CV. You can add it now or skip for later.</p>
            <textarea
              placeholder={`Enter your ${sectionName.toLowerCase()} information...`}
              className="w-full p-3 border rounded"
              rows={4}
              value={formData.content || ''}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
            />
          </div>
        );
    }
  };

  const handleSubmit = () => {
    onComplete(formData);
  };

  const isFormValid = () => {
    switch (sectionName.toLowerCase()) {
      case 'experience':
        return formData.company && formData.title;
      case 'education':
        return formData.institution && formData.degree;
      default:
        return formData.content && formData.content.trim();
    }
  };

  return (
    <div className="space-y-6">
      {renderForm()}
      <div className="flex gap-3">
        <Button 
          onClick={handleSubmit} 
          disabled={!isFormValid()}
          className="flex-1"
        >
          Add {sectionName}
        </Button>
        <Button 
          variant="outline" 
          onClick={onSkip}
        >
          Skip for now
        </Button>
      </div>
    </div>
  );
};

/**
 * CV Section Preview Component
 *
 * Renders a Harvard-style preview of a CV section with highlighting for changes.
 * Supports all major CV section types including header, education, experience,
 * projects, skills, and languages.
 */
interface CVSectionPreviewProps {
  section: EditableSection;
  changes: string[];
  sectionType: string;
}

const CVSectionPreview: React.FC<CVSectionPreviewProps> = ({ section, changes }) => {
  const hasChanges = changes && changes.length > 0;
  const renderHarvardStyleSection = () => {
    switch (section.type) {
      case 'object':
        if (section.id === 'header') {
          const nameField = section.fields.find((f: any) => f.id === 'name');
          const emailField = section.fields.find((f: any) => f.id === 'email');
          const phoneField = section.fields.find((f: any) => f.id === 'phone');
          const locationField = section.fields.find((f: any) => f.id === 'location');

          return (
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {nameField?.value || 'Your Name'}
              </h1>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex justify-center items-center gap-4 flex-wrap">
                  {emailField?.value && (
                    <span className="flex items-center gap-1">
                      📧 {emailField.value}
                    </span>
                  )}
                  {phoneField?.value && (
                    <span className="flex items-center gap-1">
                      📞 {phoneField.value}
                    </span>
                  )}
                  {locationField?.value && (
                    <span className="flex items-center gap-1">
                      📍 {locationField.value}
                    </span>
                  )}
                </div>
              </div>
              <hr className="mt-4 border-gray-300" />
            </div>
          );
        }
        break;

      case 'list':
        return (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-center mb-4 border-b border-gray-300 pb-2">
              {section.name}
            </h2>
            <div className="space-y-4">
              {(section as any).items?.map((item: any, index: number) => (
                <div key={item.id || index} className="space-y-2">
                  {section.id === 'education' && (
                    <div>
                      <div className="flex justify-between items-start">
                        <div className="font-bold">{item.institution || 'Institution Name'}</div>
                        <div className="text-sm text-gray-600">{item.location || 'Location'}</div>
                      </div>
                      <div className="flex justify-between items-start">
                        <div className="italic">{item.degree || 'Degree'}</div>
                        <div className="text-sm text-gray-600">{item.graduation_date || 'Date'}</div>
                      </div>
                      {item.gpa && (
                        <div className="text-sm">GPA: {item.gpa}</div>
                      )}
                    </div>
                  )}

                  {section.id === 'experience' && (
                    <div>
                      <div className="flex justify-between items-start">
                        <div className="font-bold">{item.company || 'Company Name'}</div>
                        <div className="text-sm text-gray-600">{item.location || 'Location'}</div>
                      </div>
                      <div className="flex justify-between items-start">
                        <div className="italic">{item.title || 'Job Title'}</div>
                        <div className="text-sm text-gray-600">
                          {item.start_date || 'Start'} - {item.is_current ? 'Present' : (item.end_date || 'End')}
                        </div>
                      </div>
                      {item.achievements && Array.isArray(item.achievements) && item.achievements.length > 0 && (
                        <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                          {item.achievements.map((achievement: string, achIndex: number) => (
                            <li key={achIndex} className="text-gray-700">{achievement}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {section.id === 'projects' && (
                    <div>
                      <div className="flex justify-between items-start">
                        <div className="font-bold">{item.title || 'Project Title'}</div>
                        <div className="text-sm text-gray-600">
                          {item.start_date || 'Start'} - {item.end_date || 'End'}
                        </div>
                      </div>
                      {item.description && (
                        <div className="text-sm text-gray-700 mt-1">{item.description}</div>
                      )}
                      {item.contributions && Array.isArray(item.contributions) && item.contributions.length > 0 && (
                        <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                          {item.contributions.map((contribution: string, contIndex: number) => (
                            <li key={contIndex} className="text-gray-700">{contribution}</li>
                          ))}
                        </ul>
                      )}
                      {item.technologies && Array.isArray(item.technologies) && item.technologies.length > 0 && (
                        <div className="text-sm text-gray-600 mt-2">
                          <span className="italic">Technologies: </span>
                          {item.technologies.join(', ')}
                        </div>
                      )}
                    </div>
                  )}

                  {section.id === 'certifications' && (
                    <div>
                      <div className="flex justify-between items-start">
                        <div className="font-bold">{item.title || 'Certification Title'}</div>
                        <div className="text-sm text-gray-600">{item.date || 'Date'}</div>
                      </div>
                      <div className="text-sm text-gray-700">{item.institution || 'Issuing Institution'}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'nested_list':
        if (section.id === 'skills') {
          return (
            <div className="mb-6">
              <h2 className="text-xl font-bold text-center mb-4 border-b border-gray-300 pb-2">
                {section.name}
              </h2>
              <div className="space-y-3">
                {(section as any).categories?.map((category: any, index: number) => (
                  <div key={category.id || index}>
                    <span className="font-bold">{category.name || 'Category'}:</span>{' '}
                    <span className="text-gray-700">
                      {Array.isArray(category.items) ? category.items.join(', ') : 'Skills list'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        break;

      case 'interests':
        return (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-center mb-4 border-b border-gray-300 pb-2">
              {section.name}
            </h2>
            <div className="text-center">
              {Array.isArray((section as any).items) && (section as any).items.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-2">
                  {(section as any).items.map((interest: string, index: number) => (
                    <span key={index} className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                      {interest}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 italic">No interests listed</div>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-gray-500">
            Preview not available for this section type
          </div>
        );
    }
  };

  return (
    <div className={`harvard-cv-preview font-serif ${hasChanges ? 'highlight-modified' : ''}`}>
      {renderHarvardStyleSection()}
      {hasChanges && (
        <div className="mt-4 p-2 bg-blue-50 rounded text-xs text-blue-700">
          ✨ This section has been modified based on the recommendation
        </div>
      )}
    </div>
  );
};

/**
 * CV Preview Panel Component
 *
 * Provides a real-time preview of how CV sections will look when recommendations
 * are applied. Features include:
 * - Before/after comparison toggle
 * - Harvard-style CV formatting
 * - Change highlighting and annotations
 * - Responsive design with sticky positioning on larger screens
 * - Support for missing section previews
 */
interface CVPreviewPanelProps {
  currentCVData: EditableSection[];
  currentRecommendation: RecommendationItem;
  userInput: string;
  appliedRecommendations?: Set<string>;
}

const CVPreviewPanel: React.FC<CVPreviewPanelProps> = ({
  currentCVData,
  currentRecommendation,
  userInput,
  appliedRecommendations = new Set()
}) => {
  const [previewData, setPreviewData] = useState<any>(null);
  const [showBefore, setShowBefore] = useState(false);

  // Check if current recommendation has been applied
  const isCurrentRecommendationApplied = appliedRecommendations.has(currentRecommendation.id);

  // Generate preview data based on current recommendation
  useEffect(() => {
    const generatePreview = () => {
      console.log('🖼️ Generating preview for:', {
        recommendation: currentRecommendation,
        currentCVData: currentCVData.map(s => ({ id: s.id, name: s.name })),
        appliedRecommendations: Array.from(appliedRecommendations),
        isApplied: isCurrentRecommendationApplied
      });

      // Find the relevant section from current CV data using enhanced matching
      const relevantSection = currentCVData.find(section =>
        matchSection(section, currentRecommendation.section)
      );

      console.log('🔍 Found relevant section:', relevantSection);

      if (!relevantSection) {
        console.log('❌ No relevant section found');
        setPreviewData(null);
        return;
      }

      // If recommendation has been applied, the currentCVData already contains the changes
      // So we need to show the original state vs the current state
      let originalSection = relevantSection;
      let modifiedSection = relevantSection;

      if (!isCurrentRecommendationApplied) {
        // Recommendation not yet applied - show what it would look like
        modifiedSection = applyRecommendationToSection(relevantSection, currentRecommendation, userInput);
      } else {
        // Recommendation already applied - current data IS the modified state
        // We need to reconstruct what the original looked like (this is complex, so we'll show current as both)
        originalSection = relevantSection;
        modifiedSection = relevantSection;
      }

      // Create preview with applied recommendation
      const preview = {
        section: relevantSection,
        original: originalSection,
        modified: modifiedSection,
        changes: isCurrentRecommendationApplied ?
          [`✅ This recommendation has been applied`] :
          getChanges(relevantSection, currentRecommendation, userInput)
      };

      setPreviewData(preview);
    };

    generatePreview();
  }, [currentCVData, currentRecommendation, userInput, isCurrentRecommendationApplied]);

  if (!previewData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">CV Preview</CardTitle>
          <CardDescription>
            {currentRecommendation.field === 'new_section'
              ? 'Preview of new section to be added'
              : 'Preview will show when a section is being modified'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentRecommendation.field === 'new_section' ? (
            <div className="border rounded-lg p-4 bg-white min-h-[400px]">
              <div className="harvard-cv-preview font-serif">
                <h2 className="text-xl font-bold text-center mb-4 border-b border-gray-300 pb-2">
                  {currentRecommendation.section}
                </h2>
                <div className="text-center py-8 text-gray-500 italic">
                  This section will be added to your CV
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No preview available for this recommendation
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          CV Preview
          <Badge variant="secondary" className="text-xs">
            {currentRecommendation.section}
          </Badge>
          {isCurrentRecommendationApplied && (
            <Badge variant="default" className="text-xs bg-green-600">
              ✅ Applied
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {isCurrentRecommendationApplied
            ? 'This recommendation has been applied to your CV'
            : 'See how your CV will look with this recommendation applied'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Before/After Toggle */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={showBefore ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => setShowBefore(true)}
          >
            {isCurrentRecommendationApplied ? 'Original' : 'Before'}
          </Button>
          <Button
            variant={!showBefore ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => setShowBefore(false)}
          >
            {isCurrentRecommendationApplied ? 'Current' : 'After'}
          </Button>
        </div>

        {/* Preview Content */}
        <div className="border rounded-lg p-4 bg-white min-h-[400px] max-h-[600px] overflow-y-auto relative">
          <CVSectionPreview
            section={showBefore ? previewData.original : previewData.modified}
            changes={showBefore ? [] : previewData.changes}
            sectionType={currentRecommendation.section}
          />

          {/* Scroll indicator */}
          <div className="absolute top-2 right-2 text-xs text-gray-400 bg-white px-2 py-1 rounded shadow">
            {showBefore ? 'Before' : 'After'}
          </div>
        </div>

        {/* Changes Summary */}
        {previewData.changes.length > 0 && (
          <div className={`mt-4 p-3 rounded border ${
            isCurrentRecommendationApplied
              ? 'bg-green-50 border-green-200'
              : 'bg-blue-50 border-blue-200'
          }`}>
            <h4 className={`text-sm font-medium mb-2 ${
              isCurrentRecommendationApplied ? 'text-green-800' : 'text-blue-800'
            }`}>
              {isCurrentRecommendationApplied ? 'Status:' : 'Changes to Apply:'}
            </h4>
            <ul className={`text-sm space-y-1 ${
              isCurrentRecommendationApplied ? 'text-green-700' : 'text-blue-700'
            }`}>
              {previewData.changes.map((change: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <span className={`mt-0.5 ${
                    isCurrentRecommendationApplied ? 'text-green-500' : 'text-blue-500'
                  }`}>
                    {isCurrentRecommendationApplied ? '✅' : '•'}
                  </span>
                  {change}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Helper function to apply recommendation to section
const applyRecommendationToSection = (
  section: EditableSection,
  recommendation: RecommendationItem,
  userInput: string
): EditableSection => {
  const contentToApply = userInput.trim() || recommendation.suggested;

  // Handle dotted field recommendations first
  if (recommendation.field.includes('.')) {
    return handleDottedFieldRecommendation(section, recommendation, contentToApply);
  }

  const modifiedSection = JSON.parse(JSON.stringify(section)); // Deep clone

  // Apply changes based on section type and field
  switch (section.type) {
    case 'object':
      if (section.id === 'header' && 'fields' in section) {
        const field = modifiedSection.fields.find((f: any) => f.id === recommendation.field);
        if (field) {
          field.value = contentToApply;
        }
      }
      break;

    case 'list':
      // Handle list-based sections (education, experience, projects)
      if (recommendation.field === 'new_item') {
        // Add new item to the list
        const newItem = createNewItemForSection(section.id, contentToApply);
        (modifiedSection as any).items.push(newItem);
      } else if (recommendation.field === 'achievements') {
        // Add achievement to the first item
        if ((modifiedSection as any).items.length > 0) {
          const firstItem = (modifiedSection as any).items[0];
          firstItem.achievements = [...(firstItem.achievements || []), contentToApply];
        }
      }
      break;

    case 'nested_list':
      // Handle skills section
      if (section.id === 'skills') {
        if (recommendation.field === 'new_category') {
          const newCategory = {
            id: Date.now().toString(),
            name: contentToApply,
            items: []
          };
          (modifiedSection as any).categories.push(newCategory);
        }
      }
      break;

    case 'interests':
      // Handle interests section (simple array of strings)
      if (recommendation.field === 'new_item') {
        (modifiedSection as any).items = [...((section as any).items || []), contentToApply];
      }
      break;
  }

  return modifiedSection;
};

// Helper function to get list of changes
const getChanges = (
  section: EditableSection,
  recommendation: RecommendationItem,
  userInput: string
): string[] => {
  const changes: string[] = [];
  const contentToApply = userInput.trim() || recommendation.suggested;

  switch (recommendation.field) {
    case 'name':
      changes.push(`Updated name to: "${contentToApply}"`);
      break;
    case 'email':
      changes.push(`Updated email to: "${contentToApply}"`);
      break;
    case 'phone':
      changes.push(`Updated phone to: "${contentToApply}"`);
      break;
    case 'location':
      changes.push(`Updated location to: "${contentToApply}"`);
      break;
    case 'achievements':
      changes.push(`Added achievement: "${contentToApply}"`);
      break;
    case 'new_item':
      changes.push(`Added new ${section.name.toLowerCase()} entry`);
      break;
    case 'new_category':
      changes.push(`Added new skill category: "${contentToApply}"`);
      break;
    default:
      changes.push(`Updated ${recommendation.field}: "${contentToApply}"`);
  }

  return changes;
};

// Helper function to match sections with flexible matching
const matchSection = (section: EditableSection, recommendationSection: string): boolean => {
  const recSection = recommendationSection.toLowerCase();
  const sectionId = section.id.toLowerCase();
  const sectionName = section.name.toLowerCase();

  // Direct matches
  if (sectionId === recSection || sectionName === recSection) {
    return true;
  }

  // Flexible matching with common variations
  const sectionMappings: { [key: string]: string[] } = {
    'header': ['header', 'contact', 'contact information', 'personal', 'personal information'],
    'experience': ['experience', 'work', 'work experience', 'employment', 'professional experience'],
    'education': ['education', 'academic', 'academic background', 'qualifications'],
    'skills': ['skills', 'skill', 'technical skills', 'technical', 'competencies', 'languages', 'language', 'language skills'],
    'projects': ['projects', 'project', 'portfolio', 'work samples'],
    'interests': ['interests', 'interest', 'hobbies', 'personal interests'],
    'certifications': ['certifications', 'certification', 'certificates', 'credentials', 'qualifications']
  };

  // Check if the section matches any of the mapped variations
  for (const [key, variations] of Object.entries(sectionMappings)) {
    if (variations.includes(recSection) && (sectionId === key || variations.includes(sectionId))) {
      return true;
    }
  }

  // Partial matches
  if (sectionName.includes(recSection) || sectionId.includes(recSection) ||
      recSection.includes(sectionId) || recSection.includes(sectionName)) {
    return true;
  }

  return false;
};

// Helper function to handle dotted field recommendations (e.g., "experience.0.achievements")
const handleDottedFieldRecommendation = (
  section: EditableSection,
  recommendation: RecommendationItem,
  contentToApply: string
): EditableSection => {
  const fieldParts = recommendation.field.split('.');
  console.log('🔗 Handling dotted field:', {
    field: recommendation.field,
    parts: fieldParts,
    sectionId: section.id,
    recommendationSection: recommendation.section
  });

  // Check if this recommendation applies to this section
  if (fieldParts.length >= 2) {
    const targetSectionType = fieldParts[0]; // e.g., "experience", "education"

    // Match section type with current section
    const sectionMatches =
      section.id === targetSectionType ||
      section.id === targetSectionType.toLowerCase() ||
      matchSection(section, targetSectionType);

    if (!sectionMatches) {
      console.log('🚫 Dotted field section mismatch:', { targetSectionType, sectionId: section.id });
      return section;
    }

    // Handle different dotted field patterns
    if (fieldParts.length === 3) {
      // Pattern: "experience.0.achievements" or "education.0.institution"
      const itemIndex = parseInt(fieldParts[1]);
      const fieldName = fieldParts[2];

      if (isNaN(itemIndex)) {
        console.log('❌ Invalid item index in dotted field:', fieldParts[1]);
        return section;
      }

      const modifiedSection = JSON.parse(JSON.stringify(section)); // Deep clone

      if (section.type === 'list' && 'items' in section) {
        const items = (section as any).items;
        if (itemIndex < items.length) {
          console.log('📝 Updating item field:', { itemIndex, fieldName, oldValue: items[itemIndex][fieldName] });

          if (fieldName === 'achievements') {
            // Special handling for achievements (array field)
            try {
              // Try to parse as JSON array first
              const newAchievements = JSON.parse(contentToApply);
              if (Array.isArray(newAchievements)) {
                (modifiedSection as any).items[itemIndex][fieldName] = newAchievements;
              } else {
                // If not an array, add as single achievement
                (modifiedSection as any).items[itemIndex][fieldName] = [
                  ...(items[itemIndex][fieldName] || []),
                  contentToApply
                ];
              }
            } catch {
              // If not valid JSON, treat as single achievement
              (modifiedSection as any).items[itemIndex][fieldName] = [
                ...(items[itemIndex][fieldName] || []),
                contentToApply
              ];
            }
          } else {
            // Regular field update
            (modifiedSection as any).items[itemIndex][fieldName] = contentToApply;
          }

          console.log('✅ Dotted field updated:', {
            itemIndex,
            fieldName,
            newValue: (modifiedSection as any).items[itemIndex][fieldName]
          });
        } else {
          console.log('❌ Item index out of bounds:', { itemIndex, itemsLength: items.length });
        }
      }

      return modifiedSection;
    }
  }

  console.log('🤷 Unhandled dotted field pattern:', recommendation.field);
  return section;
};

// Helper function to create new items for different section types
const createNewItemForSection = (sectionId: string, content: string): any => {
  const baseId = Date.now().toString();

  switch (sectionId) {
    case 'education':
      return {
        id: baseId,
        institution: content,
        start_date: '',
        graduation_date: '',
        gpa: ''
      };

    case 'experience':
      return {
        id: baseId,
        company: content,
        title: '',
        location: '',
        start_date: '',
        end_date: '',
        is_current: false,
        achievements: []
      };

    case 'projects':
      return {
        id: baseId,
        title: content,
        description: '',
        start_date: '',
        end_date: '',
        technologies: [],
        contributions: []
      };

    case 'certifications':
      return {
        id: baseId,
        title: content,
        institution: '',
        date: ''
      };

    default:
      return { id: baseId, name: content };
  }
};

// Main recommendations component with sequential flow
const RecommendationsCarousel: React.FC<RecommendationsCarouselProps> = ({
  recommendations,
  currentCVData,
  onComplete
}) => {
  // Define the specific order of sections
  const sectionOrder = ['Header', 'Experience', 'Education', 'Projects', 'Skills', 'Interests', 'Certifications'];

  // State for ordered recommendations flow
  const [orderedRecommendations, setOrderedRecommendations] = useState<RecommendationItem[]>([]);
  const [currentRecommendationIndex, setCurrentRecommendationIndex] = useState(0);
  const [editedRecommendations, setEditedRecommendations] = useState<RecommendationItem[]>(recommendations);
  const [userInput, setUserInput] = useState('');

  // State for tracking applied changes to CV data
  const [updatedCVData, setUpdatedCVData] = useState<EditableSection[]>(currentCVData);
  const [appliedRecommendations, setAppliedRecommendations] = useState<Set<string>>(new Set());

  // Order recommendations by the specified sequence and add missing section forms
  useEffect(() => {
    const ordered: RecommendationItem[] = [];
    const processedSections = new Set<string>();
    
    // First, add recommendations in the specified order
    sectionOrder.forEach(sectionName => {
      const sectionRecommendations = recommendations.filter(rec => 
        rec.section.toLowerCase() === sectionName.toLowerCase()
      );
      
      if (sectionRecommendations.length > 0) {
        ordered.push(...sectionRecommendations);
        processedSections.add(sectionName.toLowerCase());
      } else {
        // Check if this section is missing entirely from CV data
        const sectionExists = checkSectionExists(sectionName, currentCVData);
        if (!sectionExists) {
          // Create a form recommendation for missing sections
          const missingFormRec: RecommendationItem = {
            id: `missing_${sectionName.toLowerCase()}`,
            section: sectionName,
            field: 'new_section',
            current: 'empty',
            suggested: `Add ${sectionName.toLowerCase()} section`,
            reason: `${sectionName} section is missing and important for a complete CV`
          };
          ordered.push(missingFormRec);
        }
      }
    });
    
    // Add any remaining recommendations that don't fit the standard sections
    recommendations.forEach(rec => {
      if (!processedSections.has(rec.section.toLowerCase()) && 
          !sectionOrder.some(s => s.toLowerCase() === rec.section.toLowerCase())) {
        ordered.push(rec);
      }
    });
    
    setOrderedRecommendations(ordered);
  }, [recommendations, currentCVData]);

  // Helper function to check if a section exists in CV data
  const checkSectionExists = (sectionName: string, cvData: EditableSection[]): boolean => {
    const sectionMap: {[key: string]: string[]} = {
      'Header': ['header', 'contact', 'personal'],
      'Experience': ['experience', 'work', 'employment'],
      'Education': ['education', 'academic'],
      'Projects': ['projects', 'project'],
      'Skills': ['skills', 'skill', 'technical'],
      'Interests': ['interests', 'interest', 'hobbies'],
      'Certifications': ['certifications', 'certification', 'certificates']
    };
    
    const searchTerms = sectionMap[sectionName] || [sectionName.toLowerCase()];
    
    return cvData.some(section => 
      searchTerms.some(term => 
        section.id?.toLowerCase().includes(term) || 
        section.name?.toLowerCase().includes(term)
      )
    );
  };

  // Function to apply a recommendation to the CV data
  const applyRecommendationToCVData = (
    recommendation: RecommendationItem,
    userInputValue: string
  ): EditableSection[] => {
    const contentToApply = userInputValue.trim() || recommendation.suggested;

    console.log('🔧 Applying recommendation:', {
      section: recommendation.section,
      field: recommendation.field,
      content: contentToApply,
      currentCVData: updatedCVData.map(s => ({ id: s.id, name: s.name, type: s.type }))
    });

    const result = updatedCVData.map(section => {
      // Check if this is a dotted field name (e.g., "experience.0.achievements")
      if (recommendation.field.includes('.')) {
        return handleDottedFieldRecommendation(section, recommendation, contentToApply);
      }

      // Enhanced section matching logic with comprehensive mapping
      const sectionMatches = matchSection(section, recommendation.section);

      console.log('🔍 Section match check:', {
        sectionId: section.id,
        sectionName: section.name,
        recommendationSection: recommendation.section,
        matches: sectionMatches
      });

      if (!sectionMatches) return section;

      // Apply the recommendation based on section type and field
      const modifiedSection = JSON.parse(JSON.stringify(section)); // Deep clone

      console.log('✏️ Modifying section:', {
        sectionType: section.type,
        sectionId: section.id,
        recommendationField: recommendation.field,
        hasFields: 'fields' in section,
        hasItems: 'items' in section,
        hasCategories: 'categories' in section
      });

      switch (section.type) {
        case 'object':
          if (section.id === 'header' && 'fields' in section) {
            console.log('📝 Updating header field:', recommendation.field);
            modifiedSection.fields = section.fields.map((field: any) => {
              if (field.id === recommendation.field) {
                console.log('✅ Field updated:', { fieldId: field.id, oldValue: field.value, newValue: contentToApply });
                return { ...field, value: contentToApply };
              }
              return field;
            });
          }
          break;

        case 'list':
          console.log('📋 Updating list section:', { field: recommendation.field, itemsCount: (section as any).items?.length });
          if (recommendation.field === 'new_item') {
            // Add new item to the list
            const newItem = createNewItemForSection(section.id, contentToApply);
            console.log('➕ Adding new item:', newItem);
            (modifiedSection as any).items = [...(section as any).items, newItem];
          } else if (recommendation.field === 'achievements') {
            // Add achievement to the first item or create new item
            console.log('🏆 Adding achievement to first item');
            (modifiedSection as any).items = (section as any).items.map((item: any, index: number) => {
              if (index === 0) { // Add to first item for simplicity
                const updatedItem = {
                  ...item,
                  achievements: [...(item.achievements || []), contentToApply]
                };
                console.log('✅ Achievement added:', { oldAchievements: item.achievements, newAchievements: updatedItem.achievements });
                return updatedItem;
              }
              return item;
            });
          }
          break;

        case 'nested_list':
          console.log('🗂️ Updating nested list section');
          if (section.id === 'skills' && recommendation.field === 'new_category') {
            const newCategory = {
              id: Date.now().toString(),
              name: contentToApply,
              items: []
            };
            console.log('📂 Adding new skill category:', newCategory);
            (modifiedSection as any).categories = [...(section as any).categories, newCategory];
          }
          break;

        case 'interests':
          console.log('🎯 Updating interests section');
          if (recommendation.field === 'new_item') {
            console.log('➕ Adding new interest:', contentToApply);
            (modifiedSection as any).items = [...((section as any).items || []), contentToApply];
          }
          break;
      }

      console.log('🔄 Section modification result:', {
        original: section,
        modified: modifiedSection,
        changed: JSON.stringify(section) !== JSON.stringify(modifiedSection)
      });

      return modifiedSection;
    });

    console.log('🎯 Final result of applyRecommendationToCVData:', {
      originalData: updatedCVData,
      newData: result,
      hasChanges: JSON.stringify(updatedCVData) !== JSON.stringify(result)
    });

    return result;
  };

  // Navigation handlers
  const handleNext = () => {
    const currentRec = orderedRecommendations[currentRecommendationIndex];

    console.log('🚀 handleNext called:', {
      currentRec,
      userInput,
      currentIndex: currentRecommendationIndex,
      isNewSection: currentRec.field === 'new_section'
    });

    // Apply the recommendation to CV data
    if (currentRec.field !== 'new_section') {
      console.log('📊 Before applying recommendation - CV data:', updatedCVData);
      const newCVData = applyRecommendationToCVData(currentRec, userInput);
      console.log('📊 After applying recommendation - CV data:', newCVData);
      setUpdatedCVData(newCVData);
      setAppliedRecommendations(prev => {
        const newSet = new Set([...prev, currentRec.id]);
        console.log('✅ Applied recommendations updated:', newSet);
        return newSet;
      });
    }

    if (userInput.trim()) {
      // Save user edit
      const updatedRecommendations = editedRecommendations.map(rec => {
        if (rec.id === currentRec.id) {
          return { ...rec, suggested: userInput };
        }
        return rec;
      });
      setEditedRecommendations(updatedRecommendations);
    }

    setUserInput('');

    if (currentRecommendationIndex < orderedRecommendations.length - 1) {
      setCurrentRecommendationIndex(currentRecommendationIndex + 1);
    } else {
      onComplete(editedRecommendations);
    }
  };

  const handleSkip = () => {
    setUserInput('');
    if (currentRecommendationIndex < orderedRecommendations.length - 1) {
      setCurrentRecommendationIndex(currentRecommendationIndex + 1);
    } else {
      onComplete(editedRecommendations);
    }
  };

  const handleMissingSectionComplete = (data: any) => {
    // Handle the addition of missing section data
    const currentRec = orderedRecommendations[currentRecommendationIndex];

    // Create a new section based on the section type
    const newSection = createNewSection(currentRec.section, data);

    if (newSection) {
      // Add the new section to CV data
      setUpdatedCVData(prev => [...prev, newSection]);
      setAppliedRecommendations(prev => new Set([...prev, currentRec.id]));
    }

    console.log('Missing section data to add:', data);
    handleNext();
  };

  // Helper function to create new sections
  const createNewSection = (sectionName: string, _data: any): EditableSection | null => {
    const sectionId = sectionName.toLowerCase();

    switch (sectionId) {
      case 'education':
        return {
          id: 'education',
          name: 'Education',
          type: 'list',
          items: [],
          template: {
            institution: '',
            degree: '',
            location: '',
            graduation_date: '',
            gpa: '',
            relevant_coursework: '',
            academic_achievements: []
          }
        } as any;

      case 'experience':
        return {
          id: 'experience',
          name: 'Experience',
          type: 'list',
          items: [],
          template: {
            company: '',
            title: '',
            location: '',
            start_date: '',
            end_date: '',
            is_current: false,
            achievements: []
          }
        } as any;

      case 'projects':
        return {
          id: 'projects',
          name: 'Projects',
          type: 'list',
          items: [],
          template: {
            title: '',
            description: '',
            start_date: '',
            end_date: '',
            technologies: [],
            contributions: []
          }
        } as any;

      case 'skills':
        return {
          id: 'skills',
          name: 'Skills',
          type: 'nested_list',
          categories: []
        } as any;

      case 'interests':
        return {
          id: 'interests',
          name: 'Interests',
          type: 'interests',
          items: [],
          template: ''
        } as any;

      case 'certifications':
        return {
          id: 'certifications',
          name: 'Certifications',
          type: 'list',
          items: [],
          template: {
            title: '',
            institution: '',
            date: ''
          }
        } as any;

      default:
        return null;
    }
  };

  // If no recommendations, show completion message
  if (orderedRecommendations.length === 0) {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Recommendations Complete</CardTitle>
          <CardDescription>Your CV looks good! No specific recommendations at this time.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Your CV appears to be well-structured and complete.</p>
        </CardContent>
        <CardFooter>
          <Button onClick={() => onComplete([])}>Continue</Button>
        </CardFooter>
      </Card>
    );
  }

  const currentRecommendation = orderedRecommendations[currentRecommendationIndex];
  const progress = ((currentRecommendationIndex + 1) / orderedRecommendations.length) * 100;

  // Get current section and position in the flow
  const currentSection = currentRecommendation.section;
  const sectionIndex = sectionOrder.indexOf(currentSection) + 1;
  const totalSections = sectionOrder.length;

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto">
      {/* Left side - Recommendations */}
      <div className="flex-1 space-y-6 lg:max-w-3xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">CV Improvement Flow</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Follow this guided flow to improve your CV section by section.
          </p>
        </div>
      
      {/* Progress section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-600">
            Step {sectionIndex} of {totalSections}: {currentSection}
          </span>
          <span className="text-gray-500">
            {currentRecommendationIndex + 1} of {orderedRecommendations.length} recommendations
          </span>
        </div>        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full progress-bar"
            style={{ width: `${progress}%` } as React.CSSProperties}
          />
        </div>
        <div className="text-xs text-gray-500 text-center">
          {Math.round(progress)}% complete
        </div>
      </div>

      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">{sectionIndex}</span>
            </div>
            <div>
              <CardTitle className="text-lg">{currentSection}</CardTitle>
              <CardDescription>{currentRecommendation.field}</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {currentRecommendation.field === 'new_section' ? (
            <MissingSectionForm
              sectionName={currentSection}
              onComplete={handleMissingSectionComplete}
              onSkip={handleSkip}
            />
          ) : (
            <>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Current:</h4>
                <div className="p-3 bg-gray-50 rounded border">
                  <SmartContentRenderer content={currentRecommendation.current} />
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Suggested Improvement:</h4>
                <div className="p-3 bg-blue-50 rounded border border-blue-200">
                  <SmartContentRenderer content={currentRecommendation.suggested} />
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Why this matters:</h4>
                <div className="p-2 bg-yellow-50 rounded border border-yellow-200 text-sm">
                  <SmartContentRenderer content={currentRecommendation.reason} />
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Your Version (Optional):</h4>
                <SmartInputField
                  key={`${currentRecommendation.id}-${currentRecommendationIndex}`}
                  value={userInput}
                  onChange={setUserInput}
                  suggestedContent={currentRecommendation.suggested}
                  placeholder="Edit the suggestion or leave empty to accept as-is"
                />
              </div>
            </>
          )}
        </CardContent>

        {currentRecommendation.field !== 'new_section' && (
          <CardFooter className="flex justify-between">
            <div className="text-sm text-gray-500">
              {currentRecommendationIndex + 1} of {orderedRecommendations.length}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSkip}>
                Skip
              </Button>
              <Button onClick={handleNext}>
                {userInput.trim() ? 'Save & Continue' : 'Accept & Continue'}
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
      </div>

      {/* Right side - CV Preview */}
      <div className="flex-1 lg:max-w-2xl">
        <div className="lg:sticky lg:top-4">
          <CVPreviewPanel
            currentCVData={updatedCVData}
            currentRecommendation={currentRecommendation}
            userInput={userInput}
            appliedRecommendations={appliedRecommendations}
          />
        </div>
      </div>
    </div>
  );
};

export default RecommendationsCarousel;