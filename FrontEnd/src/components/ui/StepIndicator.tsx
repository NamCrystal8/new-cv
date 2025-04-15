import React from 'react';

interface StepIndicatorProps {
  currentStep: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  return (
    <ul className="steps w-full mb-8">
      <li className={`step ${currentStep >= 1 ? 'step-primary' : ''}`}>Upload CV</li>
      <li className={`step ${currentStep >= 2 ? 'step-primary' : ''}`}>Review & Enhance</li>
      <li className={`step ${currentStep >= 3 ? 'step-primary' : ''}`}>Get Result</li>
    </ul>
  );
};

export default StepIndicator;