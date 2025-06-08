import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const CVPreviewDebugPage: React.FC = () => {
  const [debugData, setDebugData] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    // Listen for debug data from the main application
    const handleDebugData = (event: CustomEvent) => {
      console.log('🔍 Debug data received:', event.detail);
      setDebugData(event.detail);
    };

    if (isListening) {
      window.addEventListener('cv-debug-data' as any, handleDebugData);
    }

    return () => {
      window.removeEventListener('cv-debug-data' as any, handleDebugData);
    };
  }, [isListening]);

  const startListening = () => {
    setIsListening(true);
    setDebugData(null);
    
    // Inject debug code into the main application
    const script = document.createElement('script');
    script.textContent = `
      // Override console.log to capture CV-related debug data
      const originalLog = console.log;
      console.log = function(...args) {
        originalLog.apply(console, args);
        
        // Check if this is CV-related debug data
        if (args[0] && typeof args[0] === 'string' && 
            (args[0].includes('🔍 Main App - Recommendations Data:') ||
             args[0].includes('🔍 Backend Response Data:') ||
             args[0].includes('📊 Setting editable sections:'))) {
          
          // Dispatch custom event with the debug data
          window.dispatchEvent(new CustomEvent('cv-debug-data', {
            detail: {
              type: args[0],
              data: args[1] || args.slice(1),
              timestamp: new Date().toISOString()
            }
          }));
        }
      };
    `;
    document.head.appendChild(script);
  };

  const stopListening = () => {
    setIsListening(false);
  };

  const analyzeDataStructure = (data: any) => {
    if (!data) return null;

    const analysis = {
      editableSections: null as any,
      recommendations: null as any,
      sectionNames: [] as string[],
      recommendationFields: [] as string[],
      fieldTypes: {} as any
    };

    // Analyze editable sections
    if (data.editableSections && Array.isArray(data.editableSections)) {
      analysis.editableSections = {
        count: data.editableSections.length,
        sections: data.editableSections.map((section: any) => ({
          id: section.id,
          name: section.name,
          type: section.type,
          hasFields: 'fields' in section,
          hasItems: 'items' in section,
          hasCategories: 'categories' in section,
          itemCount: section.items?.length || 0
        }))
      };
      analysis.sectionNames = data.editableSections.map((s: any) => s.name);
    }

    // Analyze recommendations
    if (data.recommendations && Array.isArray(data.recommendations)) {
      analysis.recommendations = {
        count: data.recommendations.length,
        recommendations: data.recommendations.map((rec: any) => ({
          id: rec.id,
          section: rec.section,
          field: rec.field,
          isDottedField: rec.field?.includes('.'),
          fieldParts: rec.field?.split('.') || []
        }))
      };
      analysis.recommendationFields = data.recommendations.map((r: any) => r.field);
    }

    return analysis;
  };

  const renderDataStructure = (obj: any, depth = 0) => {
    if (depth > 3) return <span className="text-gray-500">...</span>;
    
    if (Array.isArray(obj)) {
      return (
        <div className="ml-4">
          <span className="text-blue-600">[Array({obj.length})]</span>
          {obj.slice(0, 3).map((item, index) => (
            <div key={index} className="ml-2">
              <span className="text-gray-500">{index}:</span> {renderDataStructure(item, depth + 1)}
            </div>
          ))}
          {obj.length > 3 && <div className="ml-2 text-gray-500">... {obj.length - 3} more items</div>}
        </div>
      );
    }
    
    if (typeof obj === 'object' && obj !== null) {
      return (
        <div className="ml-4">
          <span className="text-green-600">{'{Object}'}</span>
          {Object.entries(obj).slice(0, 5).map(([key, value]) => (
            <div key={key} className="ml-2">
              <span className="text-purple-600">{key}:</span> {renderDataStructure(value, depth + 1)}
            </div>
          ))}
          {Object.keys(obj).length > 5 && (
            <div className="ml-2 text-gray-500">... {Object.keys(obj).length - 5} more properties</div>
          )}
        </div>
      );
    }
    
    return <span className="text-orange-600">{typeof obj}: {String(obj).slice(0, 50)}</span>;
  };

  const analysis = debugData ? analyzeDataStructure(debugData.data) : null;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">CV Preview Debug Console</h1>
        <p className="text-gray-600 mb-6">
          Real-time debugging of CV data structure and recommendations
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Debug Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Instructions:</h3>
              <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                <li>Click "Start Listening" below</li>
                <li>Go to the main app and upload a CV</li>
                <li>Proceed through the flow to recommendations</li>
                <li>Debug data will appear here automatically</li>
              </ol>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={startListening} 
                disabled={isListening}
                className="flex-1"
              >
                {isListening ? 'Listening...' : 'Start Listening'}
              </Button>
              <Button 
                variant="outline" 
                onClick={stopListening}
                disabled={!isListening}
              >
                Stop
              </Button>
            </div>

            {isListening && (
              <div className="p-3 bg-blue-50 rounded border border-blue-200">
                <div className="text-sm text-blue-800">
                  🎧 Listening for CV debug data...
                  <br />
                  <span className="text-xs">Go to the main app and proceed through the CV flow</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Debug Status */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Status</CardTitle>
          </CardHeader>
          <CardContent>
            {debugData ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="default">Data Received</Badge>
                  <span className="text-sm text-gray-600">
                    {new Date(debugData.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-sm">
                  <strong>Type:</strong> {debugData.type}
                </div>
                {analysis && (
                  <div className="space-y-2 text-sm">
                    {analysis.editableSections && (
                      <div>
                        <strong>Sections:</strong> {analysis.editableSections.count} found
                      </div>
                    )}
                    {analysis.recommendations && (
                      <div>
                        <strong>Recommendations:</strong> {analysis.recommendations.count} found
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No debug data received yet</p>
                <p className="text-sm mt-2">Start listening and use the main app</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data Analysis */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle>Data Structure Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Section Analysis */}
            {analysis.editableSections && (
              <div>
                <h3 className="font-medium mb-3">Editable Sections ({analysis.editableSections.count})</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {analysis.editableSections.sections.map((section: any, index: number) => (
                    <div key={index} className="p-3 bg-gray-50 rounded border">
                      <div className="font-medium">{section.name}</div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>ID: {section.id}</div>
                        <div>Type: {section.type}</div>
                        {section.itemCount > 0 && <div>Items: {section.itemCount}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendation Analysis */}
            {analysis.recommendations && (
              <div>
                <h3 className="font-medium mb-3">Recommendations ({analysis.recommendations.count})</h3>
                <div className="space-y-2">
                  {analysis.recommendations.recommendations.map((rec: any, index: number) => (
                    <div key={index} className="p-3 bg-gray-50 rounded border">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{rec.section}</span>
                        {rec.isDottedField && <Badge variant="secondary" className="text-xs">Dotted Field</Badge>}
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>Field: <code className="bg-gray-200 px-1 rounded">{rec.field}</code></div>
                        {rec.isDottedField && (
                          <div>Parts: {rec.fieldParts.join(' → ')}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Raw Data */}
      {debugData && (
        <Card>
          <CardHeader>
            <CardTitle>Raw Data Structure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded border overflow-auto max-h-96">
              <pre className="text-xs">
                {renderDataStructure(debugData.data)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CVPreviewDebugPage;
