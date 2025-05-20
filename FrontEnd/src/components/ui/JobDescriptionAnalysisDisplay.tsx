import React from 'react';
import { JobDescriptionAnalysis } from '../../types';
import { Button } from './button';

interface JobDescriptionAnalysisDisplayProps {
  jobAnalysis: JobDescriptionAnalysis;
  onNext: () => void;
  isLoading: boolean;
}

const JobDescriptionAnalysisDisplay: React.FC<JobDescriptionAnalysisDisplayProps> = ({ jobAnalysis, onNext, isLoading }) => {
  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-4">Job Description Match Analysis</h2>
      {/* Missing Requirements */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Missing or Weak Requirements</h3>
        {jobAnalysis.missing_requirements && jobAnalysis.missing_requirements.length > 0 ? (
          <ul className="list-disc pl-6 space-y-1">
            {jobAnalysis.missing_requirements.map((req, idx) => (
              <li key={idx}>{req}</li>
            ))}
          </ul>
        ) : (
          <p className="text-green-600">No major missing requirements detected!</p>
        )}
      </div>
      {/* Weaknesses */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Weaknesses</h3>
        {jobAnalysis.weaknesses && jobAnalysis.weaknesses.length > 0 ? (
          <ul className="list-disc pl-6 space-y-1">
            {jobAnalysis.weaknesses.map((w, idx) => (
              <li key={idx}><strong>{w.category}:</strong> {w.description}</li>
            ))}
          </ul>
        ) : (
          <p className="text-green-600">No critical weaknesses found!</p>
        )}
      </div>
      {/* Recommended Courses */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Recommended Courses & Resources</h3>
        {jobAnalysis.recommended_courses && jobAnalysis.recommended_courses.length > 0 ? (
          <ul className="space-y-2">
            {jobAnalysis.recommended_courses.map((course, idx) => (
              <li key={idx} className="border rounded-lg p-3 bg-gray-50">
                <div className="font-medium">{course.title}</div>
                <div className="text-sm text-gray-600">Platform: {course.platform}</div>
                <div className="text-sm text-gray-600">Reason: {course.reason}</div>
                <a href={course.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">View Course</a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">No specific courses recommended.</p>
        )}
      </div>
      <div className="flex justify-center pt-4">
        <Button onClick={onNext} disabled={isLoading} size="lg">
          Continue to CV Weakness Analysis
        </Button>
      </div>
    </div>
  );
};

export default JobDescriptionAnalysisDisplay; 