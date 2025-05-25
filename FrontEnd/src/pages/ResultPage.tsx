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
      {/* Header Section */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-8 rounded-xl border border-gray-200">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-sm mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-3">Your Enhanced CV</h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Your CV has been enhanced based on your inputs and our AI recommendations.
          </p>
        </div>
      </div>
      
      {pdfUrl ? (        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="h-[70vh] min-h-[500px] bg-gray-50">
            <iframe 
              src={pdfUrl}
              title="PDF Viewer"
              className="w-full h-full"
              style={{ border: 'none' }}
            ></iframe>
          </div>
          
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-wrap justify-center gap-4">
              <a 
                href={pdfUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm"
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
                className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors duration-200 shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                </svg>
                Open in New Tab
              </a>
              
              <button 
                onClick={resetFlow} 
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Create Another CV
              </button>
            </div>
          </div>
        </div>      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-800">PDF Generation in Progress</h3>
              <p className="text-yellow-700 mt-1">Please wait while we generate your enhanced CV.</p>
            </div>
            <div className="flex-shrink-0">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
            </div>
          </div>
        </div>
      )}
        {/* Debug section to show PDF URL */}
      {pdfUrl && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Debug Information</h4>
          <p className="text-sm font-mono text-gray-600 break-all bg-white p-3 rounded border">
            <strong>PDF URL:</strong> {pdfUrl}
          </p>
        </div>
      )}
    </div>
  );
};

export default ResultPage;