import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { getCurrentUserWithToken, hasAuthToken } from './utils/tokenAuth';
import { authenticatedFetch, authenticatedFormDataFetch } from './utils/auth';
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
import SubscriptionPage from './pages/SubscriptionPage';
import AdminPage from './pages/AdminPage';
import CVPreviewTestPage from './pages/CVPreviewTestPage';
import CVPreviewDebugPage from './pages/CVPreviewDebugPage';
import APITestingPage from './pages/APITestingPage';
import AuthDebug from './components/debug/AuthDebug';
import ApiUrlDebug from './components/debug/ApiUrlDebug';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { Toaster } from '@/components/ui/toaster';
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
        // Always use token-based authentication with localStorage
        // Check if token exists first
        if (!hasAuthToken()) {
          setIsAuthenticated(false);
          return;
        }

        try {
          const userData = await getCurrentUserWithToken();
          // Check if user is active
          if (userData.is_active) {
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
        } catch {
          setIsAuthenticated(false);
        }
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
  return (
    <>
      {/* Modern background gradient */}
      <div className="relative min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-blue-100 text-foreground overflow-x-hidden">
        {/* Decorative blurred background shapes - responsive sizing */}
        <div className="absolute top-0 left-0 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-blue-200 rounded-full opacity-30 blur-3xl -z-10" style={{ filter: 'blur(100px)' }} />
        <div className="absolute bottom-0 right-0 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-purple-200 rounded-full opacity-20 blur-3xl -z-10" style={{ filter: 'blur(120px)' }} />

        {/* Sidebar and main content with proper responsive layout */}
        <AppSidebar />
        <SidebarInset className="flex-1 min-h-screen flex flex-col items-center justify-start px-2 sm:px-4 lg:px-0">
          {/* Mobile sidebar trigger - visible only on mobile */}
          <div className="md:hidden fixed top-4 left-4 z-50 fade-in">
            <SidebarTrigger className="bg-white/90 backdrop-blur-sm shadow-lg border border-gray-200 hover:bg-white hover:shadow-xl transition-all duration-300 ease-out" />
          </div>

          {/* Hero section - responsive text and spacing */}
          <section className="w-full max-w-3xl mx-auto text-center pt-6 sm:pt-8 lg:pt-12 pb-2 sm:pb-3 lg:pb-4 px-4 fade-in">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-500 bg-clip-text text-transparent mb-2 sm:mb-3 lg:mb-4 drop-shadow-lg animate-pulse">
              Smart CV Builder
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-4 sm:mb-5 lg:mb-6 leading-relaxed slide-in-left">
              Instantly enhance your CV with AI-powered suggestions and beautiful formatting. Upload, review, and download your improved CV in minutes.
            </p>
          </section>
          {/* Main card with step indicator and content - responsive padding and sizing */}
          <div className="w-full max-w-7xl mx-auto flex flex-col items-center px-2 sm:px-4 md:px-6 lg:px-8 fade-in">
            <div className="w-full bg-white/80 backdrop-blur-lg rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg sm:shadow-xl lg:shadow-2xl p-4 sm:p-6 md:p-8 lg:p-12 mb-6 sm:mb-8 lg:mb-10 border border-blue-100 min-h-[calc(100vh-12rem)] sm:min-h-[calc(100vh-14rem)] lg:min-h-[calc(100vh-16rem)] hover:shadow-3xl transition-all duration-500 ease-out">
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
                    path="/subscription"
                    element={
                      <ProtectedRoute>
                        <SubscriptionPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/*"
                    element={
                      <ProtectedRoute>
                        <AdminPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/cv-preview-test"
                    element={
                      <ProtectedRoute>
                        <CVPreviewTestPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/cv-preview-debug"
                    element={
                      <ProtectedRoute>
                        <CVPreviewDebugPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/testing-apis"
                    element={
                      <ProtectedRoute>
                        <APITestingPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/auth-debug"
                    element={
                      <AuthDebug />
                    }
                  />
                  <Route
                    path="/api-debug"
                    element={
                      <ApiUrlDebug />
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
          <footer className="mt-auto pt-4 sm:pt-6 lg:pt-8 pb-2 sm:pb-3 lg:pb-4 text-center text-xs sm:text-sm text-muted-foreground w-full px-4 fade-in">
            <p className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 hover:text-gray-600 transition-colors duration-300">
              <span>© {new Date().getFullYear()} Smart CV Builder</span>
              <span className="hidden sm:inline-block mx-2">•</span>
              <span>AI-powered CV enhancement tool</span>
            </p>
          </footer>
        </SidebarInset>
      </div>
    </>
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
  };  // Function to upload PDF and start CV analysis (no job description)
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

      const response = await authenticatedFormDataFetch('/analyze-cv-weaknesses', formData);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: `Server responded with status ${response.status}` }));
        
        // Check if it's a usage limit error (429 status)
        if (response.status === 429 && errorData.detail?.upgrade_required) {
          // Show usage limit warning instead of generic error
          setErrorMessage(null);
          // The UsageLimitWarning component will be shown in the upload page
          return;
        }
        
        throw { response, ...errorData };
      }

      const data = await response.json() as FlowResponse;

      // Debug: Log the actual backend response structure
      console.log('🔍 Backend Response Data:', {
        editableSections: data.editable_sections,
        recommendations: data.detailed_analysis?.recommendations,
        flowId: data.flow_id
      });

      setFlowResponse(data);
      setFlowId(data.flow_id);
      if (data.editable_sections) {
        console.log('📊 Setting editable sections:', data.editable_sections);
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
              if (['education', 'experience', 'projects', 'languages'].includes(section.id)) {                // Check if the recommendation is for a specific item or general
                const [, itemIndex, subField] = recommendation.field.split('.');
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

      const response = await authenticatedFetch('/complete-cv-flow', {
        method: 'POST',
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
      const response = await authenticatedFetch('/analyze-stored-cv-with-job-description', {
        method: 'POST',
        body: JSON.stringify({
          flow_id: flowId,
          job_description: jobDescription
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: `Server responded with status ${response.status}` }));
        
        // Check if it's a usage limit error (429 status)
        if (response.status === 429 && errorData.detail?.upgrade_required) {
          // Show usage limit warning instead of generic error
          setErrorMessage('Usage limit exceeded for job description analysis. Please upgrade your subscription to continue.');
          return;
        }
        
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
          if (['education', 'experience', 'projects', 'certifications'].includes(section.id)) {
            formattedData[section.id] = JSON.stringify(section.items);
          }
          break;
        case 'interests':
          formattedData[section.id] = JSON.stringify(section.items);
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
        ) : null;      case 3: // Recommendations
        // Debug: Log the actual data structure being passed
        console.log('🔍 Main App - Recommendations Data:', {
          recommendations: flowResponse?.detailed_analysis.recommendations,
          editableSections: editableSections,
          flowResponse: flowResponse
        });

        return flowResponse ? (
          <RecommendationsCarousel
            recommendations={flowResponse.detailed_analysis.recommendations}
            currentCVData={editableSections}
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
      <SubscriptionProvider>
        <SidebarProvider>
          <App />
          <Toaster />
        </SidebarProvider>
      </SubscriptionProvider>
    </AuthProvider>
  );
}
