import React, { useState } from 'react';
import ListInputField from './ListInputField';
import { motion } from 'framer-motion';

export interface SocialMediaLink {
  platform: string;
  url: string;
  [key: string]: string; // Allow string indexing to match Record<string, string>
}

interface SocialMediaInputsProps {
  links: SocialMediaLink[];
  onChange: (links: SocialMediaLink[]) => void;
  className?: string;
}

// Platform icons for common social media platforms
const platformIcons: Record<string, React.ReactNode> = {
  LinkedIn: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  GitHub: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  ),
  Twitter: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
    </svg>
  ),
  Portfolio: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M19.97 6.43L12 2L4.03 6.43L9.1 9.24C9.83 8.48 10.86 8 12 8C13.14 8 14.17 8.48 14.9 9.24L19.97 6.43ZM10 12C10 10.9 10.9 10 12 10C13.1 10 14 10.9 14 12C14 13.1 13.1 14 12 14C10.9 14 10 13.1 10 12ZM11 21.44L3 17V8.14L8.13 10.99C8.04 11.31 8 11.65 8 12C8 13.86 9.27 15.43 11 15.87V21.44ZM13 21.44V15.87C14.73 15.43 16 13.86 16 12C16 11.65 15.96 11.31 15.87 10.99L21 8.14V17L13 21.44Z" />
    </svg>
  )
};

/**
 * A specialized component for handling social media inputs
 * Uses the ListInputField component for its implementation
 */
const SocialMediaInputs: React.FC<SocialMediaInputsProps> = ({ 
  links, 
  onChange,
  className = ''
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [customPlatform, setCustomPlatform] = useState<string>('');
  const [url, setUrl] = useState<string>('');

  // Default platforms to suggest
  const commonPlatforms = ['LinkedIn', 'GitHub', 'Twitter', 'Portfolio'];
  
  // Custom object keys and labels for the ListInputField
  const objectKeys = ['platform', 'url'];
  const keyLabels = {
    platform: 'Platform',
    url: 'URL'
  };

  // Add a new social link
  const handleAddLink = () => {
    const platform = selectedPlatform === 'custom' ? customPlatform : selectedPlatform;
    
    if (platform && url) {
      const newLink: SocialMediaLink = { platform, url };
      onChange([...links, newLink]);
      
      // Reset form
      setSelectedPlatform('');
      setCustomPlatform('');
      setUrl('');
    }
  };

  // Custom renderer for platform field
  const renderPlatformField = (item: Record<string, string>, onChange: (value: string) => void) => {
    const platform = item.platform;
    const icon = platformIcons[platform];
    
    return (
      <div className="flex items-center gap-2">
        {icon && <span className="text-blue-600">{icon}</span>}
        <span>{platform}</span>
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium text-gray-700">Social Media & Links</h3>
      </div>
      
      <p className="text-sm text-gray-500">
        Add links to your professional profiles and websites. These will appear in your CV header.
      </p>

      {/* Custom add link form */}
      <motion.div 
        initial={{ opacity: 0.8 }}
        animate={{ opacity: 1 }}
        className="bg-gray-50 rounded-lg p-4 border border-dashed border-gray-200 mb-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Platform</label>
            <div className="flex gap-2">
              <select 
                className="select select-bordered select-sm flex-grow bg-white"
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
              >
                <option value="">Select platform</option>
                {commonPlatforms.map(platform => (
                  <option key={platform} value={platform}>{platform}</option>
                ))}
                <option value="custom">Other</option>
              </select>
              
              {selectedPlatform === 'custom' && (
                <input
                  type="text"
                  className="input input-bordered input-sm flex-grow bg-white"
                  placeholder="Enter platform name"
                  value={customPlatform}
                  onChange={(e) => setCustomPlatform(e.target.value)}
                />
              )}
            </div>
          </div>
          
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">URL</label>
            <input
              type="text"
              className="input input-bordered input-sm w-full bg-white"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddLink();
                }
              }}
            />
          </div>
        </div>
        
        <button
          onClick={handleAddLink}
          disabled={!(selectedPlatform && (selectedPlatform !== 'custom' || customPlatform) && url)}
          className="btn btn-sm btn-primary"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Link
        </button>
      </motion.div>

      {/* List of existing links */}
      {links.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-600">Your Links</h4>
          
          <ListInputField<Record<string, string>[]>
            label=""
            items={links as Record<string, string>[]}
            onChange={(newLinks) => onChange(newLinks as SocialMediaLink[])}
            isObjectList={true}
            objectKeys={objectKeys}
            keyLabels={keyLabels}
            addButtonText="Add Link"
            placeholder="Enter URL"
          />
        </div>
      )}

      <div className="text-xs text-gray-500 mt-2">
        <p>Tip: Include full URLs starting with http:// or https://</p>
      </div>
    </div>
  );
};

export default SocialMediaInputs; 