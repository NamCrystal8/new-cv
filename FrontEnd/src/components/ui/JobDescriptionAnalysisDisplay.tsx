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
      </div>      {/* Recommended Courses */}
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

      {/* Experience Analysis */}
      {jobAnalysis.experience_analysis && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Experience Requirements Analysis</h3>
          <div className="space-y-4">
            {/* Experience Summary */}
            <div className="border rounded-lg p-4 bg-blue-50">
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-sm font-medium text-gray-700">Your Experience</div>
                  <div className="text-lg font-semibold text-blue-700">
                    {jobAnalysis.experience_analysis.candidate_total_experience.years} years
                  </div>
                  <div className="text-sm text-gray-600">
                    Level: {jobAnalysis.experience_analysis.candidate_total_experience.level}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">Job Requirement</div>
                  <div className="text-lg font-semibold text-purple-700">
                    {jobAnalysis.experience_analysis.job_requirements.minimum_years}+ years
                  </div>
                  <div className="text-sm text-gray-600">
                    Level: {jobAnalysis.experience_analysis.job_requirements.seniority_level}
                  </div>
                </div>
              </div>
              <div className="text-center">
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                  jobAnalysis.experience_analysis.experience_analysis.meets_minimum 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {jobAnalysis.experience_analysis.experience_analysis.meets_minimum ? '✓ Meets Requirements' : '⚠ Experience Gap'}
                </span>
              </div>
            </div>

            {/* Experience Gaps */}
            {jobAnalysis.experience_analysis.experience_analysis.gaps.length > 0 && (
              <div className="border rounded-lg p-4 bg-red-50">
                <h4 className="font-medium text-red-800 mb-2">Experience Gaps</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {jobAnalysis.experience_analysis.experience_analysis.gaps.map((gap, idx) => (
                    <li key={idx} className="text-sm text-red-700">{gap}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Experience Strengths */}
            {jobAnalysis.experience_analysis.experience_analysis.strengths.length > 0 && (
              <div className="border rounded-lg p-4 bg-green-50">
                <h4 className="font-medium text-green-800 mb-2">Experience Strengths</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {jobAnalysis.experience_analysis.experience_analysis.strengths.map((strength, idx) => (
                    <li key={idx} className="text-sm text-green-700">{strength}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {jobAnalysis.experience_analysis.experience_analysis.recommendations.length > 0 && (
              <div className="border rounded-lg p-4 bg-yellow-50">
                <h4 className="font-medium text-yellow-800 mb-2">Recommendations</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {jobAnalysis.experience_analysis.experience_analysis.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm text-yellow-700">{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-center pt-4">
        <Button onClick={onNext} disabled={isLoading} size="lg">
          Continue to CV Weakness Analysis
        </Button>
      </div>
    </div>
  );
};

export default JobDescriptionAnalysisDisplay; 