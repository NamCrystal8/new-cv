import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import StepIndicator from './components/ui/StepIndicator';
import ErrorMessage from './components/ui/ErrorMessage';
import UploadPage from './pages/UploadPage';
import ReviewPage from './pages/ReviewPage';
import ResultPage from './pages/ResultPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserCVsPage from './pages/UserCVsPage';
import EditCVPage from './pages/EditCVPage';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { FlowResponse, EditableSection, RecommendationItem, JobDescriptionFlowResponse, JobDescriptionAnalysis } from './types';
import WeaknessAnalysisDisplay from './components/ui/WeaknessAnalysisDisplay';
import RecommendationsCarousel from './components/ui/RecommendationsCarousel';
import JobDescriptionPrompt from './components/ui/JobDescriptionPrompt';
import JobDescriptionInput from './components/ui/JobDescriptionInput';
import InteractiveCVOptimizer from './components/ui/InteractiveCVOptimizer';

// Auth context setup
export const AuthContext = createContext({
  isAuthenticated: null as boolean | null,
  setIsAuthenticated: (_: boolean | null) => {},
});

export const useAuth = () => useContext(AuthContext);

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/users/me');
        setIsAuthenticated(response.ok);
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

// Wrapper for protected routes
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (isAuthenticated === null) {
    return <div>Loading...</div>; // Or a spinner
  }

  return isAuthenticated ? (
    <>{children}</>
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
};

