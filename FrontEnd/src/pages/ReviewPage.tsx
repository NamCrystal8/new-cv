import React from 'react';
import { FlowResponse } from '../types';

interface ReviewPageProps {
  isLoading: boolean;
  flowResponse: FlowResponse;
  additionalInput: {[key: string]: string};
  selectedInputs: {[key: string]: boolean};
  handleAdditionalInputChange: (input: string, value: string) => void;
  toggleInputSelection: (input: string) => void;
  completeCvFlow: () => void;
  resetFlow: () => void;
}

const ReviewPage: React.FC<ReviewPageProps> = ({
  isLoading,
  flowResponse,
  additionalInput,
  selectedInputs,
  handleAdditionalInputChange,
  toggleInputSelection,
  completeCvFlow,
  resetFlow
}) => {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">CV Analysis Results</h2>
        <p className="text-base-content/70 max-w-2xl mx-auto">
          Our AI has analyzed your CV and identified areas for improvement. Review the suggestions below.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {flowResponse.analysis.weaknesses.length > 0 && (
          <div className="card bg-base-200 hover:shadow-md transition-shadow">
            <div className="card-body">
              <h3 className="card-title text-lg flex gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Areas for Improvement
              </h3>
              <ul className="list-disc list-inside space-y-2 text-base-content/80">
                {flowResponse.analysis.weaknesses.map((weakness, index) => (
                  <li key={`weakness-${index}`} className="pl-1">{weakness}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
        
        {flowResponse.analysis.missing_information.length > 0 && (
          <div className="card bg-base-200 hover:shadow-md transition-shadow">
            <div className="card-body">
              <h3 className="card-title text-lg flex gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Missing Information
              </h3>
              <ul className="list-disc list-inside space-y-2 text-base-content/80">
                {flowResponse.analysis.missing_information.map((info, index) => (
                  <li key={`missing-${index}`} className="pl-1">{info}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
      
      {flowResponse.analysis.improvement_suggestions.length > 0 && (
        <div className="card bg-base-200 hover:shadow-md transition-shadow">
          <div className="card-body">
            <h3 className="card-title text-lg flex gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Suggestions for Enhancement
            </h3>
            <ul className="list-disc list-inside space-y-2 text-base-content/80">
              {flowResponse.analysis.improvement_suggestions.map((suggestion, index) => (
                <li key={`suggestion-${index}`} className="pl-1">{suggestion}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      <div className="divider my-8">Additional Information</div>
      
      {flowResponse.analysis.required_inputs.length > 0 ? (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-bold mb-2">Enhance Your CV</h3>
            <p className="text-base-content/70 max-w-2xl mx-auto">
              Based on our analysis, providing the following information will significantly improve your CV.
            </p>
          </div>
          
          <div className="space-y-6">
            {flowResponse.analysis.required_inputs.map((input, index) => (
              <div 
                key={`input-${index}`} 
                className={`card ${selectedInputs[input] ? 'bg-base-200' : 'bg-base-200/50'} transition-all hover:shadow-md`}
              >
                <div className="card-body">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {selectedInputs[input] ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-base-content/30" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                      <h4 className="font-medium text-lg">{input}</h4>
                    </div>
                    <div className="form-control">
                      <label className="cursor-pointer label gap-2">
                        <span className="label-text">{selectedInputs[input] ? 'Include' : 'Exclude'}</span>
                        <input
                          type="checkbox"
                          className="toggle toggle-primary toggle-sm"
                          checked={selectedInputs[input] || false}
                          onChange={() => toggleInputSelection(input)}
                        />
                      </label>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <textarea
                      value={additionalInput[input] || ''}
                      onChange={(e) => handleAdditionalInputChange(input, e.target.value)}
                      rows={4}
                      placeholder={selectedInputs[input] ? `Enter ${input.toLowerCase()}...` : 'This field is disabled'}
                      className={`textarea textarea-bordered w-full ${!selectedInputs[input] ? 'bg-base-300/50 cursor-not-allowed' : ''}`}
                      disabled={!selectedInputs[input]}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card bg-success/10 text-success">
          <div className="card-body text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-bold mb-2">Great CV!</h3>
            <p className="text-lg">Your CV looks comprehensive. No additional information needed.</p>
          </div>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10">
        <button 
          onClick={completeCvFlow} 
          disabled={isLoading}
          className="btn btn-primary btn-lg gap-2"
        >
          {isLoading ? (
            <>
              <span className="loading loading-spinner"></span>
              Generating...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V8z" clipRule="evenodd" />
              </svg>
              Generate Enhanced CV
            </>
          )}
        </button>
        
        <button 
          onClick={resetFlow} 
          className="btn btn-outline btn-lg"
        >
          Start Over
        </button>
      </div>
    </div>
  );
};

export default ReviewPage;