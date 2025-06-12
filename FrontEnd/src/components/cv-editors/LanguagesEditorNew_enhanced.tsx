import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LANGUAGE_PROFICIENCY_LEVELS, DEFAULT_PROFICIENCY } from '../../constants/languageProficiency';

// Language item structure
export interface LanguageItem {
  id: string;
  language: string;
  proficiency: string;
}

export interface LanguagesSection {
  id: string;
  name: string;
  type: 'list';
  items: LanguageItem[];
  template: Omit<LanguageItem, 'id'>;
}

const LanguagesEditorNew: React.FC<{ 
  section: LanguagesSection, 
  onChange: (section: LanguagesSection) => void 
}> = ({ section, onChange }) => {  // Provide safe default template with guaranteed non-null values
  const defaultTemplate = { language: '', proficiency: DEFAULT_PROFICIENCY };
  
  // Create safe template ensuring no undefined values
  const safeTemplate = {
    language: (section.template?.language ?? '') || '',
    proficiency: (section.template?.proficiency ?? '') || DEFAULT_PROFICIENCY
  };
  
  const [newLanguage, setNewLanguage] = useState<Omit<LanguageItem, 'id'>>(() => ({
    language: safeTemplate.language || defaultTemplate.language,
    proficiency: safeTemplate.proficiency || defaultTemplate.proficiency
  }));
  const [animatingItemId, setAnimatingItemId] = useState<string | null>(null);

  // Add a new language
  const handleAddLanguage = () => {
    const languageValue = newLanguage.language || '';
    if (!languageValue.trim()) return;
      // Generate a unique ID
    const newId = `language_${Date.now()}`;    const languageToAdd = { 
      id: newId, 
      language: newLanguage.language || '',
      proficiency: newLanguage.proficiency || DEFAULT_PROFICIENCY // default value
    };
    
    onChange({ 
      ...section, 
      items: [...section.items, languageToAdd]    });      // Reset form with guaranteed safe values
    setNewLanguage({ 
      language: '',
      proficiency: DEFAULT_PROFICIENCY
    });
    
    // Animate
    setAnimatingItemId(newId);
    setTimeout(() => setAnimatingItemId(null), 500);
  };

  // Remove a language
  const handleRemoveLanguage = (index: number) => {
    // Start remove animation
    const itemToRemove = section.items[index];
    setAnimatingItemId(itemToRemove.id);
    
    // Delay actual removal to allow animation to complete
    setTimeout(() => {
      const newItems = [...section.items];
      newItems.splice(index, 1);
      onChange({ ...section, items: newItems });
      setAnimatingItemId(null);
    }, 300);
  };
  // Update language field
  const handleLanguageChange = (index: number, field: keyof Omit<LanguageItem, 'id'>, value: string) => {
    const newItems = [...section.items];
    newItems[index] = { 
      ...newItems[index],
      [field]: value
    };
    onChange({ ...section, items: newItems });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6 overflow-hidden">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389c-.188-.196-.373-.396-.554-.6a19.098 19.098 0 01-3.107 3.567 1 1 0 01-1.334-1.49 17.087 17.087 0 003.13-3.733 18.992 18.992 0 01-1.487-2.494 1 1 0 111.79-.89c.234.47.489.928.764 1.372.417-.934.752-1.913.997-2.927H3a1 1 0 110-2h3V3a1 1 0 011-1zm6 6a1 1 0 01.894.553l2.991 5.982a.869.869 0 01.02.037l.99 1.98a1 1 0 11-1.79.895L15.383 16h-4.764l-.724 1.447a1 1 0 11-1.788-.894l.99-1.98.019-.038 2.99-5.982A1 1 0 0113 8zm-1.382 6h2.764L13 11.236 11.618 14z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">{section.name}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {section.items.length} language{section.items.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Existing languages */}
        <AnimatePresence>
          {section.items.map((item, index) => {
            const isAnimating = animatingItemId === item.id;
            
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className={`mb-6 p-5 ${
                  isAnimating 
                    ? 'bg-red-50 border-2 border-red-200' 
                    : 'bg-gray-50 border border-gray-200'
                } rounded-xl relative group hover:shadow-md transition-all duration-200`}
              >
                <button 
                  onClick={() => handleRemoveLanguage(index)} 
                  className="absolute top-3 right-3 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                  aria-label="Remove language"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Language
                    </label>
                    <input 
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" 
                      value={item.language}
                      onChange={(e) => handleLanguageChange(index, 'language', e.target.value)}
                      placeholder="e.g., English, Spanish, etc."
                    />
                  </div>
                    <div>
                    <label htmlFor={`proficiency-${index}`} className="block text-sm font-medium text-gray-700 mb-2">
                      Proficiency
                    </label>
                    <select
                      id={`proficiency-${index}`}                      aria-label="Language proficiency level"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      value={item.proficiency}
                      onChange={(e) => handleLanguageChange(index, 'proficiency', e.target.value)}
                    >
                      {LANGUAGE_PROFICIENCY_LEVELS.map((option: string) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {/* Add new language form */}
        <motion.div
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="mt-6 p-5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-dashed border-blue-300"
        >
          <div className="flex items-center gap-2 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <h4 className="font-medium text-gray-800">Add New Language</h4>
          </div>          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="new-language-name" className="block text-sm font-medium text-gray-700 mb-2">
                Language Name
              </label>              <input
                id="new-language-name"
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                value={newLanguage?.language ?? ''}
                onChange={(e) => setNewLanguage({ ...newLanguage, language: e.target.value })}
                placeholder="Language name"
              />
            </div>
              <div>
              <label htmlFor="new-language-proficiency" className="block text-sm font-medium text-gray-700 mb-2">
                Proficiency Level
              </label>              <select
                id="new-language-proficiency"
                aria-label="Select proficiency level for new language"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"                value={newLanguage?.proficiency ?? DEFAULT_PROFICIENCY}
                onChange={(e) => setNewLanguage({ ...newLanguage, proficiency: e.target.value })}
              ><option value="" disabled>Select proficiency</option>
                {LANGUAGE_PROFICIENCY_LEVELS.map((option: string) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>            <button
            onClick={handleAddLanguage}
            disabled={!((newLanguage?.language ?? '').trim())}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-medium rounded-lg transition-all duration-200 flex items-center gap-2 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Language
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default LanguagesEditorNew;
