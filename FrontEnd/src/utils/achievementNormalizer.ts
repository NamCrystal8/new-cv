/**
 * Utility function to ensure achievements are always arrays
 * Handles both JSON strings and various other formats
 */
export const normalizeAchievements = (achievements: any): string[] => {
  if (!achievements) return [];
  
  // If it's already an array, return it
  if (Array.isArray(achievements)) {
    return achievements.map(String).filter(Boolean);
  }
  
  // If it's a string that looks like a JSON array, try to parse it
  if (typeof achievements === 'string') {
    const trimmed = achievements.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          console.log("[AchievementNormalizer] Parsed JSON string achievements:", parsed);
          return parsed.map(String).filter(Boolean);
        }
      } catch (e) {
        console.log("[AchievementNormalizer] Failed to parse achievements JSON:", e);
      }
    }
    
    // If it's a regular string, treat it as a single achievement
    if (trimmed) {
      return [trimmed];
    }
  }
  
  return [];
};

/**
 * Utility function to normalize all achievements in experience data
 */
export const normalizeExperienceAchievements = (experienceItems: any[]): any[] => {
  return experienceItems.map(exp => ({
    ...exp,
    achievements: normalizeAchievements(exp.achievements)
  }));
};

/**
 * Utility function to normalize achievements when they're received from API or props
 */
export const preprocessExperienceData = (experienceSection: any): any => {
  if (!experienceSection || !experienceSection.items) {
    return experienceSection;
  }
  
  console.log("[AchievementNormalizer] Processing experience section with", experienceSection.items.length, "items");
  
  const normalizedItems = normalizeExperienceAchievements(experienceSection.items);
  
  return {
    ...experienceSection,
    items: normalizedItems
  };
};
