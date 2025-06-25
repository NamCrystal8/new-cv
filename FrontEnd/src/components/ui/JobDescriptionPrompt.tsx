import React from 'react';
import { Button } from './button';

interface JobDescriptionPromptProps {
  onYes: () => void;
  onNo: () => void;
}

const JobDescriptionPrompt: React.FC<JobDescriptionPromptProps> = ({ onYes, onNo }) => {
  return (
    <div className="space-y-8 max-w-2xl mx-auto text-center">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-800">Job Description Analysis</h2>
        <p className="text-lg text-gray-600">
          Do you have a specific job description you'd like to compare your CV against?
        </p>
        <p className="text-sm text-gray-500">
          We can analyze your CV against a job posting to identify missing skills and recommend specific courses to help you become a better candidate.
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button 
          onClick={onYes}
          size="lg"
          className="w-full sm:w-auto"
        >
          Yes, I have a job description
        </Button>
        <Button 
          onClick={onNo}
          variant="outline"
          size="lg"
          className="w-full sm:w-auto"
        >
          No, skip this step
        </Button>
      </div>
    </div>
  );
};

export default JobDescriptionPrompt;
