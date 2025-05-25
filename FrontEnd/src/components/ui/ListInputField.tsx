import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

type StringList = string[];
type ObjectList = Record<string, string>[];

interface ListInputFieldProps<T extends StringList | ObjectList> {
  label: string;
  items: T;
  onChange: (items: T) => void;
  placeholder?: string;
  isObjectList: boolean;
  objectKeys?: string[];
  keyLabels?: Record<string, string>;
  addButtonText?: string;
  className?: string;
}

/**
 * A reusable component for editing lists of strings or objects
 * Can be used for simple string arrays like skills or social links
 * Or for object arrays with consistent keys like achievements or recommendations
 */
function ListInputField<T extends StringList | ObjectList>({
  label,
  items,
  onChange,
  placeholder = 'Add new item',
  isObjectList,
  objectKeys = [],
  keyLabels = {},
  addButtonText = 'Add',
  className = ''
}: ListInputFieldProps<T>) {
  // State for the new item being added
  const [newItem, setNewItem] = useState<string | Record<string, string>>(
    isObjectList ? objectKeys.reduce((obj, key) => ({ ...obj, [key]: '' }), {}) : ''
  );
  
  // Track animation state
  const [animatingItemId, setAnimatingItemId] = useState<string | null>(null);

  // Add a new item to the list
  const handleAddItem = () => {
    if (isObjectList) {
      // For object lists, check if required fields are filled
      const objItem = newItem as Record<string, string>;
      const hasValues = Object.values(objItem).some(val => val.trim() !== '');
      
      if (hasValues) {
        // Generate a unique ID for animation
        const newItemId = `item-${Date.now()}`;
        const itemWithId = { ...objItem, _animationId: newItemId };
        
        // Explicitly cast to the correct type
        const newItems = [...items, itemWithId] as unknown as T;
        onChange(newItems);
        
        // Reset the new item form
        setNewItem(objectKeys.reduce((obj, key) => ({ ...obj, [key]: '' }), {}));
        
        // Set animating ID briefly
        setAnimatingItemId(newItemId);
        setTimeout(() => setAnimatingItemId(null), 500);
      }
    } else {
      // For string lists
      const strItem = newItem as string;
      if (strItem.trim() !== '') {
        // Explicitly cast to the correct type
        const newItems = [...(items as string[]), strItem] as unknown as T;
        onChange(newItems);
        setNewItem('');
      }
    }
  };

  // Remove an item from the list
  const handleRemoveItem = (index: number) => {
    // Start remove animation
    const itemToRemove = items[index];
    const itemId = isObjectList ? (itemToRemove as any)._animationId || `item-${index}` : `item-${index}`;
    setAnimatingItemId(itemId);
    
    // Delay actual removal to allow animation to complete
    setTimeout(() => {
      const newItems = [...items];
      newItems.splice(index, 1);
      onChange(newItems as T);
      setAnimatingItemId(null);
    }, 300);
  };

  // Update a field in an object item
  const handleUpdateObjectField = (index: number, key: string, value: string) => {
    if (!isObjectList) return;
    
    const newItems = [...items] as Record<string, string>[];
    newItems[index] = { ...newItems[index], [key]: value };
    onChange(newItems as unknown as T);
  };

  // Update the new item being added (for object lists)
  const handleNewObjectFieldChange = (key: string, value: string) => {
    if (!isObjectList) return;
    setNewItem({ ...(newItem as Record<string, string>), [key]: value });
  };

  // Safely get display value, handling both strings and objects
  const getDisplayValue = (item: string | Record<string, string>, key?: string): string => {
    if (typeof item === 'string') return item;
    if (key && typeof item === 'object') {
      const value = item[key];
      return typeof value === 'string' ? value : JSON.stringify(value);
    }
    return JSON.stringify(item);
  };

  // Get animation ID for an item
  const getAnimationId = (item: any, index: number): string => {
    return isObjectList && item._animationId ? item._animationId : `item-${index}`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-gray-700">{label}</h3>
        </div>
      )}

      {/* Existing items */}
      <div className="space-y-3">
        <AnimatePresence>
          {items.map((item, index) => {
            const itemId = getAnimationId(item, index);
            const isAnimating = animatingItemId === itemId;
            
            return (
              <motion.div
                key={itemId}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className={`flex items-start gap-2 group relative rounded-lg border ${isAnimating ? 'border-red-200 bg-red-50' : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50/30'} p-3 transition-all`}
              >
                {isObjectList ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-grow">
                    {objectKeys.map(key => (
                      <div key={key} className="flex-grow">                        <label htmlFor={`${key}-${index}`} className="text-xs font-medium text-gray-500 mb-1 block">
                          {keyLabels[key] || key}
                        </label>
                        <input
                          id={`${key}-${index}`}
                          type="text"
                          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 w-full bg-white"
                          value={getDisplayValue(item as any, key)}
                          onChange={(e) => handleUpdateObjectField(index, key, e.target.value)}
                          placeholder={`Enter ${keyLabels[key] || key}`}
                        />
                      </div>
                    ))}
                  </div>
                ) : (                  <input
                    type="text"
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 flex-grow bg-white"
                    value={getDisplayValue(item as any)}
                    placeholder="Enter value"
                    onChange={(e) => {
                      const newItems = [...items] as any[];
                      newItems[index] = e.target.value;
                      onChange(newItems as unknown as T);
                    }}
                  />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveItem(index)}
                  className="text-gray-400 hover:text-red-500 transition-colors duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Add new item form */}
      <div className="pt-3 border-t border-gray-100">
        <motion.div
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="bg-gray-50 rounded-lg p-3 border border-dashed border-gray-200"
        >
          {isObjectList ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              {objectKeys.map(key => (
                <div key={key}>                  <label htmlFor={`new-${key}`} className="text-xs font-medium text-gray-500 mb-1 block">
                    {keyLabels[key] || key}
                  </label>
                  <input
                    id={`new-${key}`}
                    type="text"
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 w-full bg-white"
                    placeholder={`Enter ${keyLabels[key] || key}`}
                    value={getDisplayValue(newItem, key)}
                    onChange={(e) => handleNewObjectFieldChange(key, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddItem();
                      }
                    }}
                  />
                </div>
              ))}
            </div>          ) : (
            <input
              id="new-string-input"
              type="text"
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 w-full mb-3 bg-white"
              placeholder={placeholder}
              value={newItem as string}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddItem();
                }
              }}
              aria-label={label || 'New item input'}
            />
          )}

          <Button 
            variant="default" 
            size="sm" 
            onClick={handleAddItem}
            className="w-full md:w-auto"
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

export default ListInputField; 