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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 resize-none"
            rows={3}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
          />
        );
        
      case 'checkbox':
        return (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
            />
            <span className="text-sm text-gray-700">Current position</span>
          </label>
        );
        
      case 'date':
        return (
          <input
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || 'YYYY-MM'}
          />
        );
        
      default:
        return (
          <input
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
          />
        );
    }
  };
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
          </div>
        </div>
      </div>
      
      <div className="p-6">
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
                className={`mb-6 p-6 ${isAnimating ? 'bg-red-50 border-2 border-red-200' : 'bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200'} rounded-xl relative group hover:shadow-md transition-all duration-200`}
              >                <button 
                  onClick={() => handleRemoveItem(index)} 
                  className="absolute top-3 right-3 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:scale-110 transform"
                  aria-label="Remove item"
                  title="Remove item"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
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
                        <div key={field.key} className={`space-y-2 ${colSpan}`}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">{field.label}</label>
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
                      <div key={field.key} className={`space-y-2 ${colSpan}`}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{field.label}</label>
                        <div className="relative">
                          {renderField(
                            field, 
                            (item as any)[field.key], 
                            (newValue) => handleItemChange(index, field.key, newValue),
                            item.id
                          )}
                        </div>
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
          className="mt-6 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border-2 border-dashed border-blue-200 hover:border-blue-300 transition-colors duration-200"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-900">Add New {title}</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {fields.map((field) => {
              // Skip array fields in the add form - they'll be added after item creation
              if (Array.isArray((template as any)[field.key])) return null;
              
              // Determine column span
              const colSpan = field.span === 2 ? 'md:col-span-2' : '';
              
              return (
                <div key={field.key} className={`space-y-2 ${colSpan}`}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{field.label}</label>
                  <div className="relative">
                    {renderField(
                      field, 
                      (newItem as any)[field.key], 
                      (newValue) => handleNewItemChange(field.key, newValue)
                    )}
                  </div>
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
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 px-6 rounded-full transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
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