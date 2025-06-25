/**
 * localStorage utilities with error handling and fallbacks
 */

/**
 * Check if localStorage is available and working
 */
export const isLocalStorageAvailable = (): boolean => {
  try {
    const testKey = '__localStorage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

/**
 * Safely set an item in localStorage
 */
export const setLocalStorageItem = (key: string, value: string): boolean => {
  try {
    if (!isLocalStorageAvailable()) {
      console.warn('localStorage is not available');
      return false;
    }
    
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.code === 22) {
      console.warn('localStorage quota exceeded');
    } else {
      console.warn('Failed to set localStorage item:', error);
    }
    return false;
  }
};

/**
 * Safely get an item from localStorage
 */
export const getLocalStorageItem = (key: string): string | null => {
  try {
    if (!isLocalStorageAvailable()) {
      return null;
    }
    
    return localStorage.getItem(key);
  } catch (error) {
    console.warn('Failed to get localStorage item:', error);
    return null;
  }
};

/**
 * Safely remove an item from localStorage
 */
export const removeLocalStorageItem = (key: string): boolean => {
  try {
    if (!isLocalStorageAvailable()) {
      return false;
    }
    
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn('Failed to remove localStorage item:', error);
    return false;
  }
};

/**
 * Safely set a boolean value in localStorage
 */
export const setLocalStorageBoolean = (key: string, value: boolean): boolean => {
  return setLocalStorageItem(key, value.toString());
};

/**
 * Safely get a boolean value from localStorage
 */
export const getLocalStorageBoolean = (key: string, defaultValue: boolean = false): boolean => {
  const value = getLocalStorageItem(key);
  if (value === null) {
    return defaultValue;
  }
  return value === 'true';
};

/**
 * Safely set a JSON object in localStorage
 */
export const setLocalStorageJSON = (key: string, value: any): boolean => {
  try {
    const jsonString = JSON.stringify(value);
    return setLocalStorageItem(key, jsonString);
  } catch (error) {
    console.warn('Failed to stringify JSON for localStorage:', error);
    return false;
  }
};

/**
 * Safely get a JSON object from localStorage
 */
export const getLocalStorageJSON = <T = any>(key: string, defaultValue: T | null = null): T | null => {
  try {
    const value = getLocalStorageItem(key);
    if (value === null) {
      return defaultValue;
    }
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn('Failed to parse JSON from localStorage:', error);
    return defaultValue;
  }
};
