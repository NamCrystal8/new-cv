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
    <div className="w-full max-w-5xl mx-auto mb-6 sm:mb-8 lg:mb-12 fade-in">
      {/* Desktop horizontal layout */}
      <div className="hidden md:flex justify-between items-center relative pt-8">
        {/* Progress line */}
        <div className="absolute left-0 top-1/2 w-full h-0.5 bg-gray-200 transform translate-y-[1px] rounded-full" />
        <div
          className="absolute left-0 top-1/2 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform translate-y-[1px] transition-all duration-700 ease-out rounded-full shadow-sm"
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
              className="relative flex flex-col items-center z-10 group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Step circle with shadow */}
              <div
                className={`
                  w-14 h-14 rounded-full flex items-center justify-center
                  transition-all duration-500 ease-out relative
                  cursor-pointer
                  ${isActive ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-200' :
                    isCurrent ? 'bg-white text-blue-500 border-2 border-blue-500 shadow-lg hover:shadow-xl' :
                    'bg-white text-gray-400 border border-gray-200 hover:border-gray-300 hover:shadow-md'}
                `}
              >
                <StepIcon className={`w-7 h-7 transition-all duration-300 ${isCurrent ? 'animate-pulse' : ''} ${isActive ? 'drop-shadow-sm' : ''}`} />
                {isCurrent && (
                  <>
                    <div className="absolute -inset-2 border-2 border-blue-500/30 rounded-full animate-pulse" />
                    <div className="absolute -inset-4 border border-blue-300/20 rounded-full animate-ping" />
                  </>
                )}
                {isActive && (
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 animate-pulse" />
                )}
              </div>

              {/* Step label */}
              <span
                className={`
                  mt-4 text-sm font-medium text-center transition-all duration-300 ease-out
                  ${isActive ? 'text-blue-600 font-semibold' :
                    isCurrent ? 'text-blue-600 font-semibold animate-pulse' :
                    'text-gray-400 group-hover:text-gray-600'}
                `}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mobile vertical layout */}
      <div className="md:hidden space-y-4 px-4 slide-in-left">
        {/* Current step indicator */}
        <div className="text-center mb-6 fade-in">
          <div className="text-sm text-gray-500 mb-2 font-medium">
            Step {currentStep} of {steps.length}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-700 ease-out shadow-sm relative overflow-hidden"
              style={{
                width: `${(currentStep / steps.length) * 100}%`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
            </div>
          </div>
        </div>

        {/* Current step details */}
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = currentStep > index;
          const isCurrent = currentStep === index + 1;

          if (!isCurrent && !isActive) return null;

          return (
            <div
              key={index}
              className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-500 ease-out ${
                isCurrent ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 shadow-lg' : 'bg-gray-50 hover:bg-gray-100 shadow-md'
              } fade-in`}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* Step circle */}
              <div
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center
                  transition-all duration-500 ease-out relative flex-shrink-0
                  ${isActive ? 'bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg shadow-green-200' :
                    isCurrent ? 'bg-white text-blue-500 border-2 border-blue-500 shadow-lg' :
                    'bg-white text-gray-400 border border-gray-200'}
                `}
              >
                <StepIcon className={`w-6 h-6 transition-all duration-300 ${isCurrent ? 'animate-pulse' : ''}`} />
                {isCurrent && (
                  <>
                    <div className="absolute -inset-1 border-2 border-blue-500/30 rounded-full animate-pulse" />
                    <div className="absolute -inset-3 border border-blue-300/20 rounded-full animate-ping" />
                  </>
                )}
                {isActive && (
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400/20 to-emerald-400/20 animate-pulse" />
                )}
              </div>

              {/* Step info */}
              <div className="flex-1 min-w-0">
                <div className={`text-xs uppercase tracking-wide font-semibold transition-all duration-300 ${
                  isActive ? 'text-green-600' : isCurrent ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {isActive ? 'Completed' : 'Current Step'}
                </div>
                <div
                  className={`
                    text-base font-semibold truncate transition-all duration-300
                    ${isActive ? 'text-green-700' :
                      isCurrent ? 'text-blue-700' :
                      'text-gray-600'}
                  `}
                >
                  {step.label}
                </div>
              </div>

              {/* Status indicator */}
              {isActive && (
                <div className="flex-shrink-0 fade-in">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg transition-all duration-300">
                    <svg className="w-5 h-5 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;