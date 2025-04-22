import React, { useState } from 'react';
import { useCallback } from 'react';
import './App.css';
import StepIndicator from './components/ui/StepIndicator';
import ErrorMessage from './components/ui/ErrorMessage';
import UploadPage from './pages/UploadPage';
import ReviewPage from './pages/ReviewPage';
import ResultPage from './pages/ResultPage';
import { FlowResponse, EditableSection } from './types';

const App: React.FC = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [flowResponse, setFlowResponse] = useState<FlowResponse | null>(null);
  const [editableSections, setEditableSections] = useState<EditableSection[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
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
      
      const data = await response.json() as FlowResponse;
      setFlowResponse(data);
      
      // Store editable sections for modification
      if (data.editable_sections) {
        setEditableSections(data.editable_sections);
      }
      
      // Move to step 2
      setCurrentStep(2);
    } catch (error) {
      console.error('Error analyzing PDF:', error);
      setErrorMessage('Failed to analyze your CV. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to update editable sections when modified in the review page
  const updateEditableSections = (sections: EditableSection[]) => {
    setEditableSections(sections);
  };
  
  // Function to complete the CV flow with enhanced data
  const completeCvFlow = async (updatedSections?: EditableSection[]) => {
    if (!flowResponse) return;
    
    setIsLoading(true);
    
    try {
      // If we received updated sections from ReviewPage, use those instead
      if (updatedSections) {
        setEditableSections(updatedSections);
      }
      
      // Convert editable sections to the format expected by the backend
      const formattedSections = formatSectionsForBackend(updatedSections || editableSections);
      
      const response = await fetch('http://localhost:8000/complete-cv-flow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flow_id: flowResponse.flow_id,
          additional_inputs: formattedSections
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
  
  // Format editable sections for the backend API
  const formatSectionsForBackend = (sections: EditableSection[]) => {
    const formattedData: Record<string, string> = {};
    
    // Convert complex nested objects to flattened string representations
    sections.forEach(section => {
      switch (section.type) {
        case 'object':
          // Contact info section
          if (section.id === 'header') {
            section.fields.forEach(field => {
              // Store each field with a qualified key: header.name, header.email, etc.
              formattedData[`header.${field.id}`] = field.value;
            });
          }
          break;
          
        case 'list':
          // Education, Experience, Projects sections
          if (section.id === 'education') {
            // Convert education list to JSON string
            formattedData[section.id] = JSON.stringify(section.items);
          }
          else if (section.id === 'experience') {
            // Convert experience list to JSON string
            formattedData[section.id] = JSON.stringify(section.items);
          }
          else if (section.id === 'projects') {
            // Convert projects list to JSON string
            formattedData[section.id] = JSON.stringify(section.items);
          }
          break;
          
        case 'nested_list':
          // Skills section
          if (section.id === 'skills') {
            formattedData[section.id] = JSON.stringify(section.categories);
          }
          break;
          
        case 'textarea':
          // Raw input (fallback)
          formattedData['raw_text'] = section.value;
          break;
      }
    });
    
    // Debug log to see what we're sending
    console.log('Sending to backend:', formattedData);
    
    return formattedData;
  };
  
  // Reset the flow
  const resetFlow = () => {
    setPdfFile(null);
    setPdfUrl(null);
    setFlowResponse(null);
    setEditableSections([]);
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
