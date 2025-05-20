import React from 'react';
import { Upload, FileEdit, FileCheck, FileSearch, FileQuestion } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
  steps?: string[];
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, steps: customSteps }) => {
  // Use either custom steps or default steps
  const defaultSteps = [
    { icon: Upload, label: 'Upload CV' },
    { icon: FileEdit, label: 'Review & Enhance' },
    { icon: FileCheck, label: 'Get Result' }
  ];

  const steps = customSteps 
    ? customSteps.map((label, index) => {
        // Assign appropriate icons based on step name or index
        let icon;
        if (label.includes('Upload')) icon = Upload;
        else if (label.includes('Analysis')) icon = FileSearch;
        else if (label.includes('Recommendations')) icon = FileQuestion;
        else if (label.includes('Review')) icon = FileEdit;
        else if (label.includes('Result')) icon = FileCheck;
        else icon = index === 0 ? Upload : index === customSteps.length - 1 ? FileCheck : FileEdit;
        
        return { icon, label };
      }) 
    : defaultSteps;

  return (
    <div className="w-full max-w-5xl mx-auto mb-12">
      <div className="flex justify-between items-center relative pt-8">
        {/* Progress line */}
        <div className="absolute left-0 top-1/2 w-full h-0.5 bg-gray-200 transform translate-y-[1px]" />
        <div 
          className="absolute left-0 top-1/2 h-0.5 bg-blue-500 transform translate-y-[1px] transition-all duration-500 ease-in-out"
          style={{ 
            width: currentStep === 0 ? '0%' : `${((Math.min(currentStep, steps.length) - 1) / (steps.length - 1)) * 100}%`,
          }}
        />

        {/* Steps */}
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = currentStep > index;
          const isCurrent = currentStep === index + 1;

          return (
            <div 
              key={index} 
              className="relative flex flex-col items-center z-10"
            >
              {/* Step circle with shadow */}
              <div 
                className={`
                  w-14 h-14 rounded-full flex items-center justify-center
                  transition-all duration-500 relative
                  shadow-lg
                  ${isActive ? 'bg-blue-500 text-white shadow-blue-200' : 
                    isCurrent ? 'bg-white text-blue-500 border-2 border-blue-500' : 
                    'bg-white text-gray-400 border border-gray-200'}
                `}
              >
                <StepIcon className="w-7 h-7" />
                {isCurrent && (
                  <div className="absolute -inset-2 border-2 border-blue-500/30 rounded-full animate-pulse" />
                )}
              </div>

              {/* Step label */}
              <span 
                className={`
                  mt-4 text-sm font-medium
                  ${isActive ? 'text-blue-500' : 
                    isCurrent ? 'text-blue-500' : 
                    'text-gray-400'}
                `}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;