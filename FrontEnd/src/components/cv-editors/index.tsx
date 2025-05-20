import React, { useState } from 'react';
import { SocialMediaLink } from '../ui/SocialMediaInputs';
import SocialMediaInputs from '../ui/SocialMediaInputs';

// Define interfaces for the components
export interface Field {
  id: string;
  name: string;
  value: string;
}

export interface ContactSection {
  id: string;
  name: string;
  type: 'object';
  fields: Field[];
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  location: string;
  graduation_date: string;
  gpa: string;
}

export interface EducationSection {
  id: string;
  name: string;
  type: 'list';
  items: EducationItem[];
  template: Omit<EducationItem, 'id'>;
}

export interface ExperienceItem {
  id: string;
  company: string;
  title: string;
  location: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  achievements: string[];
}

export interface ExperienceSection {
  id: string;
  name: string;
  type: 'list';
  items: ExperienceItem[];
  template: Omit<ExperienceItem, 'id'>;
}

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

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  technologies: string[];
  contributions: string[];
}

export interface ProjectsSection {
  id: string;
  name: string;
  type: 'list';
  items: ProjectItem[];
  template: Omit<ProjectItem, 'id'>;
}

export interface RawInputSection {
  id: string;
  name: string;
  type: 'textarea';
  value: string;
}

export type EditableSection = 
  | ContactSection
  | EducationSection
  | ExperienceSection
  | SkillsSection
  | ProjectsSection
  | RawInputSection;

// Helper component for contact information
export const ContactInfoEditor: React.FC<{ 
  section: ContactSection, 
  onChange: (section: ContactSection) => void 
}> = ({ section, onChange }) => {
  // Extract social media links if they exist in the data
  const [socialLinks, setSocialLinks] = useState<SocialMediaLink[]>(() => {
    const links: SocialMediaLink[] = [];
    
    // Look for fields that might be objects with social media data
    section.fields.forEach(field => {
      if (field.id === 'linkedin' || field.id === 'github' || 
          field.id === 'twitter' || field.id === 'portfolio' ||
          field.id === 'social') {
        try {
          // Check if the field value is a JSON string
          if (typeof field.value === 'string' && field.value.trim().startsWith('{')) {
            const socialData = JSON.parse(field.value);
            // Convert to our format
            Object.entries(socialData).forEach(([platform, url]) => {
              if (typeof url === 'string' && url.trim()) {
                links.push({ platform, url });
              }
            });
          } else if (typeof field.value === 'string' && field.value.trim()) {
            // If it's a regular string, use the field id as the platform
            links.push({ platform: field.id, url: field.value });
          }
        } catch (e) {
          // If parsing fails, try to use it as a regular string
          if (typeof field.value === 'string' && field.value.trim()) {
            links.push({ platform: field.id, url: field.value });
          }
        }
      }
    });
    
    return links;
  });

  const handleFieldChange = (fieldId: string, value: string) => {
    // Skip social media fields that we handle differently
    if (['linkedin', 'github', 'twitter', 'portfolio', 'social'].includes(fieldId)) {
      return;
    }
    
    const newFields = section.fields.map(field => 
      field.id === fieldId ? { ...field, value } : field
    );
    onChange({ ...section, fields: newFields });
  };

  const handleSocialLinksChange = (newLinks: SocialMediaLink[]) => {
    setSocialLinks(newLinks);
    
    // Create or update a 'social' field with the new links
    let socialField = section.fields.find(f => f.id === 'social');
    const socialValue = JSON.stringify(
      newLinks.reduce((obj, link) => ({ ...obj, [link.platform]: link.url }), {})
    );
    
    let newFields;
    if (socialField) {
      // Update existing field
      newFields = section.fields.map(field => 
        field.id === 'social' ? { ...field, value: socialValue } : field
      );
    } else {
      // Create new field
      newFields = [
        ...section.fields,
        { id: 'social', name: 'Social Media Links', value: socialValue }
      ];
    }
    
    onChange({ ...section, fields: newFields });
  };

  // Filter out social media fields for regular display
  const regularFields = section.fields.filter(field => 
    !['linkedin', 'github', 'twitter', 'portfolio', 'social'].includes(field.id)
  );

  return (
    <div className="card bg-base-100 shadow-sm border border-base-300 mb-6">
      <div className="card-body">
        <h3 className="card-title text-lg mb-4">{section.name}</h3>
        
        {/* Regular contact fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {regularFields.map(field => (
            <div key={field.id} className="form-control">
              <label className="label">
                <span className="label-text font-medium">{field.name}</span>
              </label>
              <input 
                type="text"
                className="input input-bordered w-full" 
                value={typeof field.value === 'string' ? field.value : JSON.stringify(field.value)}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                placeholder={`Enter ${field.name.toLowerCase()}`}
              />
            </div>
          ))}
        </div>
        
        {/* Social media links section */}
        <div className="border-t border-base-300 pt-4 mt-2">
          <SocialMediaInputs 
            links={socialLinks}
            onChange={handleSocialLinksChange}
          />
        </div>
      </div>
    </div>
  );
};

// Helper component for education items
export const EducationEditor: React.FC<{ 
  section: EducationSection, 
  onChange: (section: EducationSection) => void 
}> = ({ section, onChange }) => {
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
export const ExperienceEditor: React.FC<{ 
  section: ExperienceSection, 
  onChange: (section: ExperienceSection) => void 
}> = ({ section, onChange }) => {
  const [newItem, setNewItem] = useState<Omit<ExperienceItem, 'id'>>({ 
    ...section.template,
    achievements: Array.isArray(section.template.achievements) ? section.template.achievements : [] 
  });
  // Create a map to store newAchievement for each experience item
  const [newAchievements, setNewAchievements] = useState<Record<string, string>>({});

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...section.items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange({ ...section, items: newItems });
  };

  const handleAchievementChange = (itemIndex: number, achievementIndex: number, value: string) => {
    const newItems = [...section.items];
    // Ensure achievements is an array
    if (!Array.isArray(newItems[itemIndex].achievements)) {
      newItems[itemIndex].achievements = [];
    }
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
    // Ensure achievements is an array
    if (!Array.isArray(newItems[itemIndex].achievements)) {
      newItems[itemIndex].achievements = [];
    }
    
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
    // Ensure achievements is an array
    if (!Array.isArray(newItems[itemIndex].achievements)) {
      newItems[itemIndex].achievements = [];
      onChange({ ...section, items: newItems });
      return;
    }
    
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
    // Ensure achievements is initialized as an empty array if it's not already
    const itemToAdd = { 
      id: newId, 
      ...newItem,
      achievements: Array.isArray(newItem.achievements) ? newItem.achievements : [] 
    };
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
                {Array.isArray(item.achievements) ? item.achievements.map((achievement, achievementIndex) => (
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
                )) : null}
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
export const SkillsEditor: React.FC<{ 
  section: SkillsSection, 
  onChange: (section: SkillsSection) => void 
}> = ({ section, onChange }) => {
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
export const ProjectsEditor: React.FC<{ 
  section: ProjectsSection, 
  onChange: (section: ProjectsSection) => void 
}> = ({ section, onChange }) => {
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
export const RawInputEditor: React.FC<{ 
  section: RawInputSection, 
  onChange: (section: RawInputSection) => void 
}> = ({ section, onChange }) => {
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
