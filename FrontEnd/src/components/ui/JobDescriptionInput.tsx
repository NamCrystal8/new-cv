import React, { useState } from 'react';
import { Button } from './button';

interface JobDescriptionInputProps {
  onAnalyze: (jobDescription: string) => void;
  onBack: () => void;
  isLoading?: boolean;
}

const JobDescriptionInput: React.FC<JobDescriptionInputProps> = ({ 
  onAnalyze, 
  onBack, 
  isLoading = false 
}) => {
  const [jobDescription, setJobDescription] = useState<string>('');

  const handleSubmit = () => {
    if (jobDescription.trim().length === 0) {
      alert('Please enter a job description');
      return;
    }
    onAnalyze(jobDescription.trim());
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-800">Job Description Analysis</h2>
        <p className="text-lg text-gray-600">
          Paste the job description below to get personalized recommendations
        </p>
      </div>
      
      <div className="space-y-4">
        <label htmlFor="job-description" className="block text-sm font-medium text-gray-700">
          Job Description *
        </label>
        <textarea
          id="job-description"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the complete job description here..."
          className="w-full min-h-[300px] p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          disabled={isLoading}
        />
        <p className="text-sm text-gray-500">
          Include the full job posting including requirements, responsibilities, and qualifications for the best analysis.
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button 
          onClick={handleSubmit}
          disabled={isLoading || jobDescription.trim().length === 0}
          size="lg"
          className="w-full sm:w-auto"
        >
          {isLoading ? (
            <>
              <svg 
                className="animate-spin -ml-1 mr-2 h-4 w-4" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Analyzing...
            </>
          ) : (
            'Analyze Against Job Description'
          )}
        </Button>
        <Button 
          onClick={onBack}
          variant="outline"
          size="lg"
          className="w-full sm:w-auto"
          disabled={isLoading}
        >
          Back
        </Button>
      </div>
    </div>
  );
};

export default JobDescriptionInput;
