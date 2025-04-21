import React, { useEffect } from 'react';

interface ResultPageProps {
  pdfUrl: string | null;
  resetFlow: () => void;
}

const ResultPage: React.FC<ResultPageProps> = ({ pdfUrl, resetFlow }) => {
  
  useEffect(() => {
    // Debug log to check the PDF URL
    console.log("PDF URL in ResultPage:", pdfUrl);
  }, [pdfUrl]);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Your Enhanced CV</h2>
        <p className="text-base-content/70 max-w-2xl mx-auto">
          Your CV has been enhanced based on your inputs and our AI recommendations.
        </p>
      </div>
      
      {pdfUrl ? (
        <div className="card bg-base-100 shadow-sm border border-base-300 overflow-hidden">
          <div className="card-body p-0 h-[70vh] min-h-[500px]">
            <iframe 
              src={pdfUrl}
              title="PDF Viewer"
              className="w-full h-full"
              style={{ border: 'none' }}
            ></iframe>
          </div>
          
          <div className="card-actions justify-center p-4 bg-base-200">
            <a 
              href={pdfUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-primary gap-2"
              download="Enhanced_CV.pdf"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Download CV
            </a>
            
            <a 
              href={pdfUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-outline gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
              </svg>
              Open in New Tab
            </a>
            
            <button 
              onClick={resetFlow} 
              className="btn btn-secondary gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Create Another CV
            </button>
          </div>
        </div>
      ) : (
        <div className="alert alert-warning shadow-lg flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <div>
            <h3 className="font-bold">PDF Generation in Progress</h3>
            <div className="text-sm">Please wait while we generate your enhanced CV.</div>
          </div>
          <div className="loading loading-spinner loading-md"></div>
        </div>
      )}
      
      {/* Debug section to show PDF URL */}
      {pdfUrl && (
        <div className="mt-4 p-4 bg-base-200 rounded-lg">
          <p className="text-sm font-mono break-all">
            <strong>Debug - PDF URL:</strong> {pdfUrl}
          </p>
        </div>
      )}
    </div>
  );
};

export default ResultPage;