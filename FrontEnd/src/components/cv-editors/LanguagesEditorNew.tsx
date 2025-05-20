import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import ListInputField from '../ui/ListInputField';

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
}> = ({ section, onChange }) => {
  const [newLanguage, setNewLanguage] = useState<Omit<LanguageItem, 'id'>>({ ...section.template });
  const [animatingItemId, setAnimatingItemId] = useState<string | null>(null);

  // Add a new language
  const handleAddLanguage = () => {
    if (!newLanguage.language.trim()) return;
    
    // Generate a unique ID
    const newId = `language_${Date.now()}`;
    const languageToAdd = { 
      id: newId, 
      language: newLanguage.language,
      proficiency: newLanguage.proficiency || 'Intermediate' // default value
    };
    
    onChange({ 
      ...section, 
      items: [...section.items, languageToAdd] 
    });
    
    // Reset form
    setNewLanguage({ ...section.template });
    
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

  // Proficiency options
  const proficiencyOptions = [
    'Native/Bilingual', 
    'Fluent', 
    'Advanced', 
    'Intermediate', 
    'Basic/Elementary'
  ];

  return (
    <div className="card bg-base-100 shadow-sm border border-base-300 mb-6">
      <div className="card-body">
        <h3 className="card-title text-lg mb-4">{section.name}</h3>
        
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
                className={`mb-4 p-4 ${isAnimating ? 'bg-red-50 border border-red-200' : 'bg-base-200'} rounded-lg relative`}
              >
                <button 
                  onClick={() => handleRemoveLanguage(index)} 
                  className="btn btn-circle btn-xs btn-error absolute top-2 right-2"
                >
                  ✕
                </button>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Language</span>
                    </label>
                    <input 
                      type="text"
                      className="input input-bordered w-full" 
                      value={item.language}
                      onChange={(e) => handleLanguageChange(index, 'language', e.target.value)}
                      placeholder="e.g., English, Spanish, etc."
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Proficiency</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={item.proficiency}
                      onChange={(e) => handleLanguageChange(index, 'proficiency', e.target.value)}
                    >
                      {proficiencyOptions.map(option => (
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
          className="mt-4 p-4 bg-base-200/50 rounded-lg border-2 border-dashed border-base-300"
        >
          <h4 className="font-medium mb-4">Add New Language</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="form-control">
              <input
                type="text"
                className="input input-bordered w-full"
                value={newLanguage.language}
                onChange={(e) => setNewLanguage({ ...newLanguage, language: e.target.value })}
                placeholder="Language name"
              />
            </div>
            
            <div className="form-control">
              <select
                className="select select-bordered w-full"
                value={newLanguage.proficiency}
                onChange={(e) => setNewLanguage({ ...newLanguage, proficiency: e.target.value })}
              >
                <option value="" disabled>Select proficiency</option>
                {proficiencyOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
          
          <Button
            onClick={handleAddLanguage}
            disabled={!newLanguage.language.trim()}
            className="btn btn-primary btn-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Language
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default LanguagesEditorNew; 