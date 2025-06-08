import React, { useState } from 'react';
import { RecommendationItem, EditableSection } from '@/types';
import RecommendationsCarousel from './RecommendationsCarousel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Test component to verify the CV preview functionality works correctly
const CVPreviewTest: React.FC = () => {
  // Sample CV data for testing
  const [initialCVData] = useState<EditableSection[]>([
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
            'Developed web applications using React and Node.js'
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

  // Sample recommendations for testing
  const [testRecommendations] = useState<RecommendationItem[]>([
    {
      id: 'rec1',
      section: 'Header',
      field: 'name',
      current: 'John Doe',
      suggested: 'John A. Doe',
      reason: 'Including middle initial adds professionalism'
    },
    {
      id: 'rec2',
      section: 'Experience',
      field: 'achievements',
      current: 'Basic achievement description',
      suggested: 'Increased application performance by 40% through code optimization',
      reason: 'Quantified achievements are more impactful to employers'
    }
  ]);

  const [isTestMode, setIsTestMode] = useState(false);
  const [completedRecommendations, setCompletedRecommendations] = useState<RecommendationItem[]>([]);

  const handleComplete = (updatedRecommendations: RecommendationItem[]) => {
    setCompletedRecommendations(updatedRecommendations);
    setIsTestMode(false);
    console.log('Recommendations completed:', updatedRecommendations);
  };

  const startTest = () => {
    setIsTestMode(true);
    setCompletedRecommendations([]);
  };

  if (isTestMode) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold mb-2">CV Preview Test</h1>
            <p className="text-gray-600">
              Test the real-time preview functionality - apply recommendations and see the changes
            </p>
            <Button 
              variant="outline" 
              onClick={() => setIsTestMode(false)}
              className="mt-4"
            >
              Exit Test Mode
            </Button>
          </div>
          
          <RecommendationsCarousel
            recommendations={testRecommendations}
            currentCVData={initialCVData}
            onComplete={handleComplete}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">CV Preview Test Suite</h1>
        <p className="text-gray-600 mb-6">
          Test the real-time CV preview functionality with sample data
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Sample Data:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Header: John Doe, john.doe@email.com</li>
                <li>• Experience: Tech Corp, Software Developer</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Test Recommendations:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Update name to "John A. Doe"</li>
                <li>• Add quantified achievement</li>
              </ul>
            </div>

            <Button onClick={startTest} className="w-full">
              Start Preview Test
            </Button>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            {completedRecommendations.length > 0 ? (
              <div className="space-y-3">
                <div className="text-green-600 font-medium">
                  ✅ Test Completed Successfully!
                </div>
                <div>
                  <h4 className="font-medium mb-2">Applied Recommendations:</h4>
                  <ul className="text-sm space-y-1">
                    {completedRecommendations.map((rec, index) => (
                      <li key={rec.id} className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>
                          {rec.section}: {rec.suggested}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-center py-8">
                <p>Run the test to see results</p>
                <p className="text-sm mt-2">
                  The preview should update in real-time as you apply recommendations
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expected Behavior</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <strong>1. Initial State:</strong> Preview shows current CV data
            </div>
            <div>
              <strong>2. Before Applying:</strong> Toggle shows "Before" vs "After" with proposed changes
            </div>
            <div>
              <strong>3. After Applying:</strong> 
              <ul className="ml-4 mt-1 space-y-1">
                <li>• Preview updates to show the applied changes</li>
                <li>• Status badge shows "✅ Applied"</li>
                <li>• Toggle shows "Original" vs "Current"</li>
                <li>• Changes summary shows green checkmarks</li>
              </ul>
            </div>
            <div>
              <strong>4. Navigation:</strong> Changes persist as you move between recommendations
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CVPreviewTest;
