import React, { useState } from 'react';
import { LANGUAGE_PROFICIENCY_LEVELS, DEFAULT_PROFICIENCY } from '../../constants/languageProficiency';

export interface Language {
  id: string;
  name: string;
  level: string;
}

export interface LanguagesSection {
  id: string;
  name: string;
  type: 'languages';
  items: Language[];
  template: Omit<Language, 'id'>;
}

interface LanguagesEditorNewProps {
  section: LanguagesSection;
  onChange: (section: LanguagesSection) => void;
}

const LanguagesEditorNew: React.FC<LanguagesEditorNewProps> = ({ section, onChange }) => {  // Ensure template has safe default values
  const safeTemplate = {
    name: section.template?.name || '',
    level: section.template?.level || DEFAULT_PROFICIENCY
  };
  
  const [newLanguage, setNewLanguage] = useState<Omit<Language, 'id'>>(safeTemplate);

  const handleLanguageChange = (index: number, field: keyof Language, value: string) => {
    const newItems = [...section.items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange({ ...section, items: newItems });
  };

  const removeLanguage = (index: number) => {
    const newItems = [...section.items];
    newItems.splice(index, 1);
    onChange({ ...section, items: newItems });
  };  const addNewLanguage = () => {
    const languageName = newLanguage?.name || '';
    if (!languageName.trim()) return;
    
    const newId = `language_${Date.now()}`;    const languageToAdd = { 
      id: newId, 
      name: languageName,
      level: newLanguage?.level || DEFAULT_PROFICIENCY
    };
    onChange({ ...section, items: [...section.items, languageToAdd] });
    setNewLanguage(safeTemplate);
  };

  const handleNewLanguageChange = (field: keyof Omit<Language, 'id'>, value: string) => {
    setNewLanguage({ ...newLanguage, [field]: value });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6 overflow-hidden">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12.5 8a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z"/>
              <path d="M12.5 2a10.5 10.5 0 1 0 0 21 10.5 10.5 0 0 0 0-21z"/>
              <path d="M12 2v20"/>
              <path d="M2 12h20"/>
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
        <div className="space-y-4">
          {section.items.map((language, index) => (
            <div key={language.id} className="p-6 bg-gray-50 rounded-xl border border-gray-200 relative group hover:shadow-md transition-shadow duration-200">
              <button 
                onClick={() => removeLanguage(index)} 
                className="absolute top-4 right-4 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
                aria-label="Remove language"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">                <div className="space-y-2">
                  <label htmlFor={`name-${language.id}`} className="block text-sm font-medium text-gray-700">Language</label>
                  <input 
                    id={`name-${language.id}`}
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" 
                    value={language.name}
                    onChange={(e) => handleLanguageChange(index, 'name', e.target.value)}
                    placeholder="Enter language name"
                  />
                </div><div className="space-y-2">
                  <label htmlFor={`level-${language.id}`} className="block text-sm font-medium text-gray-700">Proficiency Level</label>
                  <select 
                    id={`level-${language.id}`}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" 
                    value={language.level}
                    onChange={(e) => handleLanguageChange(index, 'level', e.target.value)}                  >
                    <option value="">Select level</option>
                    {LANGUAGE_PROFICIENCY_LEVELS.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Add new language form */}
        <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-dashed border-blue-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
            </div>
            <h4 className="font-semibold text-gray-800">Add New Language</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">            <div className="space-y-2">
              <label htmlFor="new-language-name" className="block text-sm font-medium text-gray-700 sr-only">Language Name</label>              <input 
                id="new-language-name"
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" 
                value={newLanguage?.name || ''}
                onChange={(e) => handleNewLanguageChange('name', e.target.value)}
                placeholder="Language name"
              />
            </div><div className="space-y-2">
              <label htmlFor="new-language-level" className="block text-sm font-medium text-gray-700 sr-only">Proficiency Level</label>              <select 
                id="new-language-level"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" 
                value={newLanguage?.level || ''}
                onChange={(e) => handleNewLanguageChange('level', e.target.value)}              >
                <option value="">Select proficiency level</option>
                {LANGUAGE_PROFICIENCY_LEVELS.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
          </div>
            <button 
            onClick={addNewLanguage}
            disabled={!(newLanguage?.name || '').trim() || !(newLanguage?.level || '')} 
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
            Add Language
          </button>
        </div>
      </div>
    </div>
  );
};

export default LanguagesEditorNew;