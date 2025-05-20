import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import ListInputField from './ListInputField';

// Generic interface for list items
export interface ListItem {
  id: string;
  [key: string]: any;
}

// Configuration for field display
export interface FieldConfig {
  key: string;
  label: string;
  placeholder?: string;
  type?: 'text' | 'date' | 'textarea' | 'checkbox';
  required?: boolean;
  span?: number; // For grid layout (1 = half width, 2 = full width)
}

// Props for the GenericListEditor component
interface GenericListEditorProps<T extends ListItem> {
  title: string;
  items: T[];
  onChange: (items: T[]) => void;
  template: Omit<T, 'id'>;
  fields: FieldConfig[];
  addButtonText?: string;
  className?: string;
}

/**
 * A reusable component for editing lists of items in CV sections
 * Can be used for education, experience, projects, etc.
 */
function GenericListEditor<T extends ListItem>({
  title,
  items,
  onChange,
  template,
  fields,
  addButtonText = 'Add Item',
  className = ''
}: GenericListEditorProps<T>) {
  // State for the new item being added
  const [newItem, setNewItem] = useState<Omit<T, 'id'>>({ ...template });
  
  // Track animation state
  const [animatingItemId, setAnimatingItemId] = useState<string | null>(null);

  // Add a new item to the list
  const handleAddItem = () => {
    // Check if required fields are filled
    const requiredFields = fields.filter(f => f.required).map(f => f.key);
    const isValid = requiredFields.every(field => {
      const value = (newItem as any)[field];
      return value && (typeof value === 'string' ? value.trim() !== '' : true);
    });
    
    if (isValid) {
      // Generate a unique ID
      const newId = `item_${Date.now()}`;
      const itemToAdd = { id: newId, ...newItem } as T;
      
      // Add the new item
      onChange([...items, itemToAdd]);
      
      // Reset the form
      setNewItem({ ...template });
      
      // Animate
      setAnimatingItemId(newId);
      setTimeout(() => setAnimatingItemId(null), 500);
    }
  };

  // Remove an item from the list
  const handleRemoveItem = (index: number) => {
    // Start remove animation
    const itemToRemove = items[index];
    setAnimatingItemId(itemToRemove.id);
    
    // Delay actual removal to allow animation to complete
    setTimeout(() => {
      const newItems = [...items];
      newItems.splice(index, 1);
      onChange(newItems);
      setAnimatingItemId(null);
    }, 300);
  };

  // Update a field in an item
  const handleItemChange = (index: number, key: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [key]: value };
    onChange(newItems);
  };

  // Update the new item being added
  const handleNewItemChange = (key: string, value: any) => {
    setNewItem({ ...newItem, [key]: value });
  };

  // Handle nested array fields (like achievements, technologies, etc.)
  const handleNestedArrayChange = (index: number, key: string, newArray: string[]) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [key]: newArray };
    onChange(newItems);
  };

  // Render a field based on its type
  const renderField = (
    field: FieldConfig, 
    value: any, 
    onChange: (value: any) => void,
    itemId?: string
  ) => {
    const fieldType = field.type || 'text';
    
    switch (fieldType) {
      case 'textarea':
        return (
          <textarea
            className="textarea textarea-bordered w-full"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
          />
        );
        
      case 'checkbox':
        return (
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
          />
        );
        
      case 'date':
        return (
          <input
            type="text"
            className="input input-bordered w-full"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || 'YYYY-MM'}
          />
        );
        
      default:
        return (
          <input
            type="text"
            className="input input-bordered w-full"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
          />
        );
    }
  };

  return (
    <div className={`card bg-base-100 shadow-sm border border-base-300 mb-6 ${className}`}>
      <div className="card-body">
        <h3 className="card-title text-lg mb-4">{title}</h3>
        
        {/* Existing items */}
        <AnimatePresence>
          {items.map((item, index) => {
            const isAnimating = animatingItemId === item.id;
            
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className={`mb-6 p-4 ${isAnimating ? 'bg-red-50 border border-red-200' : 'bg-base-200'} rounded-lg relative`}
              >
                <button 
                  onClick={() => handleRemoveItem(index)} 
                  className="btn btn-circle btn-xs btn-error absolute top-2 right-2"
                >
                  ✕
                </button>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {fields.map((field) => {
                    // Check if this is a nested array field that should be handled by ListInputField
                    const value = (item as any)[field.key];
                    const isArray = Array.isArray(value);
                    
                    // Determine column span
                    const colSpan = field.span === 2 ? 'md:col-span-2' : '';
                    
                    if (isArray) {
                      // For array fields like achievements, use ListInputField
                      return (
                        <div key={field.key} className={`form-control ${colSpan}`}>
                          <label className="label">
                            <span className="label-text font-medium">{field.label}</span>
                          </label>
                          <ListInputField
                            label=""
                            items={value}
                            onChange={(newArray) => handleNestedArrayChange(index, field.key, newArray as string[])}
                            isObjectList={false}
                            placeholder={`Add ${field.label.toLowerCase()}`}
                          />
                        </div>
                      );
                    }
                    
                    return (
                      <div key={field.key} className={`form-control ${colSpan}`}>
                        <label className="label">
                          <span className="label-text font-medium">{field.label}</span>
                        </label>
                        {renderField(
                          field, 
                          (item as any)[field.key], 
                          (newValue) => handleItemChange(index, field.key, newValue),
                          item.id
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {/* Add new item form */}
        <motion.div
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="mt-6 p-4 bg-base-200/50 rounded-lg border-2 border-dashed border-base-300"
        >
          <h4 className="font-medium mb-4">Add New {title}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {fields.map((field) => {
              // Skip array fields in the add form - they'll be added after item creation
              if (Array.isArray((template as any)[field.key])) return null;
              
              // Determine column span
              const colSpan = field.span === 2 ? 'md:col-span-2' : '';
              
              return (
                <div key={field.key} className={`form-control ${colSpan}`}>
                  <label className="label">
                    <span className="label-text font-medium">{field.label}</span>
                  </label>
                  {renderField(
                    field, 
                    (newItem as any)[field.key], 
                    (newValue) => handleNewItemChange(field.key, newValue)
                  )}
                </div>
              );
            })}
          </div>
          
          <Button 
            onClick={handleAddItem}
            disabled={fields
              .filter(f => f.required)
              .some(f => {
                const value = (newItem as any)[f.key];
                return !value || (typeof value === 'string' && value.trim() === '');
              })}
            className="btn btn-primary btn-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            {addButtonText}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

export default GenericListEditor; 