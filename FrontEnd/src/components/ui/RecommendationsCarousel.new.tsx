// filepath: c:\DATN\new-cv\FrontEnd\src\components\ui\RecommendationsCarousel.tsx
import React, { useState, useEffect } from 'react';
import { RecommendationItem, EditableSection } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import ListInputField from '@/components/ui/ListInputField';

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
          setListItems(parsed);
          setInputMode('list');
          return;
        }
      } catch {
        // Not a JSON array, keep as text
      }
    }
    
    // If suggested content is a list and no current value, initialize with it
    if (!value && isSuggestedList) {
      try {
        const parsed = JSON.parse(suggestedContent);
        setListItems(parsed);
        setInputMode('list');
      } catch {
        // Fallback
      }
    }
  }, [value, suggestedContent, isSuggestedList]);

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

// Main recommendations component with sequential flow
const RecommendationsCarousel: React.FC<RecommendationsCarouselProps> = ({
  recommendations,
  currentCVData,
  onComplete
}) => {
  // Define the specific order of sections
  const sectionOrder = ['Header', 'Experience', 'Education', 'Projects', 'Skills', 'Languages'];
  
  // State for ordered recommendations flow
  const [orderedRecommendations, setOrderedRecommendations] = useState<RecommendationItem[]>([]);
  const [currentRecommendationIndex, setCurrentRecommendationIndex] = useState(0);
  const [editedRecommendations, setEditedRecommendations] = useState<RecommendationItem[]>(recommendations);
  const [userInput, setUserInput] = useState('');

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
      'Languages': ['languages', 'language']
    };
    
    const searchTerms = sectionMap[sectionName] || [sectionName.toLowerCase()];
    
    return cvData.some(section => 
      searchTerms.some(term => 
        section.id?.toLowerCase().includes(term) || 
        section.name?.toLowerCase().includes(term)
      )
    );
  };

  // Navigation handlers
  const handleNext = () => {
    if (userInput.trim()) {
      // Save user edit
      const currentRec = orderedRecommendations[currentRecommendationIndex];
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
    console.log('Missing section data to add:', data);
    handleNext();
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
    <div className="space-y-6 max-w-3xl mx-auto">
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
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }}
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
  );
};

export default RecommendationsCarousel;
