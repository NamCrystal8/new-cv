import React, { useState } from 'react';
import { 
  FlowResponse, 
  ContactSection, 
  EducationSection, 
  ExperienceSection, 
  SkillsSection, 
  ProjectsSection, 
  EducationItem,
  ExperienceItem,
  SkillCategory,
  ProjectItem,
  RawInputSection,
  EditableSection
} from '../types';

interface ReviewPageProps {
  isLoading: boolean;
  flowResponse: FlowResponse;
  completeCvFlow: (editableSections: EditableSection[]) => void;  // Updated type
  resetFlow: () => void;
}

// Helper component for displaying improvement suggestions
const ImprovementSuggestions: React.FC<{ suggestions: string[] }> = ({ suggestions }) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="card bg-base-200 hover:shadow-md transition-shadow mb-6">
      <div className="card-body">
        <h3 className="card-title text-lg flex gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Suggestions for Enhancement
        </h3>
        <ul className="list-disc list-inside space-y-2 text-base-content/80">
          {suggestions.map((suggestion, index) => (
            <li key={`suggestion-${index}`} className="pl-1">{suggestion}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// Helper component for contact information
const ContactInfoEditor: React.FC<{ section: ContactSection, onChange: (section: ContactSection) => void }> = ({ section, onChange }) => {
  const handleFieldChange = (fieldId: string, value: string) => {
    const newFields = section.fields.map(field => 
      field.id === fieldId ? { ...field, value } : field
    );
    onChange({ ...section, fields: newFields });
  };

  return (
    <div className="card bg-base-100 shadow-sm border border-base-300 mb-6">
      <div className="card-body">
        <h3 className="card-title text-lg mb-4">{section.name}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {section.fields.map(field => (
            <div key={field.id} className="form-control">
              <label className="label">
                <span className="label-text font-medium">{field.name}</span>
              </label>
              <input 
                type="text"
                className="input input-bordered w-full" 
                value={field.value}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                placeholder={`Enter ${field.name.toLowerCase()}`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Helper component for education items
const EducationEditor: React.FC<{ section: EducationSection, onChange: (section: EducationSection) => void }> = ({ section, onChange }) => {
  const [newItem, setNewItem] = useState<Omit<EducationItem, 'id'>>({ ...section.template });

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...section.items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange({ ...section, items: newItems });
  };

  const removeItem = (index: number) => {
    const newItems = [...section.items];
    newItems.splice(index, 1);
    onChange({ ...section, items: newItems });
  };

  const addNewItem = () => {
    // Generate a unique ID for the new item
    const newId = `education_${Date.now()}`;
    const itemToAdd = { id: newId, ...newItem };
    onChange({ ...section, items: [...section.items, itemToAdd] });
    // Reset the new item form
    setNewItem({ ...section.template });
  };

  const handleNewItemChange = (field: string, value: string) => {
    setNewItem({ ...newItem, [field]: value });
  };

  return (
    <div className="card bg-base-100 shadow-sm border border-base-300 mb-6">
      <div className="card-body">
        <h3 className="card-title text-lg mb-4">{section.name}</h3>
        
        {/* Existing items */}
        {section.items.map((item, index) => (
          <div key={item.id} className="mb-6 p-4 bg-base-200 rounded-lg relative">
            <button 
              onClick={() => removeItem(index)} 
              className="btn btn-circle btn-xs btn-error absolute top-2 right-2"
            >
              ✕
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Institution</span>
                </label>
                <input 
                  type="text"
                  className="input input-bordered w-full" 
                  value={item.institution}
                  onChange={(e) => handleItemChange(index, 'institution', e.target.value)}
                  placeholder="Enter institution name"
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Degree</span>
                </label>
                <input 
                  type="text"
                  className="input input-bordered w-full" 
                  value={item.degree}
                  onChange={(e) => handleItemChange(index, 'degree', e.target.value)}
                  placeholder="Enter degree"
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Location</span>
                </label>
                <input 
                  type="text"
                  className="input input-bordered w-full" 
                  value={item.location}
                  onChange={(e) => handleItemChange(index, 'location', e.target.value)}
                  placeholder="Enter location"
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Graduation Date</span>
                </label>
                <input 
                  type="text"
                  className="input input-bordered w-full" 
                  value={item.graduation_date}
                  onChange={(e) => handleItemChange(index, 'graduation_date', e.target.value)}
                  placeholder="e.g., May 2023"
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">GPA (Optional)</span>
                </label>
                <input 
                  type="text"
                  className="input input-bordered w-full" 
                  value={item.gpa}
                  onChange={(e) => handleItemChange(index, 'gpa', e.target.value)}
                  placeholder="e.g., 3.8/4.0"
                />
              </div>
            </div>
          </div>
        ))}
        
        {/* Add new item form */}
        <div className="mt-6 p-4 bg-base-200/50 rounded-lg border-2 border-dashed border-base-300">
          <h4 className="font-medium mb-4">Add New Education</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="form-control">
              <input 
                type="text"
                className="input input-bordered w-full" 
                value={newItem.institution}
                onChange={(e) => handleNewItemChange('institution', e.target.value)}
                placeholder="Institution name"
              />
            </div>
            <div className="form-control">
              <input 
                type="text"
                className="input input-bordered w-full" 
                value={newItem.degree}
                onChange={(e) => handleNewItemChange('degree', e.target.value)}
                placeholder="Degree"
              />
            </div>
            <div className="form-control">
              <input 
                type="text"
                className="input input-bordered w-full" 
                value={newItem.location}
                onChange={(e) => handleNewItemChange('location', e.target.value)}
                placeholder="Location"
              />
            </div>
            <div className="form-control">
              <input 
                type="text"
                className="input input-bordered w-full" 
                value={newItem.graduation_date}
                onChange={(e) => handleNewItemChange('graduation_date', e.target.value)}
                placeholder="Graduation date (e.g., May 2023)"
              />
            </div>
          </div>
          <button 
            onClick={addNewItem}
            disabled={!newItem.institution || !newItem.degree} 
            className="btn btn-primary btn-sm"
          >
            Add Education
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper component for experience items
const ExperienceEditor: React.FC<{ section: ExperienceSection, onChange: (section: ExperienceSection) => void }> = ({ section, onChange }) => {
  const [newItem, setNewItem] = useState<Omit<ExperienceItem, 'id'>>({ ...section.template });
  // Create a map to store newAchievement for each experience item
  const [newAchievements, setNewAchievements] = useState<Record<string, string>>({});

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...section.items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange({ ...section, items: newItems });
  };

  const handleAchievementChange = (itemIndex: number, achievementIndex: number, value: string) => {
    const newItems = [...section.items];
    const newAchievementsList = [...newItems[itemIndex].achievements];
    newAchievementsList[achievementIndex] = value;
    newItems[itemIndex] = { ...newItems[itemIndex], achievements: newAchievementsList };
    onChange({ ...section, items: newItems });
  };

  const getNewAchievement = (itemId: string) => {
    return newAchievements[itemId] || '';
  };

  const setNewAchievement = (itemId: string, value: string) => {
    setNewAchievements(prev => ({
      ...prev,
      [itemId]: value
    }));
  };

  const addAchievement = (itemIndex: number, itemId: string) => {
    const achievement = getNewAchievement(itemId);
    if (!achievement.trim()) return;
    
    const newItems = [...section.items];
    newItems[itemIndex] = { 
      ...newItems[itemIndex], 
      achievements: [...newItems[itemIndex].achievements, achievement]
    };
    onChange({ ...section, items: newItems });
    
    // Clear only this item's new achievement input
    setNewAchievement(itemId, '');
  };

  const removeAchievement = (itemIndex: number, achievementIndex: number) => {
    const newItems = [...section.items];
    const newAchievementsList = [...newItems[itemIndex].achievements];
    newAchievementsList.splice(achievementIndex, 1);
    newItems[itemIndex] = { ...newItems[itemIndex], achievements: newAchievementsList };
    onChange({ ...section, items: newItems });
  };

  const removeItem = (index: number) => {
    const newItems = [...section.items];
    newItems.splice(index, 1);
    onChange({ ...section, items: newItems });
  };

  const addNewItem = () => {
    // Generate a unique ID for the new item
    const newId = `experience_${Date.now()}`;
    const itemToAdd = { id: newId, ...newItem };
    onChange({ ...section, items: [...section.items, itemToAdd] });
    // Reset the new item form
    setNewItem({ ...section.template });
  };

  const handleNewItemChange = (field: string, value: any) => {
    setNewItem({ ...newItem, [field]: value });
  };

  return (
    <div className="card bg-base-100 shadow-sm border border-base-300 mb-6">
      <div className="card-body">
        <h3 className="card-title text-lg mb-4">{section.name}</h3>
        
        {/* Existing items */}
        {section.items.map((item, index) => (
          <div key={item.id} className="mb-6 p-4 bg-base-200 rounded-lg relative">
            <button 
              onClick={() => removeItem(index)} 
              className="btn btn-circle btn-xs btn-error absolute top-2 right-2"
            >
              ✕
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Company</span>
                </label>
                <input 
                  type="text"
                  className="input input-bordered w-full" 
                  value={item.company}
                  onChange={(e) => handleItemChange(index, 'company', e.target.value)}
                  placeholder="Enter company name"
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Job Title</span>
                </label>
                <input 
                  type="text"
                  className="input input-bordered w-full" 
                  value={item.title}
                  onChange={(e) => handleItemChange(index, 'title', e.target.value)}
                  placeholder="Enter job title"
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Location</span>
                </label>
                <input 
                  type="text"
                  className="input input-bordered w-full" 
                  value={item.location}
                  onChange={(e) => handleItemChange(index, 'location', e.target.value)}
                  placeholder="Enter location"
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Start Date</span>
                </label>
                <input 
                  type="text"
                  className="input input-bordered w-full" 
                  value={item.start_date}
                  onChange={(e) => handleItemChange(index, 'start_date', e.target.value)}
                  placeholder="e.g., Jun 2020"
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">End Date</span>
                </label>
                <div className="flex items-center gap-2">
                  <input 
                    type="text"
                    className="input input-bordered flex-1" 
                    value={item.end_date}
                    onChange={(e) => handleItemChange(index, 'end_date', e.target.value)}
                    placeholder={item.is_current ? "Present" : "e.g., Jul 2022"}
                    disabled={item.is_current}
                  />
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      className="checkbox checkbox-sm" 
                      checked={item.is_current}
                      onChange={(e) => handleItemChange(index, 'is_current', e.target.checked)}
                    />
                    <span className="label-text">Current</span>
                  </label>
                </div>
              </div>
            </div>
            
            {/* Achievements */}
            <div className="mt-4">
              <label className="label">
                <span className="label-text font-medium">Achievements</span>
              </label>
              <ul className="space-y-2">
                {item.achievements.map((achievement, achievementIndex) => (
                  <li key={achievementIndex} className="flex items-start gap-2">
                    <textarea
                      className="textarea textarea-bordered flex-1"
                      rows={2}
                      value={achievement}
                      onChange={(e) => handleAchievementChange(index, achievementIndex, e.target.value)}
                      placeholder="Describe an achievement or responsibility"
                    />
                    <button 
                      onClick={() => removeAchievement(index, achievementIndex)}
                      className="btn btn-ghost btn-sm text-error"
                    >
                      ✕
                    </button>
                  </li>
                ))}
                {/* Add achievement form - use item-specific state */}
                <li className="flex items-start gap-2">
                  <textarea
                    className="textarea textarea-bordered flex-1"
                    rows={2}
                    value={getNewAchievement(item.id)}
                    onChange={(e) => setNewAchievement(item.id, e.target.value)}
                    placeholder="Add a new achievement or responsibility"
                  />
                  <button 
                    onClick={() => {
                      addAchievement(index, item.id);
                    }}
                    disabled={!getNewAchievement(item.id).trim()}
                    className="btn btn-primary btn-sm"
                  >
                    +
                  </button>
                </li>
              </ul>
              <div className="text-xs text-base-content/70 mt-2">
                Tip: Start each bullet with an action verb and include metrics where possible (e.g., "Increased sales by 20%")
              </div>
            </div>
          </div>
        ))}
        
        {/* Add new item form */}
        <div className="mt-6 p-4 bg-base-200/50 rounded-lg border-2 border-dashed border-base-300">
          <h4 className="font-medium mb-4">Add New Experience</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="form-control">
              <input 
                type="text"
                className="input input-bordered w-full" 
                value={newItem.company}
                onChange={(e) => handleNewItemChange('company', e.target.value)}
                placeholder="Company name"
              />
            </div>
            <div className="form-control">
              <input 
                type="text"
                className="input input-bordered w-full" 
                value={newItem.title}
                onChange={(e) => handleNewItemChange('title', e.target.value)}
                placeholder="Job title"
              />
            </div>
            <div className="form-control">
              <input 
                type="text"
                className="input input-bordered w-full" 
                value={newItem.location}
                onChange={(e) => handleNewItemChange('location', e.target.value)}
                placeholder="Location"
              />
            </div>
            <div className="form-control">
              <input 
                type="text"
                className="input input-bordered w-full" 
                value={newItem.start_date}
                onChange={(e) => handleNewItemChange('start_date', e.target.value)}
                placeholder="Start date (e.g., Jun 2020)"
              />
            </div>
          </div>
          <button 
            onClick={addNewItem}
            disabled={!newItem.company || !newItem.title} 
            className="btn btn-primary btn-sm"
          >
            Add Experience
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper component for skills
const SkillsEditor: React.FC<{ section: SkillsSection, onChange: (section: SkillsSection) => void }> = ({ section, onChange }) => {
  const [newCategory, setNewCategory] = useState<Omit<SkillCategory, 'id'>>({ ...section.template });
  const [newSkill, setNewSkill] = useState('');
  const [editingCategoryIndex, setEditingCategoryIndex] = useState<number | null>(null);

  const handleCategoryNameChange = (index: number, name: string) => {
    const newCategories = [...section.categories];
    newCategories[index] = { ...newCategories[index], name };
    onChange({ ...section, categories: newCategories });
  };

  const addSkillToCategory = (categoryIndex: number, skill: string) => {
    if (!skill.trim()) return;
    
    const newCategories = [...section.categories];
    newCategories[categoryIndex] = {
      ...newCategories[categoryIndex],
      items: [...newCategories[categoryIndex].items, skill]
    };
    onChange({ ...section, categories: newCategories });
    setNewSkill('');
  };

  const removeSkill = (categoryIndex: number, skillIndex: number) => {
    const newCategories = [...section.categories];
    const newItems = [...newCategories[categoryIndex].items];
    newItems.splice(skillIndex, 1);
    newCategories[categoryIndex] = { ...newCategories[categoryIndex], items: newItems };
    onChange({ ...section, categories: newCategories });
  };

  const removeCategory = (index: number) => {
    const newCategories = [...section.categories];
    newCategories.splice(index, 1);
    onChange({ ...section, categories: newCategories });
  };

  const addNewCategory = () => {
    if (!newCategory.name.trim()) return;
    
    // Generate a unique ID
    const newId = `skill_category_${Date.now()}`;
    const categoryToAdd = { id: newId, ...newCategory };
    onChange({ ...section, categories: [...section.categories, categoryToAdd] });
    setNewCategory({ ...section.template });
  };

  return (
    <div className="card bg-base-100 shadow-sm border border-base-300 mb-6">
      <div className="card-body">
        <h3 className="card-title text-lg mb-4">{section.name}</h3>
        
        {/* Existing categories */}
        {section.categories.map((category, categoryIndex) => (
          <div key={category.id} className="mb-4 p-4 bg-base-200 rounded-lg relative">
            <button 
              onClick={() => removeCategory(categoryIndex)} 
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
                onChange={(e) => handleCategoryNameChange(categoryIndex, e.target.value)}
                placeholder="e.g., Technical, Languages, etc."
              />
            </div>
            
            {/* Skills in this category */}
            <div>
              <label className="label">
                <span className="label-text font-medium">Skills</span>
              </label>
              <div className="flex flex-wrap gap-2 mb-4">
                {category.items.map((skill, skillIndex) => (
                  <div key={skillIndex} className="badge badge-lg gap-2 p-4 bg-base-300">
                    {skill}
                    <button
                      onClick={() => removeSkill(categoryIndex, skillIndex)}
                      className="btn btn-ghost btn-xs text-error"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Add skill form */}
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                className="input input-bordered flex-1"
                value={editingCategoryIndex === categoryIndex ? newSkill : ''}
                onChange={(e) => setNewSkill(e.target.value)}
                onFocus={() => setEditingCategoryIndex(categoryIndex)}
                placeholder="Add a new skill"
              />
              <button
                onClick={() => {
                  addSkillToCategory(categoryIndex, newSkill);
                  setNewSkill('');
                }}
                disabled={editingCategoryIndex !== categoryIndex || !newSkill.trim()}
                className="btn btn-primary btn-sm"
              >
                Add
              </button>
            </div>
          </div>
        ))}
        
        {/* Add new category form */}
        <div className="mt-4 p-4 bg-base-200/50 rounded-lg border-2 border-dashed border-base-300">
          <h4 className="font-medium mb-4">Add New Skill Category</h4>
          <div className="flex gap-2">
            <input
              type="text"
              className="input input-bordered flex-1"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              placeholder="Category name (e.g., Technical, Languages, etc.)"
            />
            <button
              onClick={addNewCategory}
              disabled={!newCategory.name.trim()}
              className="btn btn-primary btn-sm"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component for projects
const ProjectsEditor: React.FC<{ section: ProjectsSection, onChange: (section: ProjectsSection) => void }> = ({ section, onChange }) => {
  const [newItem, setNewItem] = useState<Omit<ProjectItem, 'id'>>({ ...section.template });
  // Use maps to store individual contribution and technology inputs for each project
  const [newContributions, setNewContributions] = useState<Record<string, string>>({});
  const [newTechnologies, setNewTechnologies] = useState<Record<string, string>>({});

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...section.items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange({ ...section, items: newItems });
  };

  const handleContributionChange = (itemIndex: number, contributionIndex: number, value: string) => {
    const newItems = [...section.items];
    const newContributionsList = [...newItems[itemIndex].contributions];
    newContributionsList[contributionIndex] = value;
    newItems[itemIndex] = { ...newItems[itemIndex], contributions: newContributionsList };
    onChange({ ...section, items: newItems });
  };

  const getNewContribution = (itemId: string) => {
    return newContributions[itemId] || '';
  };

  const setNewContribution = (itemId: string, value: string) => {
    setNewContributions(prev => ({
      ...prev,
      [itemId]: value
    }));
  };

  const getNewTechnology = (itemId: string) => {
    return newTechnologies[itemId] || '';
  };

  const setNewTechnology = (itemId: string, value: string) => {
    setNewTechnologies(prev => ({
      ...prev,
      [itemId]: value
    }));
  };

  const addContribution = (itemIndex: number, itemId: string) => {
    const contribution = getNewContribution(itemId);
    if (!contribution.trim()) return;
    
    const newItems = [...section.items];
    newItems[itemIndex] = { 
      ...newItems[itemIndex], 
      contributions: [...newItems[itemIndex].contributions, contribution]
    };
    onChange({ ...section, items: newItems });
    
    // Clear only this project's new contribution input
    setNewContribution(itemId, '');
  };

  const removeContribution = (itemIndex: number, contributionIndex: number) => {
    const newItems = [...section.items];
    const newContributionsList = [...newItems[itemIndex].contributions];
    newContributionsList.splice(contributionIndex, 1);
    newItems[itemIndex] = { ...newItems[itemIndex], contributions: newContributionsList };
    onChange({ ...section, items: newItems });
  };

  const addTechnology = (itemIndex: number, itemId: string) => {
    const technology = getNewTechnology(itemId);
    if (!technology.trim()) return;
    
    const newItems = [...section.items];
    newItems[itemIndex] = { 
      ...newItems[itemIndex], 
      technologies: [...newItems[itemIndex].technologies, technology]
    };
    onChange({ ...section, items: newItems });
    
    // Clear only this project's new technology input
    setNewTechnology(itemId, '');
  };

  const removeTechnology = (itemIndex: number, techIndex: number) => {
    const newItems = [...section.items];
    const newTechnologies = [...newItems[itemIndex].technologies];
    newTechnologies.splice(techIndex, 1);
    newItems[itemIndex] = { ...newItems[itemIndex], technologies: newTechnologies };
    onChange({ ...section, items: newItems });
  };

  const removeItem = (index: number) => {
    const newItems = [...section.items];
    newItems.splice(index, 1);
    onChange({ ...section, items: newItems });
  };

  const addNewItem = () => {
    // Generate a unique ID for the new item
    const newId = `project_${Date.now()}`;
    const itemToAdd = { id: newId, ...newItem };
    onChange({ ...section, items: [...section.items, itemToAdd] });
    // Reset the new item form
    setNewItem({ ...section.template });
  };

  const handleNewItemChange = (field: string, value: any) => {
    setNewItem({ ...newItem, [field]: value });
  };

  return (
    <div className="card bg-base-100 shadow-sm border border-base-300 mb-6">
      <div className="card-body">
        <h3 className="card-title text-lg mb-4">{section.name}</h3>
        
        {/* Existing items */}
        {section.items.map((item, index) => (
          <div key={item.id} className="mb-6 p-4 bg-base-200 rounded-lg relative">
            <button 
              onClick={() => removeItem(index)} 
              className="btn btn-circle btn-xs btn-error absolute top-2 right-2"
            >
              ✕
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Project Title</span>
                </label>
                <input 
                  type="text"
                  className="input input-bordered w-full" 
                  value={item.title}
                  onChange={(e) => handleItemChange(index, 'title', e.target.value)}
                  placeholder="Enter project title"
                />
              </div>
              <div className="form-control md:col-span-2">
                <label className="label">
                  <span className="label-text font-medium">Project Description</span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full"
                  rows={2}
                  value={item.description}
                  onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                  placeholder="Enter brief project description"
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Start Date</span>
                </label>
                <input 
                  type="text"
                  className="input input-bordered w-full" 
                  value={item.start_date}
                  onChange={(e) => handleItemChange(index, 'start_date', e.target.value)}
                  placeholder="e.g., Jun 2020"
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">End Date</span>
                </label>
                <input 
                  type="text"
                  className="input input-bordered w-full" 
                  value={item.end_date}
                  onChange={(e) => handleItemChange(index, 'end_date', e.target.value)}
                  placeholder="e.g., Aug 2020"
                />
              </div>
            </div>
            
            {/* Technologies */}
            <div className="mt-4">
              <label className="label">
                <span className="label-text font-medium">Technologies</span>
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {item.technologies.map((tech, techIndex) => (
                  <div key={techIndex} className="badge badge-lg gap-2 p-4 bg-base-300">
                    {tech}
                    <button
                      onClick={() => removeTechnology(index, techIndex)}
                      className="btn btn-ghost btn-xs text-error"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input input-bordered flex-1"
                  value={getNewTechnology(item.id)}
                  onChange={(e) => setNewTechnology(item.id, e.target.value)}
                  placeholder="Add a technology"
                />
                <button
                  onClick={() => {
                    addTechnology(index, item.id);
                  }}
                  disabled={!getNewTechnology(item.id).trim()}
                  className="btn btn-primary btn-sm"
                >
                  Add
                </button>
              </div>
            </div>
            
            {/* Contributions */}
            <div className="mt-4">
              <label className="label">
                <span className="label-text font-medium">Key Contributions</span>
              </label>
              <ul className="space-y-2">
                {item.contributions.map((contribution, contributionIndex) => (
                  <li key={contributionIndex} className="flex items-start gap-2">
                    <textarea
                      className="textarea textarea-bordered flex-1"
                      rows={2}
                      value={contribution}
                      onChange={(e) => handleContributionChange(index, contributionIndex, e.target.value)}
                      placeholder="Describe your contribution"
                    />
                    <button 
                      onClick={() => removeContribution(index, contributionIndex)}
                      className="btn btn-ghost btn-sm text-error"
                    >
                      ✕
                    </button>
                  </li>
                ))}
                {/* Add contribution form - use project-specific state */}
                <li className="flex items-start gap-2">
                  <textarea
                    className="textarea textarea-bordered flex-1"
                    rows={2}
                    value={getNewContribution(item.id)}
                    onChange={(e) => setNewContribution(item.id, e.target.value)}
                    placeholder="Add a key contribution"
                  />
                  <button 
                    onClick={() => {
                      addContribution(index, item.id);
                    }}
                    disabled={!getNewContribution(item.id).trim()}
                    className="btn btn-primary btn-sm"
                  >
                    +
                  </button>
                </li>
              </ul>
            </div>
          </div>
        ))}
        
        {/* Add new item form */}
        <div className="mt-6 p-4 bg-base-200/50 rounded-lg border-2 border-dashed border-base-300">
          <h4 className="font-medium mb-4">Add New Project</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="form-control">
              <input 
                type="text"
                className="input input-bordered w-full" 
                value={newItem.title}
                onChange={(e) => handleNewItemChange('title', e.target.value)}
                placeholder="Project title"
              />
            </div>
            <div className="form-control md:col-span-2">
              <textarea
                className="textarea textarea-bordered w-full"
                rows={2}
                value={newItem.description}
                onChange={(e) => handleNewItemChange('description', e.target.value)}
                placeholder="Brief project description"
              />
            </div>
          </div>
          <button 
            onClick={addNewItem}
            disabled={!newItem.title} 
            className="btn btn-primary btn-sm"
          >
            Add Project
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper component for raw input (fallback)
const RawInputEditor: React.FC<{ section: RawInputSection, onChange: (section: RawInputSection) => void }> = ({ section, onChange }) => {
  return (
    <div className="card bg-base-100 shadow-sm border border-base-300 mb-6">
      <div className="card-body">
        <h3 className="card-title text-lg mb-4">{section.name}</h3>
        <textarea
          className="textarea textarea-bordered w-full font-mono text-sm"
          rows={10}
          value={section.value}
          onChange={(e) => onChange({ ...section, value: e.target.value })}
        />
      </div>
    </div>
  );
};

const ReviewPage: React.FC<ReviewPageProps> = ({ 
  isLoading,
  flowResponse,
  completeCvFlow,
  resetFlow
}) => {
  const [editableSections, setEditableSections] = useState<EditableSection[]>(
    flowResponse.editable_sections || []
  );

  const updateSection = (index: number, updatedSection: EditableSection) => {
    const newSections = [...editableSections];
    newSections[index] = updatedSection;
    setEditableSections(newSections);
  };

  // Handle submission with current edited sections
  const handleSubmit = () => {
    completeCvFlow(editableSections);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">CV Review & Enhancement</h2>
        <p className="text-base-content/70 max-w-2xl mx-auto">
          {flowResponse.analysis.summary || "Review and enhance your CV based on our analysis."}
        </p>
      </div>
      
      {/* Suggestions Section */}
      {flowResponse.analysis.improvement_suggestions && 
       flowResponse.analysis.improvement_suggestions.length > 0 && (
        <ImprovementSuggestions 
          suggestions={flowResponse.analysis.improvement_suggestions} 
        />
      )}
      
      {/* Missing Sections Alert */}
      {flowResponse.analysis.missing_sections && 
       flowResponse.analysis.missing_sections.length > 0 && (
        <div className="alert alert-warning shadow-md mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h3 className="font-bold">Missing Sections</h3>
            <div className="text-sm">
              Your CV is missing these important sections:
              <ul className="list-disc list-inside mt-1">
                {flowResponse.analysis.missing_sections.map((section, index) => (
                  <li key={index}>{section}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Editable Sections */}
      <div className="space-y-4">
        {editableSections.map((section, index) => {
          switch (section.type) {
            case 'object':
              return (
                <ContactInfoEditor 
                  key={section.id} 
                  section={section}
                  onChange={(updatedSection) => updateSection(index, updatedSection)} 
                />
              );
            case 'list':
              if (section.id === 'education') {
                return (
                  <EducationEditor 
                    key={section.id} 
                    section={section as EducationSection}
                    onChange={(updatedSection) => updateSection(index, updatedSection)} 
                  />
                );
              } else if (section.id === 'experience') {
                return (
                  <ExperienceEditor 
                    key={section.id} 
                    section={section as ExperienceSection}
                    onChange={(updatedSection) => updateSection(index, updatedSection)} 
                  />
                );
              } else if (section.id === 'projects') {
                return (
                  <ProjectsEditor 
                    key={section.id} 
                    section={section as ProjectsSection}
                    onChange={(updatedSection) => updateSection(index, updatedSection)} 
                  />
                );
              }
              return null;
            case 'nested_list':
              return (
                <SkillsEditor 
                  key={section.id} 
                  section={section as SkillsSection}
                  onChange={(updatedSection) => updateSection(index, updatedSection)} 
                />
              );
            case 'textarea':
              return (
                <RawInputEditor 
                  key={section.id} 
                  section={section as RawInputSection}
                  onChange={(updatedSection) => updateSection(index, updatedSection)} 
                />
              );
            default:
              return null;
          }
        })}
      </div>
      
      <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10">
        <button 
          onClick={handleSubmit} 
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