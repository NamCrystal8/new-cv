// Types related to CV analysis and flow responses
export interface CVAnalysis {
  weaknesses: string[];
  missing_information: string[];
  improvement_suggestions: string[];
  required_inputs: string[];
}

export interface FlowResponse {
  cv_data: any;
  analysis: CVAnalysis;
  flow_id: string;
}