const App: React.FC = () => {
  const { isAuthenticated, setIsAuthenticated } = useAuth();
  const navigate = useNavigate(); // Use navigate from hook
  const location = useLocation();
  
  // Check if current path is login or register
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/jwt/logout', { method: 'POST' }); // Use Vite proxy
      setIsAuthenticated(false);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Handle logout error if needed
    }
  };

  return (
    <SidebarProvider>
      {/* Modern background gradient */}
      <div className="relative min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-blue-100 text-foreground overflow-x-hidden">
        {/* Decorative blurred background shapes */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full opacity-30 blur-3xl -z-10" style={{ filter: 'blur(100px)' }} />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-200 rounded-full opacity-20 blur-3xl -z-10" style={{ filter: 'blur(120px)' }} />
        <AppSidebar />
        <main className="flex-1 min-h-screen flex flex-col items-center justify-start px-2 sm:px-0">
          {/* Hero section */}
          <section className="w-full max-w-3xl mx-auto text-center pt-12 pb-4">
            <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-500 bg-clip-text text-transparent mb-4 drop-shadow-lg">
              Smart CV Builder
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
              Instantly enhance your CV with AI-powered suggestions and beautiful formatting. Upload, review, and download your improved CV in minutes.
            </p>
          </section>
          {/* Main card with step indicator and content */}
          <div className="w-full max-w-7xl mx-auto flex flex-col items-center px-4 sm:px-6 lg:px-8">
            <div className="w-full bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 sm:p-12 mb-10 border border-blue-100 min-h-[calc(100vh-16rem)]">
              <div className="flex-grow">
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route
                    path="/my-cvs"
                    element={
                      <ProtectedRoute>
                        <UserCVsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/edit-cv/:cvId"
                    element={
                      <ProtectedRoute>
                        <EditCVPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/*"
                    element={
                      <ProtectedRoute>
                        <MainAppContent />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </div>
            </div>
          </div>
          <footer className="mt-auto pt-8 pb-4 text-center text-sm text-muted-foreground w-full">
            <p className="flex items-center justify-center gap-1">
              © {new Date().getFullYear()} Smart CV Builder
              <span className="inline-block mx-2">•</span>
              AI-powered CV enhancement tool
            </p>
          </footer>
        </main>
      </div>
    </SidebarProvider>
  );
};

// Extracted main content logic into its own component
const MainAppContent: React.FC = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [flowResponse, setFlowResponse] = useState<FlowResponse | null>(null);
  const [jobAnalysis, setJobAnalysis] = useState<JobDescriptionAnalysis | null>(null);
  const [editableSections, setEditableSections] = useState<EditableSection[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [flowId, setFlowId] = useState<string | null>(null);
  const navigate = useNavigate(); // For handling unauthorized errors

  // Function to handle API errors, especially 401 Unauthorized
  const handleApiError = (error: any, defaultMessage: string) => {
    console.error('API Error:', error);
    if (error.response && error.response.status === 401) {
      setErrorMessage('Your session has expired. Please login again.');
      // Optionally force logout or redirect
      // setIsAuthenticated(false); // If passed down
      navigate('/login');
    } else {
      setErrorMessage(defaultMessage);
    }
  };
  // Function to upload PDF and start CV analysis (no job description)
  const analyzePdf = async () => {
    if (!pdfFile) {
      setErrorMessage('Please upload a PDF file first');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', pdfFile);

      const response = await fetch('/api/analyze-cv-weaknesses', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: `Server responded with status ${response.status}` }));
        throw { response, ...errorData };
      }

      const data = await response.json() as FlowResponse;
      setFlowResponse(data);
      setFlowId(data.flow_id);
      if (data.editable_sections) {
        setEditableSections(data.editable_sections);
      }
      setCurrentStep(2); // Move to weakness analysis
      setJobAnalysis(null);
    } catch (error: any) {
      handleApiError(error, 'Failed to analyze your CV. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to proceed from weakness analysis to recommendations
  const proceedToRecommendations = () => {
    setCurrentStep(3);
  };

  // Function to handle completion of the recommendations step
  const handleRecommendationsComplete = (updatedRecommendations: RecommendationItem[]) => {
    // Apply the recommendations to the editable sections
    if (flowResponse && updatedRecommendations.length > 0) {
      const newEditableSections = [...editableSections];
      
      updatedRecommendations.forEach(recommendation => {
        // Find the section that needs to be updated
        const sectionIndex = newEditableSections.findIndex(section => 
          section.id === recommendation.section.toLowerCase() || 
          section.name === recommendation.section
        );
        
        if (sectionIndex !== -1) {
          const section = newEditableSections[sectionIndex];
          
          // Update based on section type
          switch (section.type) {
            case 'object':
              if (section.id === 'header') {
                // Update header fields
                const fieldIndex = (section as any).fields.findIndex(
                  (field: any) => field.id === recommendation.field.toLowerCase() || field.name === recommendation.field
                );
                if (fieldIndex !== -1) {
                  (section as any).fields[fieldIndex].value = recommendation.suggested;
                }
              }
              break;
            case 'list':
              // Handle education, experience, projects
              if (['education', 'experience', 'projects', 'languages'].includes(section.id)) {
                // Check if the recommendation is for a specific item or general
                const [fieldType, itemIndex, subField] = recommendation.field.split('.');
                if (itemIndex && subField && (section as any).items[parseInt(itemIndex)]) {
                  // It's for a specific item field like "experience.0.company"
                  (section as any).items[parseInt(itemIndex)][subField] = recommendation.suggested;
                } else if (recommendation.field === 'new_item') {
                  // Add a new item if recommended
                  const newItem = JSON.parse(recommendation.suggested);
                  (section as any).items.push({
                    id: `${section.id}_${(section as any).items.length}`,
                    ...newItem
                  });
                }
              }
              break;
            case 'nested_list':
              if (section.id === 'skills') {
                // Handle skills section
                const [categoryIndex, skillIndex] = recommendation.field.split('.');
                if (categoryIndex && skillIndex) {
                  // It's for a specific skill
                  if ((section as any).categories[parseInt(categoryIndex)]) {
                    const skillsArray = (section as any).categories[parseInt(categoryIndex)].items;
                    if (skillsArray[parseInt(skillIndex)]) {
                      skillsArray[parseInt(skillIndex)] = recommendation.suggested;
                    }
                  }
                } else if (recommendation.field === 'new_category') {
                  // Add a new skill category
                  const newCategory = JSON.parse(recommendation.suggested);
                  (section as any).categories.push({
                    id: `skill_category_${(section as any).categories.length}`,
                    ...newCategory
                  });
                }
              }
              break;
            case 'textarea':
              // Handle raw text input
              (section as any).value = recommendation.suggested;
              break;
          }
        }
      });
      
      setEditableSections(newEditableSections);
    }
    
    // Move to the edit page
    setCurrentStep(4);
  };  // Function to complete the CV flow with enhanced data
  const completeCvFlow = async (updatedSections?: EditableSection[]) => {
    if (!flowResponse) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (updatedSections) {
        setEditableSections(updatedSections);
      }

      // Format sections for the backend
      const formattedSections = formatSectionsForBackend(updatedSections || editableSections);
      
      // Also include the applied recommendations from the recommendations carousel
      // This helps ensure the LaTeX output reflects the user's chosen improvements
      if (flowResponse.detailed_analysis?.recommendations) {
        formattedSections["applied_recommendations"] = JSON.stringify(
          flowResponse.detailed_analysis.recommendations
        );
      }

      const response = await fetch('/api/complete-cv-flow', {
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
        const errorData = await response.json().catch(() => ({ detail: `Server responded with status ${response.status}` }));
        throw { response, ...errorData };
      }

      const result = await response.json();
      if (result.pdf_url) {
        setPdfUrl(result.pdf_url);
        setCurrentStep(8); // Final result step
      } else {
        throw new Error('No PDF URL received from server');
      }
    } catch (error: any) {
      handleApiError(error, 'Failed to generate the final CV. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to analyze stored CV against job description
  const analyzeJobDescription = async (jobDescription: string) => {
    if (!flowId) {
      setErrorMessage('No CV data found. Please upload your CV again.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/analyze-stored-cv-with-job-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flow_id: flowId,
          job_description: jobDescription
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: `Server responded with status ${response.status}` }));
        throw { response, ...errorData };
      }

      const data = await response.json() as JobDescriptionFlowResponse;
      setJobAnalysis(data.job_analysis);
      setCurrentStep(6); // Move to job analysis step
    } catch (error: any) {
      handleApiError(error, 'Failed to analyze against job description. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Format editable sections for the backend API (Keep existing logic)
  const formatSectionsForBackend = (sections: EditableSection[]) => {
    const formattedData: Record<string, string> = {};
    sections.forEach(section => {
      switch (section.type) {
        case 'object':
          if (section.id === 'header') {
            section.fields.forEach(field => {
              formattedData[`header.${field.id}`] = field.value;
            });
          }
          break;
        case 'list':
          if (['education', 'experience', 'projects', 'languages'].includes(section.id)) {
            formattedData[section.id] = JSON.stringify(section.items);
          }
          break;
        case 'nested_list':
          if (section.id === 'skills') {
            formattedData[section.id] = JSON.stringify(section.categories);
          }
          break;
        case 'textarea':
          formattedData['raw_text'] = section.value;
          break;
      }
    });
    console.log('Sending to backend:', formattedData);
    return formattedData;
  };
  // Reset the flow
  const resetFlow = () => {
    setPdfFile(null);
    setPdfUrl(null);
    setFlowResponse(null);
    setJobAnalysis(null);
    setEditableSections([]);
    setErrorMessage(null);
    setFlowId(null);
    setCurrentStep(1);
  };
  // Handler for job description prompt step
  const handleJobDescriptionPrompt = (hasJobDescription: boolean) => {
    if (hasJobDescription) {
      setCurrentStep(5); // Go to job description input
    } else {
      setCurrentStep(7); // Skip to review (step 7 since we skip JD steps)
    }
  };

  // Handler for job description input step
  const handleJobDescriptionInput = async (jobDescription: string) => {
    await analyzeJobDescription(jobDescription);
    // analyzeJobDescription will set current step to 6 when complete
  };
  // Handler to go back from job description input
  const handleBackToPrompt = () => {
    setCurrentStep(4);
  };

  // Handler for CV optimization completion
  const handleOptimizationComplete = (optimizedSections: EditableSection[], appliedChanges: any[]) => {
    setEditableSections(optimizedSections);
    // Store the applied changes in flowResponse for later use
    if (flowResponse) {
      setFlowResponse({
        ...flowResponse,
        applied_optimizations: appliedChanges
      } as any);
    }
    setCurrentStep(7); // Go to review
  };

  // Render content based on current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: // Upload CV
        return (
          <UploadPage 
            pdfFile={pdfFile}
            setPdfFile={setPdfFile}
            analyzePdf={analyzePdf}
            isLoading={isLoading}
            errorMessage={errorMessage}
            setErrorMessage={setErrorMessage}
          />
        );
      case 2: // CV Weakness Analysis
        return flowResponse ? (
          <WeaknessAnalysisDisplay 
            weaknesses={Array.isArray(flowResponse.detailed_analysis.weaknesses) 
              ? flowResponse.detailed_analysis.weaknesses 
              : (flowResponse.detailed_analysis.weaknesses 
                  ? [{ 
                      category: 'General', 
                      description: 'Unable to properly format weakness analysis.', 
                      severity: 'medium' 
                    }] 
                  : [])}
            onNext={proceedToRecommendations}
          />
        ) : null;
      case 3: // Recommendations
        return flowResponse ? (
          <RecommendationsCarousel 
            recommendations={flowResponse.detailed_analysis.recommendations}
            onComplete={handleRecommendationsComplete}
          />
        ) : null;
      case 4: // Job Description Prompt
        return (
          <JobDescriptionPrompt 
            onYes={() => handleJobDescriptionPrompt(true)}
            onNo={() => handleJobDescriptionPrompt(false)}
          />
        );
      case 5: // Job Description Input
        return (
          <JobDescriptionInput 
            onAnalyze={handleJobDescriptionInput}
            onBack={handleBackToPrompt}
            isLoading={isLoading}
          />
        );      case 6: // Job vs CV Analysis (or CV Optimization if no JD)
        if (jobAnalysis) {
          return (
            <InteractiveCVOptimizer
              jobAnalysis={jobAnalysis}
              currentCVData={editableSections}
              onOptimize={handleOptimizationComplete}
              isLoading={isLoading}
            />
          );
        } else {
          // No job analysis, go directly to review
          setCurrentStep(7);
          return null;
        }
      case 7: // Review & Edit
        return flowResponse ? (
          <ReviewPage 
            isLoading={isLoading}
            flowResponse={flowResponse}
            completeCvFlow={completeCvFlow}
            resetFlow={resetFlow}
          />
        ) : null;
      case 8: // Result
        return pdfUrl ? (
          <ResultPage 
            pdfUrl={pdfUrl} 
            resetFlow={resetFlow} 
          />
        ) : null;
      default:
        return null;
    }
  };
  const stepsLabels = [
    "Upload CV",
    "CV Analysis", 
    "Recommendations",
    "Job Description?",
    "Job Description Input",
    "CV Optimization",
    "Review & Edit",
    "Result"
  ];

  return (
    <div className="space-y-6">
      <StepIndicator 
        steps={stepsLabels} 
        currentStep={currentStep} 
      />
      
      {errorMessage && <ErrorMessage message={errorMessage} onDismiss={() => setErrorMessage(null)} />}
      
      {renderCurrentStep()}
    </div>
  );
};

export default function AppWithProviders() {
  return (
    <AuthProvider>
      <SidebarProvider>
        <App />
      </SidebarProvider>
    </AuthProvider>
  );
}
