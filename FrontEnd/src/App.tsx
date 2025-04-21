import React, { useState } from 'react';
import { useCallback } from 'react';
import './App.css';
import StepIndicator from './components/ui/StepIndicator';
import ErrorMessage from './components/ui/ErrorMessage';
import UploadPage from './pages/UploadPage';
import ReviewPage from './pages/ReviewPage';
import ResultPage from './pages/ResultPage';
import { FlowResponse } from './types';

// Simple test component to verify Tailwind CSS is working
const TailwindTest = () => {
  return (
    <div className="p-4 m-4 bg-blue-500 text-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold">Tailwind CSS Test Component</h2>
      <p className="mt-2">If you can see this with blue background and white text, Tailwind CSS is working!</p>
    </div>
  );
};

const App: React.FC = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [flowResponse, setFlowResponse] = useState<FlowResponse | null>(null);
  const [additionalInput, setAdditionalInput] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedInputs, setSelectedInputs] = useState<{[key: string]: boolean}>({});
  
  // Function to upload PDF and start CV analysis
  const analyzePdf = async () => {
    if (!pdfFile) {
      setErrorMessage('Please upload a PDF file first');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', pdfFile);
      
      const response = await fetch('http://localhost:8000/analyze-cv-weaknesses', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }
      
      const data = await response.json();
      setFlowResponse(data);
      
      // Initialize selected inputs - all are selected by default
      const initialSelectedInputs: {[key: string]: boolean} = {};
      data.analysis.required_inputs.forEach((input: string) => {
        initialSelectedInputs[input] = true;
      });
      setSelectedInputs(initialSelectedInputs);
      
      // Move to step 2
      setCurrentStep(2);
    } catch (error) {
      console.error('Error analyzing PDF:', error);
      setErrorMessage('Failed to analyze your CV. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Step 2: Handle additional input based on analysis
  const handleAdditionalInputChange = (input: string, value: string) => {
    setAdditionalInput(prev => ({
      ...prev,
      [input]: value
    }));
  };
  
  const toggleInputSelection = (input: string) => {
    setSelectedInputs(prev => ({
      ...prev,
      [input]: !prev[input]
    }));
  };
  
  // Function to complete the CV flow with additional inputs
  const completeCvFlow = async () => {
    if (!flowResponse) return;
    
    setIsLoading(true);
    
    try {
      // Format the selectedInputs and additionalInput for the backend
      const selectedAdditionalInputs: {[key: string]: string} = {};
      Object.keys(selectedInputs).forEach(key => {
        if (selectedInputs[key]) {
          selectedAdditionalInputs[key] = additionalInput[key] || '';
        }
      });
      
      const response = await fetch('http://localhost:8000/complete-cv-flow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flow_id: flowResponse.flow_id,
          additional_inputs: selectedAdditionalInputs
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }
      
      const data = await response.json();
      setPdfUrl(data.pdf_url);
      
      // Move to step 3
      setCurrentStep(3);
    } catch (error) {
      console.error('Error completing CV flow:', error);
      setErrorMessage('Failed to generate the enhanced CV. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reset the flow
  const resetFlow = () => {
    setPdfFile(null);
    setPdfUrl(null);
    setFlowResponse(null);
    setAdditionalInput({});
    setSelectedInputs({});
    setErrorMessage(null);
    setCurrentStep(1);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-base-200 to-base-300 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary">Smart CV Builder</h1>
          <p className="text-lg mt-2 opacity-75">Transform your basic CV into a professional masterpiece</p>
        </div>
        
        <StepIndicator currentStep={currentStep} />
        
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <ErrorMessage message={errorMessage} onDismiss={() => setErrorMessage(null)} />
            
            {/* Step 1: CV Upload */}
            {currentStep === 1 && (
              <UploadPage 
                isLoading={isLoading}
                pdfFile={pdfFile}
                setPdfFile={setPdfFile}
                setErrorMessage={setErrorMessage}
                analyzePdf={analyzePdf}
              />
            )}
            
            {/* Step 2: Analysis and Additional Input */}
            {currentStep === 2 && flowResponse && (
              <ReviewPage 
                isLoading={isLoading}
                flowResponse={flowResponse}
                additionalInput={additionalInput}
                selectedInputs={selectedInputs}
                handleAdditionalInputChange={handleAdditionalInputChange}
                toggleInputSelection={toggleInputSelection}
                completeCvFlow={completeCvFlow}
                resetFlow={resetFlow}
              />
            )}
            
            {/* Step 3: CV Result */}
            {currentStep === 3 && (
              <ResultPage 
                pdfUrl={pdfUrl}
                resetFlow={resetFlow}
              />
            )}
          </div>
        </div>
        
        <div className="text-center mt-8 text-sm opacity-60">
          <p>© {new Date().getFullYear()} Smart CV Builder | AI-powered CV enhancement tool</p>
        </div>
      </div>
    </div>
  );
};

export default App;
