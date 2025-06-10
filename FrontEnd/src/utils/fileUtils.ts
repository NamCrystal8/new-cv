/**
 * Utility functions for file handling and validation
 */

export const FILE_CONSTRAINTS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  MIN_SIZE: 1024, // 1KB
  ALLOWED_TYPES: ['application/pdf'],
  ALLOWED_EXTENSIONS: ['.pdf']
} as const;

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): { isValid: boolean; error?: string } {
  // Check file type
  if (!FILE_CONSTRAINTS.ALLOWED_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: 'Please upload a PDF file only.'
    };
  }
  
  // Check file extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!FILE_CONSTRAINTS.ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      isValid: false,
      error: 'Please upload a file with .pdf extension.'
    };
  }
  
  // Check file size
  if (file.size < FILE_CONSTRAINTS.MIN_SIZE) {
    return {
      isValid: false,
      error: 'File is too small. Please upload a valid CV file.'
    };
  }
  
  if (file.size > FILE_CONSTRAINTS.MAX_SIZE) {
    return {
      isValid: false,
      error: `File is too large. Maximum size allowed is ${formatFileSize(FILE_CONSTRAINTS.MAX_SIZE)}.`
    };
  }
  
  return { isValid: true };
}

/**
 * Get file size constraints for display
 */
export function getFileSizeConstraints() {
  return {
    maxSizeMB: Math.round(FILE_CONSTRAINTS.MAX_SIZE / (1024 * 1024)),
    maxSizeFormatted: formatFileSize(FILE_CONSTRAINTS.MAX_SIZE),
    minSizeFormatted: formatFileSize(FILE_CONSTRAINTS.MIN_SIZE)
  };
}
