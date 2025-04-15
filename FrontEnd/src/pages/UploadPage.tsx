import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface UploadPageProps {
  isLoading: boolean;
  pdfFile: File | null;
  setPdfFile: (file: File | null) => void;
  setErrorMessage: (message: string | null) => void;
  analyzePdf: () => void;
}

const UploadPage: React.FC<UploadPageProps> = ({ 
  isLoading, 
  pdfFile, 
  setPdfFile, 
  setErrorMessage, 
  analyzePdf 
}) => {
  // File dropzone configuration using react-dropzone
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.type !== 'application/pdf') {
        setErrorMessage('Please upload a PDF file');
        return;
      }
      setPdfFile(file);
      setErrorMessage(null);
    }
  }, [setPdfFile, setErrorMessage]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    multiple: false
  });

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Upload Your CV</h2>
        <p className="text-base-content/70 max-w-2xl mx-auto">
          Upload your existing CV in PDF format. Our AI will analyze it and suggest improvements to make it stand out.
        </p>
      </div>
      
      {/* Dropzone area */}
      <div 
        {...getRootProps()} 
        className={`flex flex-col items-center justify-center p-8 border-2 border-dashed 
        ${isDragActive ? 'border-primary bg-primary/5' : 'border-base-300 bg-base-200/50'} 
        rounded-xl transition-all hover:bg-base-200 cursor-pointer`}
      >
        <input {...getInputProps()} />
        
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-primary opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        
        <h3 className="text-lg font-semibold mb-2">
          {pdfFile ? pdfFile.name : isDragActive ? 'Drop your CV here...' : 'Drag & drop your CV or click to browse'}
        </h3>
        
        <p className="text-base-content/60 text-sm mb-4">
          Supports PDF files only
        </p>
      </div>
      
      {pdfFile && (
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-4 p-2 bg-success/10 text-success rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>File selected: <strong>{pdfFile.name}</strong> ({Math.round(pdfFile.size / 1024)} KB)</span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setPdfFile(null);
              }} 
              className="btn btn-circle btn-xs btn-ghost"
            >
              ✕
            </button>
          </div>
          
          <button
            onClick={analyzePdf}
            disabled={isLoading}
            className="btn btn-primary btn-lg gap-2"
          >
            {isLoading ? (
              <>
                <span className="loading loading-spinner"></span>
                Analyzing...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                Analyze CV
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default UploadPage;