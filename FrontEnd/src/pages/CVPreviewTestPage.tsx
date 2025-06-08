import React, { useState } from 'react';
import { RecommendationItem, EditableSection } from '@/types';
import RecommendationsCarousel from '@/components/ui/RecommendationsCarousel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CVPreviewTestPage: React.FC = () => {
  // Sample CV data that matches the ACTUAL backend structure
  const [testCVData] = useState<EditableSection[]>([
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
      name: 'Work Experience', // This matches the backend name
      type: 'list',
      items: [
        {
          id: 'experience_0', // This matches the backend ID format
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
    },
    {
      id: 'education',
      name: 'Education',
      type: 'list',
      items: [
        {
          id: 'education_0',
          institution: 'University of Technology',
          degree: 'Bachelor of Computer Science',
          location: 'Boston, MA',
          graduation_date: 'May 2019',
          gpa: '3.8'
        }
      ],
      template: {
        institution: '',
        degree: '',
        location: '',
        graduation_date: '',
        gpa: ''
      }
    }
  ]);

  // Test recommendations that match the ACTUAL backend format
  const [testRecommendations] = useState<RecommendationItem[]>([
    {
      id: 'test-header-name',
      section: 'Header',
      field: 'name',
      current: 'John Doe',
      suggested: 'John A. Doe',
      reason: 'Including middle initial adds professionalism'
    },
    {
      id: 'test-experience-achievement',
      section: 'Experience',
      field: 'experience.0.achievements', // Dotted field format like backend
      current: 'Basic achievement description',
      suggested: 'Increased application performance by 40% through code optimization and implemented automated testing reducing bugs by 60%',
      reason: 'Quantified achievements are more impactful to employers'
    },
    {
      id: 'test-education-institution',
      section: 'Education',
      field: 'education.0.institution', // Dotted field format like backend
      current: 'University of Technology',
      suggested: 'Massachusetts Institute of Technology (MIT)',
      reason: 'More prestigious institution name enhances credibility'
    }
  ]);

  const [isTestRunning, setIsTestRunning] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const startTest = () => {
    setIsTestRunning(true);
    setTestResults(null);
    console.log('🧪 Starting CV Preview Test');
    console.log('📊 Initial CV Data:', testCVData);
    console.log('📋 Test Recommendations:', testRecommendations);
  };

  const handleTestComplete = (updatedRecommendations: RecommendationItem[]) => {
    console.log('✅ Test completed with recommendations:', updatedRecommendations);
    setTestResults({
      completed: true,
      recommendations: updatedRecommendations,
      timestamp: new Date().toISOString()
    });
    setIsTestRunning(false);
  };

  const resetTest = () => {
    setIsTestRunning(false);
    setTestResults(null);
  };

  if (isTestRunning) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold mb-2">CV Preview Test - Live Debug</h1>
            <p className="text-gray-600 mb-4">
              Testing the real-time preview functionality. Check browser console for debug logs.
            </p>
            <Button variant="outline" onClick={resetTest}>
              Stop Test
            </Button>
          </div>
          
          <RecommendationsCarousel
            recommendations={testRecommendations}
            currentCVData={testCVData}
            onComplete={handleTestComplete}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">CV Preview Debug Test</h1>
        <p className="text-gray-600 mb-6">
          Test the real-time CV preview functionality with debugging enabled
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Test Setup */}
        <Card>
          <CardHeader>
            <CardTitle>Test Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Test Data:</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div><strong>Header:</strong> John Doe, john.doe@email.com</div>
                <div><strong>Experience:</strong> Tech Corp, Software Developer</div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Test Recommendations:</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div>1. Change name to "John A. Doe"</div>
                <div>2. Add quantified achievement</div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Expected Behavior:</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div>• Preview shows "Before" vs "After"</div>
                <div>• Clicking "Accept & Continue" applies changes</div>
                <div>• Preview updates to show applied changes</div>
                <div>• Status shows "✅ Applied"</div>
              </div>
            </div>

            <Button onClick={startTest} className="w-full">
              Start Debug Test
            </Button>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <strong>1. Open Browser Console</strong>
                <p className="text-gray-600">Press F12 and go to Console tab to see debug logs</p>
              </div>
              
              <div>
                <strong>2. Start the Test</strong>
                <p className="text-gray-600">Click "Start Debug Test" to begin</p>
              </div>
              
              <div>
                <strong>3. Watch for Logs</strong>
                <p className="text-gray-600">Look for these debug messages:</p>
                <ul className="ml-4 mt-1 space-y-1 text-xs">
                  <li>🧪 Starting CV Preview Test</li>
                  <li>🖼️ Generating preview for</li>
                  <li>🚀 handleNext called</li>
                  <li>🔧 Applying recommendation</li>
                  <li>✅ Applied recommendations updated</li>
                </ul>
              </div>
              
              <div>
                <strong>4. Test the Preview</strong>
                <p className="text-gray-600">
                  Try clicking "Accept & Continue" and watch if the preview updates
                </p>
              </div>
            </div>

            {testResults && (
              <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
                <h4 className="font-medium text-green-800 mb-2">Test Completed!</h4>
                <div className="text-sm text-green-700">
                  <div>Completed at: {new Date(testResults.timestamp).toLocaleTimeString()}</div>
                  <div>Recommendations processed: {testResults.recommendations.length}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <strong>If preview doesn't update:</strong>
              <ul className="ml-4 mt-1 space-y-1">
                <li>• Check console for "🔧 Applying recommendation" logs</li>
                <li>• Verify section matching is working (🔍 Section match check)</li>
                <li>• Look for "✅ Field updated" or similar modification logs</li>
                <li>• Check if "📊 After applying recommendation" shows changes</li>
              </ul>
            </div>
            
            <div>
              <strong>Common Issues:</strong>
              <ul className="ml-4 mt-1 space-y-1">
                <li>• Section names don't match between recommendation and CV data</li>
                <li>• Field names don't match the expected structure</li>
                <li>• State updates aren't triggering re-renders</li>
                <li>• Preview component isn't receiving updated data</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CVPreviewTestPage;
