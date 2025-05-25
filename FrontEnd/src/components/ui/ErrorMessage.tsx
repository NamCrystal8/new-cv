import React from 'react';

interface ErrorMessageProps {
  message: string | null;
  onDismiss?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onDismiss }) => {
  if (!message) return null;
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 shadow-sm">
      <div className="flex items-start">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 shrink-0 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-red-800 font-medium flex-1">{message}</span>
        {onDismiss && (
          <button 
            className="ml-3 p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors duration-200"
            onClick={onDismiss}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;