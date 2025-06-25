import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface InterestsSection {
  id: string;
  name: string;
  type: 'interests';
  items: string[];
  template: string;
}

interface InterestsEditorNewProps {
  section: InterestsSection;
  onChange: (section: InterestsSection) => void;
}

const InterestsEditorNew: React.FC<InterestsEditorNewProps> = ({ section, onChange }) => {
  const [newInterest, setNewInterest] = useState<string>('');

  const handleAddInterest = () => {
    if (!newInterest.trim()) return;
    
    const updatedItems = [...section.items, newInterest.trim()];
    onChange({
      ...section,
      items: updatedItems
    });
    
    setNewInterest('');
  };

  const handleRemoveInterest = (index: number) => {
    const updatedItems = section.items.filter((_, i) => i !== index);
    onChange({
      ...section,
      items: updatedItems
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddInterest();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Interests</h3>
          <p className="text-gray-600 text-sm">Add your personal interests and hobbies</p>
        </div>
      </div>

      {/* Current Interests */}
      <div className="mb-6">
        <AnimatePresence>
          {section.items.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {section.items.map((interest, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 px-3 py-2 rounded-full text-sm font-medium flex items-center gap-2 group hover:from-purple-200 hover:to-pink-200 transition-all duration-200"
                >
                  <span>{interest}</span>
                  <button
                    onClick={() => handleRemoveInterest(index)}
                    className="text-purple-600 hover:text-purple-800 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <p>No interests added yet</p>
              <p className="text-sm">Add your first interest below</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Add New Interest */}
      <div className="flex gap-3">
        <div className="flex-1">
          <input
            type="text"
            value={newInterest}
            onChange={(e) => setNewInterest(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter an interest (e.g., Photography, Hiking, Reading)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
          />
        </div>
        <button
          onClick={handleAddInterest}
          disabled={!newInterest.trim()}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add
        </button>
      </div>
    </div>
  );
};

export default InterestsEditorNew;
