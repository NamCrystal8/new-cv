import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
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
    <div className="card bg-base-100 shadow-sm border border-base-300 mb-6">
      <div className="card-body">
        <h3 className="card-title text-lg mb-4">{section.name}</h3>
        
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
                className={`mb-4 p-4 ${isAnimating ? 'bg-red-50 border border-red-200' : 'bg-base-200'} rounded-lg relative`}
              >
                <button 
                  onClick={() => handleRemoveCategory(index)} 
                  className="btn btn-circle btn-xs btn-error absolute top-2 right-2"
                >
                  ✕
                </button>
                
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text font-medium">Category Name</span>
                  </label>
                  <input 
                    type="text"
                    className="input input-bordered w-full md:w-1/2" 
                    value={category.name}
                    onChange={(e) => handleCategoryNameChange(index, e.target.value)}
                    placeholder="e.g., Technical, Languages, etc."
                  />
                </div>
                
                {/* Skills list for this category */}
                <div>
                  <label className="label">
                    <span className="label-text font-medium">Skills</span>
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
          className="mt-4 p-4 bg-base-200/50 rounded-lg border-2 border-dashed border-base-300"
        >
          <h4 className="font-medium mb-4">Add New Skill Category</h4>
          <div className="flex gap-2">
            <input
              type="text"
              className="input input-bordered flex-1"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              placeholder="Category name (e.g., Technical, Languages, etc.)"
            />
            <Button
              onClick={handleAddCategory}
              disabled={!newCategory.name.trim()}
              className="btn btn-primary btn-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Category
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SkillsEditorNew; 