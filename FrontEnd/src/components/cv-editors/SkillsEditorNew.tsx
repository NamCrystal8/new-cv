import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ListInputField from '../ui/ListInputField';

// Types from the original editor
export interface SkillCategory {
  id: string;
  name: string;
  items: string[];
}

export interface SkillsSection {
  id: string;
  name: string;
  type: 'nested_list';
  categories: SkillCategory[];
  template: Omit<SkillCategory, 'id'>;
}

const SkillsEditorNew: React.FC<{ 
  section: SkillsSection, 
  onChange: (section: SkillsSection) => void 
}> = ({ section, onChange }) => {
  const [newCategory, setNewCategory] = useState<Omit<SkillCategory, 'id'>>({ ...section.template });
  const [animatingCategoryId, setAnimatingCategoryId] = useState<string | null>(null);

  // Add a new category
  const handleAddCategory = () => {
    if (!newCategory.name.trim()) return;
    
    // Generate a unique ID
    const newId = `skill_category_${Date.now()}`;
    const categoryToAdd = { 
      id: newId, 
      name: newCategory.name,
      items: [] 
    };
    
    onChange({ 
      ...section, 
      categories: [...section.categories, categoryToAdd] 
    });
    
    // Reset form
    setNewCategory({ ...section.template });
    
    // Animate
    setAnimatingCategoryId(newId);
    setTimeout(() => setAnimatingCategoryId(null), 500);
  };

  // Remove a category
  const handleRemoveCategory = (index: number) => {
    // Start remove animation
    const categoryToRemove = section.categories[index];
    setAnimatingCategoryId(categoryToRemove.id);
    
    // Delay actual removal to allow animation to complete
    setTimeout(() => {
      const newCategories = [...section.categories];
      newCategories.splice(index, 1);
      onChange({ ...section, categories: newCategories });
      setAnimatingCategoryId(null);
    }, 300);
  };

  // Update category name
  const handleCategoryNameChange = (index: number, name: string) => {
    const newCategories = [...section.categories];
    newCategories[index] = { ...newCategories[index], name };
    onChange({ ...section, categories: newCategories });
  };

  // Handle skills list changes for a category
  const handleSkillsChange = (categoryIndex: number, skills: string[]) => {
    const newCategories = [...section.categories];
    newCategories[categoryIndex] = { 
      ...newCategories[categoryIndex], 
      items: skills 
    };
    onChange({ ...section, categories: newCategories });
  };
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6 overflow-hidden">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">{section.name}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {section.categories.length} categor{section.categories.length === 1 ? 'y' : 'ies'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Existing categories */}
        <AnimatePresence>
          {section.categories.map((category, index) => {
            const isAnimating = animatingCategoryId === category.id;
            
            return (
              <motion.div
                key={category.id}
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
                  onClick={() => handleRemoveCategory(index)} 
                  className="absolute top-3 right-3 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                  aria-label="Remove category"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Name
                  </label>
                  <input 
                    type="text"
                    className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" 
                    value={category.name}
                    onChange={(e) => handleCategoryNameChange(index, e.target.value)}
                    placeholder="e.g., Technical, Languages, etc."
                  />
                </div>
                
                {/* Skills list for this category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skills
                  </label>
                  <ListInputField
                    label=""
                    items={category.items}
                    onChange={(newSkills) => handleSkillsChange(index, newSkills as string[])}
                    isObjectList={false}
                    placeholder="Add a skill"
                    addButtonText="Add Skill"
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {/* Add new category form */}
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
            <h4 className="font-medium text-gray-800">Add New Skill Category</h4>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              placeholder="Category name (e.g., Technical, Languages, etc.)"
            />
            <button
              onClick={handleAddCategory}
              disabled={!newCategory.name.trim()}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-medium rounded-lg transition-all duration-200 flex items-center gap-2 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Category
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SkillsEditorNew; 