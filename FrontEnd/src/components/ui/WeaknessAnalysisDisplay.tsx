import React from 'react';
import { WeaknessAnalysis } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface WeaknessAnalysisDisplayProps {
  weaknesses: WeaknessAnalysis[];
  onNext: () => void;
}

// Safely render any value that might be an object
const safeRender = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '[Object]';
    }
  }
  return String(value);
};

const WeaknessAnalysisDisplay: React.FC<WeaknessAnalysisDisplayProps> = ({ 
  weaknesses,
  onNext 
}) => {
  // Debug: Log the weaknesses to see their structure
  console.log('Weaknesses:', weaknesses);
  console.log('Weaknesses type:', Array.isArray(weaknesses) ? 'Array' : typeof weaknesses);
  
  if (!Array.isArray(weaknesses)) {
    console.error('Expected weaknesses to be an array, but got:', weaknesses);
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">CV Weakness Analysis</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-red-500">
            Error loading weakness analysis. Please try again.
          </p>
        </div>
        <Button onClick={onNext} size="lg" className="px-8">
          Continue Anyway
        </Button>
      </div>
    );
  }

  // Function to get severity color
  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'low':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'medium':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Function to get severity icon
  const getSeverityIcon = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'low':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'medium':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'high':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">CV Weakness Analysis</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          We've analyzed your CV and identified areas for improvement. Review these insights to enhance your CV's impact.
        </p>
      </div>

      {weaknesses.length === 0 ? (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Great Job!
            </CardTitle>
            <CardDescription className="text-green-700">
              Your CV looks fantastic! We didn't find any significant weaknesses.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {weaknesses.map((weakness, index) => (
            <Card key={index} className={`border ${getSeverityColor(weakness.severity)}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  {getSeverityIcon(weakness.severity)}
                  {safeRender(weakness.category)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>{safeRender(weakness.description)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-center mt-8">
        <Button 
          onClick={onNext} 
          size="lg"
          className="px-8"
        >
          Next: View Recommendations
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </Button>
      </div>
    </div>
  );
};

export default WeaknessAnalysisDisplay; 