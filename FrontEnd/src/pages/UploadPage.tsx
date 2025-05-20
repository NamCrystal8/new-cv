import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface UploadPageProps {
  isLoading: boolean;
  pdfFile: File | null;
  setPdfFile: (file: File | null) => void;
  setErrorMessage?: (message: string | null) => void;
  errorMessage?: string | null;
  analyzePdf: (jobDescription?: string) => void;
}

const UploadPage: React.FC<UploadPageProps> = ({ 
  isLoading, 
  pdfFile, 
  setPdfFile, 
  setErrorMessage, 
  errorMessage: propErrorMessage,
  analyzePdf 
}) => {
  const [jobDescription, setJobDescription] = React.useState<string>("");

  // Function to set error message (handles both cases)
  const handleSetError = (message: string | null) => {
    if (setErrorMessage) {
      setErrorMessage(message);
    }
    // If only errorMessage is provided (no setter), we can't set it locally
  };

  // File dropzone configuration using react-dropzone
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.type !== 'application/pdf') {
        handleSetError('Please upload a PDF file');
        return;
      }
      setPdfFile(file);
      handleSetError(null);
    }
  }, [setPdfFile, handleSetError]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    multiple: false
  });

  return (
    <div className="max-w-3xl mx-auto space-y-8 px-4 sm:px-6">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
          Upload Your CV
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Upload your existing CV in PDF format. Our AI will analyze it and suggest improvements to make it stand out.
        </p>
      </div>
      
      {/* Job Description Input */}
      <div className="space-y-2">
        <label htmlFor="job-description" className="block font-medium text-gray-700">
          Optional: Paste a Job Description
        </label>
        <textarea
          id="job-description"
          className="w-full min-h-[100px] border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="Paste the job description here to get a tailored analysis (skills gap, course suggestions, etc.)"
          value={jobDescription}
          onChange={e => setJobDescription(e.target.value)}
          disabled={isLoading}
        />
      </div>
      
      <div 
        {...getRootProps()} 
        className={cn(
          "flex flex-col items-center justify-center p-8 sm:p-12 border-2 border-dashed rounded-xl transition-all duration-200",
          "hover:border-primary/50 hover:bg-primary/[0.03]",
          isDragActive ? "border-primary bg-primary/5 scale-[1.02]" : "border-muted bg-muted/30",
          "cursor-pointer group"
        )}
      >
        <input {...getInputProps()} />
        
        <div className={cn(
          "w-16 h-16 mb-6 transition-transform duration-200",
          isDragActive ? "scale-110" : "group-hover:scale-110"
        )}>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="w-full h-full text-primary/80" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="1.5" 
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
            />
          </svg>
        </div>
        
        <h3 className="text-xl font-medium mb-2 text-center">
          {pdfFile ? pdfFile.name : isDragActive ? 'Drop your CV here...' : 'Drag & drop your CV or click to browse'}
        </h3>
        
        <p className="text-muted-foreground text-sm">
          Supports PDF files only
        </p>
      </div>
      
      {pdfFile && (
        <div className="flex flex-col items-center space-y-6">
          <div className="flex items-center gap-3 p-3 bg-primary/5 text-primary rounded-lg w-full max-w-md">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 flex-shrink-0" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                clipRule="evenodd" 
              />
            </svg>
            <span className="flex-1 truncate">
              <strong className="font-medium">{pdfFile.name}</strong>
              <span className="text-muted-foreground ml-1">
                ({Math.round(pdfFile.size / 1024)} KB)
              </span>
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                setPdfFile(null);
              }}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            </Button>
          </div>
          
          <Button
            onClick={() => analyzePdf(jobDescription)}
            disabled={isLoading}
            size="lg"
            className="w-full max-w-md"
          >
            {isLoading ? (
              <>
                <svg 
                  className="animate-spin -ml-1 mr-2 h-4 w-4" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Analyzing...
              </>
            ) : (
              <>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 mr-2" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" 
                    clipRule="evenodd" 
                  />
                </svg>
                Analyze CV
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default UploadPage;