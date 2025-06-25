import React, { useState } from 'react';
import { RecommendationItem, EditableSection } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Demo component to showcase the CV Preview functionality
const CVPreviewDemo: React.FC = () => {
  // Sample CV data for demonstration
  const [_sampleCVData] = useState<EditableSection[]>([
    {
      id: 'header',
      name: 'Contact Information',
      type: 'object',
      fields: [
        { id: 'name', name: 'Full Name', value: 'John Doe' },
        { id: 'email', name: 'Email', value: 'john.doe@email.com' },
        { id: 'phone', name: 'Phone', value: '(555) 123-4567' },
        { id: 'location', name: 'Location', value: 'New York, NY' }
      ]
    },
    {
      id: 'experience',
      name: 'Experience',
      type: 'list',
      items: [
        {
          id: '1',
          company: 'Tech Corp',
          title: 'Software Developer',
          location: 'San Francisco, CA',
          start_date: 'Jan 2020',
          end_date: 'Present',
          is_current: true,
          achievements: [
            'Developed web applications using React and Node.js',
            'Collaborated with cross-functional teams'
          ]
        }
      ],
      template: {
        company: '',
        title: '',
        location: '',
        start_date: '',
        end_date: '',
        is_current: false,
        achievements: []
      }
    }
  ]);

  // Sample recommendations for demonstration
  const [sampleRecommendations] = useState<RecommendationItem[]>([
    {
      id: '1',
      section: 'Header',
      field: 'name',
      current: 'John Doe',
      suggested: 'John A. Doe',
      reason: 'Including middle initial adds professionalism'
    },
    {
      id: '2',
      section: 'Experience',
      field: 'achievements',
      current: 'Basic achievement description',
      suggested: 'Increased application performance by 40% through code optimization and implemented automated testing reducing bugs by 60%',
      reason: 'Quantified achievements are more impactful to employers'
    },
    {
      id: '3',
      section: 'Education',
      field: 'new_section',
      current: 'empty',
      suggested: 'Add education section',
      reason: 'Education section is missing and important for a complete CV'
    }
  ]);

  const [currentRecommendationIndex, setCurrentRecommendationIndex] = useState(0);
  const [userInput, setUserInput] = useState('');

  const currentRecommendation = sampleRecommendations[currentRecommendationIndex];

  const handleNext = () => {
    if (currentRecommendationIndex < sampleRecommendations.length - 1) {
      setCurrentRecommendationIndex(currentRecommendationIndex + 1);
      setUserInput('');
    }
  };

  const handlePrevious = () => {
    if (currentRecommendationIndex > 0) {
      setCurrentRecommendationIndex(currentRecommendationIndex - 1);
      setUserInput('');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">CV Preview Demo</h1>
        <p className="text-gray-600">
          Demonstration of the real-time CV preview functionality
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left side - Current Recommendation */}
        <div className="flex-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recommendation {currentRecommendationIndex + 1} of {sampleRecommendations.length}</span>
                <span className="text-sm font-normal text-gray-500">
                  {currentRecommendation.section}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Current:</h4>
                <div className="p-3 bg-gray-50 rounded border">
                  {currentRecommendation.current}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Suggested:</h4>
                <div className="p-3 bg-blue-50 rounded border border-blue-200">
                  {currentRecommendation.suggested}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Reason:</h4>
                <div className="p-2 bg-yellow-50 rounded border border-yellow-200 text-sm">
                  {currentRecommendation.reason}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Your Version (Optional):</h4>
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Edit the suggestion or leave empty to accept as-is"
                  className="w-full p-3 border rounded-md resize-none"
                  rows={3}
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button 
                  variant="outline" 
                  onClick={handlePrevious}
                  disabled={currentRecommendationIndex === 0}
                >
                  Previous
                </Button>
                <Button 
                  onClick={handleNext}
                  disabled={currentRecommendationIndex === sampleRecommendations.length - 1}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right side - CV Preview */}
        <div className="flex-1">
          <div className="lg:sticky lg:top-4">
            {/* This would be the CVPreviewPanel component */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">CV Preview</CardTitle>
                <p className="text-sm text-gray-600">
                  Real-time preview of how your CV will look with this recommendation applied
                </p>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 bg-white min-h-[400px]">
                  <div className="text-center text-gray-500 py-8">
                    <p className="mb-2">🔄 Preview Panel</p>
                    <p className="text-sm">
                      The actual CVPreviewPanel component would render here,
                      showing a Harvard-style formatted preview of the CV section
                      with the current recommendation applied.
                    </p>
                    <div className="mt-4 p-3 bg-blue-50 rounded text-left text-xs">
                      <strong>Current Recommendation:</strong><br/>
                      Section: {currentRecommendation.section}<br/>
                      Field: {currentRecommendation.field}<br/>
                      {userInput && <><strong>User Input:</strong> {userInput}</>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="text-center text-sm text-gray-500">
        <p>
          This demo shows the structure and flow of the CV preview functionality.
          In the actual implementation, the right panel would show a live,
          formatted preview of the CV section being modified.
        </p>
      </div>
    </div>
  );
};

export default CVPreviewDemo;
