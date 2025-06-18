import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { JobDescriptionAnalysis, EditableSection } from '../../types';
import { Button } from './button';
import { Card, CardHeader, CardTitle, CardContent } from './card';
import { Badge } from './badge';
import { Trash2, Plus, Edit3, Check, X, Award, Briefcase, FileText, AlertCircle, TrendingUp, BookOpen, Sparkles, Target, Zap } from 'lucide-react';

interface InteractiveCVOptimizerProps {
  jobAnalysis: JobDescriptionAnalysis;
  currentCVData: EditableSection[];
  onOptimize: (optimizedSections: EditableSection[], appliedChanges: OptimizationChange[]) => void;
  isLoading?: boolean;
}

interface OptimizationChange {
  id: string;
  type: 'add_skill' | 'remove_skill' | 'modify_experience' | 'add_experience' | 'update_summary' | 'add_project' | 'modify_education' | 'update_contact';
  section: string;
  description: string;
  applied: boolean;
}

interface SkillToAdd {
  name: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

interface ExperienceToAdd {
  company: string;
  title: string;
  achievement: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

interface ProjectToAdd {
  title: string;
  description: string;
  technology: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

interface OptimizationSuggestion {
  type: 'weakness' | 'missing_requirement' | 'enhancement' | 'course';
  title: string;
  description: string;
  action?: string;
  priority: 'high' | 'medium' | 'low';
  category?: string;
}

interface PopupState {
  show: boolean;
  x: number;
  y: number;
  suggestions: OptimizationSuggestion[];
  itemType: 'skill' | 'experience' | 'project' | 'education';
  itemId: string;
}

const InteractiveCVOptimizer: React.FC<InteractiveCVOptimizerProps> = ({
  jobAnalysis,
  currentCVData,
  onOptimize,
  isLoading = false
}) => {
  const [optimizedSections, setOptimizedSections] = useState<EditableSection[]>([...currentCVData]);
  const [appliedChanges, setAppliedChanges] = useState<OptimizationChange[]>([]);
  const [suggestedSkills, setSuggestedSkills] = useState<SkillToAdd[]>([]);
  const [, setSuggestedExperiences] = useState<ExperienceToAdd[]>([]);  const [, setSuggestedProjects] = useState<ProjectToAdd[]>([]);  const [editingSkill, setEditingSkill] = useState<{index: number, value: string} | null>(null);
  const [newSkillInput, setNewSkillInput] = useState<string>('');
  const [newAchievements, setNewAchievements] = useState<Record<string, string>>({});  const [newTechnologies, setNewTechnologies] = useState<Record<string, string>>({});
  const [newContributions, setNewContributions] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'skills' | 'experience' | 'projects'>('skills');  const [popupState, setPopupState] = useState<PopupState>({
    show: false,
    x: 0,
    y: 0,
    suggestions: [],
    itemType: 'skill',
    itemId: ''
  });
  const [notification, setNotification] = useState<{show: boolean, message: string, type: 'success' | 'info' | 'warning'}>({
    show: false,
    message: '',
    type: 'success'
  });

  // Animation states
  const [previousScore, setPreviousScore] = useState<number>(0);
  const [scoreImprovement, setScoreImprovement] = useState<boolean>(false);
  const [animatingItems, setAnimatingItems] = useState<Set<string>>(new Set());
  const [completedOptimizations, setCompletedOptimizations] = useState<number>(0);

  const popupRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Extract suggestions from job analysis
    const skills: SkillToAdd[] = [];
    const experiences: ExperienceToAdd[] = [];
    const projects: ProjectToAdd[] = [];

    // Get current skills to avoid suggesting skills already in CV
    const currentSkills = getUnifiedSkills();
    const currentSkillsLower = currentSkills.map(skill => skill.toLowerCase());

    // From missing skills array (primary source for skill suggestions)
    jobAnalysis.missing?.forEach((missingSkill) => {
      if (typeof missingSkill === 'string') {
        // Only suggest if not already in current skills
        if (!currentSkillsLower.includes(missingSkill.toLowerCase())) {
          skills.push({
            name: missingSkill,
            reason: 'Missing skill that would improve your match rate',
            priority: 'high'
          });
        }
      }
    });

    // From missing requirements (secondary source)
    jobAnalysis.missing_requirements?.forEach((req) => {
      // Only suggest if not already in current skills and not already added from missing array
      if (!currentSkillsLower.includes(req.toLowerCase()) &&
          !skills.some(skill => skill.name.toLowerCase() === req.toLowerCase())) {
        skills.push({
          name: req,
          reason: 'Missing requirement from job description',
          priority: 'high'
        });
      }
    });

    // From recommended courses (tertiary source)
    jobAnalysis.recommended_courses?.forEach(course => {
      if (course.skill_addressed &&
          !currentSkillsLower.includes(course.skill_addressed.toLowerCase()) &&
          !skills.some(skill => skill.name.toLowerCase() === course.skill_addressed.toLowerCase())) {
        skills.push({
          name: course.skill_addressed,
          reason: `Learn through: ${course.title}`,
          priority: 'medium'
        });
      }
    });

    // From weaknesses (suggest experience improvements)
    jobAnalysis.weaknesses?.forEach(weakness => {
      if (weakness.category?.toLowerCase().includes('experience')) {
        experiences.push({
          company: 'Relevant Company',
          title: 'Relevant Position',
          achievement: weakness.description,
          reason: 'Address weakness identified in analysis',
          priority: 'high'
        });
      }
    });

    setSuggestedSkills(skills.slice(0, 10));
    setSuggestedExperiences(experiences.slice(0, 5));
    setSuggestedProjects(projects.slice(0, 5));
  }, [jobAnalysis, optimizedSections]); // Add optimizedSections to dependencies since we call getUnifiedSkills

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setPopupState(prev => ({ ...prev, show: false }));
      }
    };

    if (popupState.show) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }  }, [popupState.show]);

  // Track score changes for animations
  useEffect(() => {
    const currentScore = calculateDynamicScore().score;
    if (previousScore > 0 && currentScore > previousScore) {
      setScoreImprovement(true);
      setCompletedOptimizations(prev => prev + 1);
      setTimeout(() => setScoreImprovement(false), 2000);
    }
    setPreviousScore(currentScore);
  }, [optimizedSections, appliedChanges]);

  // Enhanced notification with better feedback
  const showNotification = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setNotification({ show: true, message, type });

    // Add haptic feedback for mobile devices
    if ('vibrate' in navigator) {
      navigator.vibrate(type === 'success' ? [50, 50, 50] : [100]);
    }

    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  // Enhanced skill addition with animation feedback
  const addSkillToCVWithAnimation = (skillToAdd: SkillToAdd) => {
    // Add animation state
    setAnimatingItems(prev => new Set([...prev, skillToAdd.name]));

    // Call original function
    addSkillToCV(skillToAdd);

    // Remove animation state after delay
    setTimeout(() => {
      setAnimatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(skillToAdd.name);
        return newSet;
      });
    }, 1000);
  };

  // Generate optimization suggestions for a specific item
  const generateOptimizationSuggestions = (itemType: 'skill' | 'experience' | 'project' | 'education', itemData: any): OptimizationSuggestion[] => {
    const suggestions: OptimizationSuggestion[] = [];

    switch (itemType) {
      case 'skill':
        // Check if skill matches job requirements
        const isHighDemand = jobAnalysis.missing_requirements?.some(req => 
          req.toLowerCase().includes(itemData.toLowerCase())
        );
        
        if (isHighDemand) {
          suggestions.push({
            type: 'enhancement',
            title: 'High Demand Skill',
            description: 'This skill is specifically mentioned in the job requirements. Consider highlighting proficiency level or recent experience with it.',
            priority: 'high'
          });
        }

        // Check for related weaknesses
        const relatedWeakness = jobAnalysis.weaknesses?.find(w => 
          w.description.toLowerCase().includes(itemData.toLowerCase())
        );
        
        if (relatedWeakness) {
          suggestions.push({
            type: 'weakness',
            title: 'Identified Weakness',
            description: relatedWeakness.description,
            action: 'Consider providing specific examples or certifications for this skill',
            priority: 'high'
          });
        }

        // Suggest relevant courses
        const relevantCourse = jobAnalysis.recommended_courses?.find(course =>
          course.skill_addressed?.toLowerCase().includes(itemData.toLowerCase())
        );
        
        if (relevantCourse) {
          suggestions.push({
            type: 'course',
            title: 'Skill Enhancement Course',
            description: `${relevantCourse.title} - ${relevantCourse.platform}`,
            action: `Complete this course to strengthen this skill`,
            priority: 'medium'
          });
        }
        break;

      case 'experience':        // Check experience relevance to job
        const jobTitle = itemData.title?.toLowerCase() || '';
        
        // Check if experience aligns with missing requirements
        const alignsWithRequirements = jobAnalysis.missing_requirements?.some(req =>
          jobTitle.includes(req.toLowerCase()) || req.toLowerCase().includes(jobTitle)
        );

        if (alignsWithRequirements) {
          suggestions.push({
            type: 'enhancement',
            title: 'Highly Relevant Experience',
            description: 'This experience directly aligns with job requirements. Consider adding more specific achievements and metrics.',
            priority: 'high'
          });
        }

        // Suggest missing technical skills for this role
        const missingTechSkills = jobAnalysis.missing_requirements?.filter(req =>
          req.toLowerCase().includes('technology') || req.toLowerCase().includes('programming') || req.toLowerCase().includes('software')
        );

        if (missingTechSkills && missingTechSkills.length > 0) {
          suggestions.push({
            type: 'missing_requirement',
            title: 'Add Technical Skills',
            description: `Consider highlighting these technologies used in this role: ${missingTechSkills.slice(0, 3).join(', ')}`,
            action: 'Add achievements that showcase these technical skills',
            priority: 'high'
          });
        }

        // Check for experience-related weaknesses
        const expWeakness = jobAnalysis.weaknesses?.find(w =>
          w.category?.toLowerCase().includes('experience')
        );

        if (expWeakness) {
          suggestions.push({
            type: 'weakness',
            title: 'Experience Gap',
            description: expWeakness.description,
            action: 'Consider adding quantified achievements that address this weakness',
            priority: 'medium'
          });
        }
        break;

      case 'project':
        // Check project relevance
        const projectTitle = itemData.title?.toLowerCase() || '';
        const projectTech = (itemData.technologies || []).map((t: string) => t.toLowerCase());

        // Check alignment with job requirements
        const projectAlignRequirements = jobAnalysis.missing_requirements?.some(req =>
          projectTitle.includes(req.toLowerCase()) || 
          projectTech.some((tech: string) => tech.includes(req.toLowerCase()))
        );

        if (projectAlignRequirements) {
          suggestions.push({
            type: 'enhancement',
            title: 'Highly Relevant Project',
            description: 'This project showcases skills mentioned in the job requirements. Consider adding more technical details and impact metrics.',
            priority: 'high'
          });
        }

        // Suggest missing technologies
        const missingProjectTech = jobAnalysis.missing_requirements?.filter(req =>
          req.toLowerCase().includes('technology') || req.toLowerCase().includes('framework')
        );

        if (missingProjectTech && missingProjectTech.length > 0) {
          suggestions.push({
            type: 'missing_requirement',
            title: 'Add Missing Technologies',
            description: `Consider if this project used: ${missingProjectTech.slice(0, 3).join(', ')}`,
            action: 'Update technology stack or contributions to highlight these skills',
            priority: 'medium'
          });
        }
        break;
    }

    // Add general optimization tips if no specific suggestions
    if (suggestions.length === 0) {
      suggestions.push({
        type: 'enhancement',
        title: 'General Optimization',
        description: 'This item looks good! Consider adding more specific metrics, quantified results, or industry-relevant keywords to make it stand out.',
        priority: 'low'
      });
    }

    return suggestions;
  };

  // Show optimization popup
  const showOptimizationPopup = (event: React.MouseEvent, itemType: 'skill' | 'experience' | 'project' | 'education', itemData: any, itemId: string) => {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const suggestions = generateOptimizationSuggestions(itemType, itemData);

    // Calculate popup position with screen boundary checks
    const popupWidth = 320; // w-80 = 320px
    const popupHeight = 400; // estimated max height
    let x = rect.right + 10;
    let y = rect.top;

    // Adjust if popup would go off-screen horizontally
    if (x + popupWidth > window.innerWidth) {
      x = rect.left - popupWidth - 10; // Show on left side instead
    }

    // Adjust if popup would go off-screen vertically
    if (y + popupHeight > window.innerHeight) {
      y = window.innerHeight - popupHeight - 10;
    }

    // Ensure popup doesn't go above viewport
    if (y < 10) {
      y = 10;
    }

    setPopupState({
      show: true,
      x,
      y,
      suggestions,
      itemType,
      itemId
    });
  };
  // Get unified skills list (flatten all categories)
  const getUnifiedSkills = (): string[] => {
    const skillsSection = optimizedSections.find(section => section.id === 'skills' && section.type === 'nested_list') as any;
    if (!skillsSection) return [];

    const allSkills: string[] = [];
    skillsSection.categories?.forEach((category: any) => {
      if (category && category.items && Array.isArray(category.items)) {
        // Filter out null, undefined, or empty string values
        const validSkills = category.items.filter((skill: any) =>
          skill && typeof skill === 'string' && skill.trim().length > 0
        );
        allSkills.push(...validSkills);
      }
    });
    return allSkills;
  };
  // Get skill categorization based on job analysis (simplified to 3 categories)
  const getSkillCategory = (skill: string): 'match' | 'missing' | 'neutral' => {
    // Add safety checks for skill parameter
    if (!skill || typeof skill !== 'string' || !jobAnalysis) return 'neutral';

    const skillLower = skill.toLowerCase();

    // Check if skill matches job requirements
    const isMatch = jobAnalysis.matches?.some(match => {
      if (!match) return false;

      // Handle both old format (object with description/category) and new format (string)
      if (typeof match === 'string') {
        return match.toLowerCase().includes(skillLower) || skillLower.includes(match.toLowerCase());
      } else {
        return (match.description && match.description.toLowerCase().includes(skillLower)) ||
               (match.category && match.category.toLowerCase().includes(skillLower)) ||
               (match.skill && match.skill.toLowerCase().includes(skillLower));
      }
    });
    if (isMatch) return 'match';

    // Check if skill is missing/recommended
    const isMissing = jobAnalysis.missing?.some(missing => {
      if (!missing) return false;

      // Handle both old format (object with description/category) and new format (string)
      if (typeof missing === 'string') {
        return missing.toLowerCase().includes(skillLower) || skillLower.includes(missing.toLowerCase());
      } else {
        return (missing.description && missing.description.toLowerCase().includes(skillLower)) ||
               (missing.category && missing.category.toLowerCase().includes(skillLower)) ||
               (missing.skill && missing.skill.toLowerCase().includes(skillLower));
      }
    });
    if (isMissing) return 'missing';

    // All other skills are neutral (neither match nor missing)
    return 'neutral';
  };

  // Get skill categorization for current CV skills (never shows missing)
  const getCurrentSkillCategory = (skill: string): 'match' | 'neutral' => {
    // Add safety checks for skill parameter
    if (!skill || typeof skill !== 'string' || !jobAnalysis) return 'neutral';

    const skillLower = skill.toLowerCase();

    // Check if skill matches job requirements
    const isMatch = jobAnalysis.matches?.some(match => {
      if (!match) return false;

      // Handle both old format (object with description/category) and new format (string)
      if (typeof match === 'string') {
        return match.toLowerCase().includes(skillLower) || skillLower.includes(match.toLowerCase());
      } else {
        return (match.description && match.description.toLowerCase().includes(skillLower)) ||
               (match.category && match.category.toLowerCase().includes(skillLower)) ||
               (match.skill && match.skill.toLowerCase().includes(skillLower));
      }
    });
    if (isMatch) return 'match';

    // For current skills, everything else is neutral (never missing since it's already in CV)
    return 'neutral';
  };

  // Get skill color for current CV skills (only match or neutral)
  const getCurrentSkillColor = (category: 'match' | 'neutral'): string => {
    switch (category) {
      case 'match':
        return 'border-green-500 bg-green-50 text-green-800 hover:bg-green-100';
      default:
        return 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100';
    }
  };  // Add skill to unified skills list
  const addSkillToCV = (skillToAdd: SkillToAdd) => {
    const skillsSection = optimizedSections.find(section => section.id === 'skills' && section.type === 'nested_list') as any;
    if (!skillsSection) return;

    const updatedSections = [...optimizedSections];
    const sectionIndex = updatedSections.findIndex(s => s.id === 'skills');
    
    if (sectionIndex !== -1) {
      const section = updatedSections[sectionIndex] as any;
      
      // Create a single "Skills" category if none exists
      if (!section.categories || section.categories.length === 0) {
        section.categories = [{
          id: 'unified_skills',
          name: 'Skills',
          items: []
        }];
      }
      
      // Add to the first (unified) category if not already present
      const unifiedCategory = section.categories[0];
      if (!unifiedCategory.items.includes(skillToAdd.name)) {
        unifiedCategory.items.push(skillToAdd.name);
        
        setOptimizedSections(updatedSections);
        
        // Remove the skill from suggested skills list
        setSuggestedSkills(prevSkills => 
          prevSkills.filter(skill => skill.name !== skillToAdd.name)
        );
          // Track change
        const change: OptimizationChange = {
          id: `add_skill_${Date.now()}`,
          type: 'add_skill',
          section: 'Skills',
          description: `Added "${skillToAdd.name}" - ${skillToAdd.reason}`,
          applied: true
        };
        setAppliedChanges(prev => [...prev, change]);
        
        // Show notification
        showNotification(`Added "${skillToAdd.name}" to your CV skills`, 'success');
      }
    }
  };
  // Remove skill from unified list
  const removeSkillFromCV = (skillIndex: number) => {
    const skillsSection = optimizedSections.find(section => section.id === 'skills' && section.type === 'nested_list') as any;
    if (!skillsSection) return;

    // Get the unified skills list to find the actual skill name
    const currentUnifiedSkills = getUnifiedSkills();
    if (skillIndex < 0 || skillIndex >= currentUnifiedSkills.length) {
      console.error('Invalid skill index:', skillIndex);
      return;
    }

    const skillName = currentUnifiedSkills[skillIndex];
    if (!skillName || typeof skillName !== 'string') {
      console.error('Invalid skill name:', skillName);
      return;
    }

    const updatedSections = [...optimizedSections];
    const sectionIndex = updatedSections.findIndex(s => s.id === 'skills');

    if (sectionIndex !== -1) {
      const section = updatedSections[sectionIndex] as any;

      // Find and remove the skill from the appropriate category
      let skillRemoved = false;
      if (section.categories && Array.isArray(section.categories)) {
        for (const category of section.categories) {
          if (category.items && Array.isArray(category.items)) {
            const skillIndexInCategory = category.items.indexOf(skillName);
            if (skillIndexInCategory !== -1) {
              category.items.splice(skillIndexInCategory, 1);
              skillRemoved = true;
              break;
            }
          }
        }
      }

      if (skillRemoved) {
        setOptimizedSections(updatedSections);

        // Check if the removed skill was originally a missing skill (using the original categorization)
        const originalSkillCategory = getSkillCategory(skillName);
        if (originalSkillCategory === 'missing') {
          // If it was originally missing, add it back to suggestions
          setSuggestedSkills(prevSkills => {
            // Only add if not already in suggestions
            if (!prevSkills.some(skill => skill.name.toLowerCase() === skillName.toLowerCase())) {
              return [...prevSkills, {
                name: skillName,
                reason: 'Missing skill that would improve your match rate',
                priority: 'high'
              }];
            }
            return prevSkills;
          });
        }
        // If it was neutral, it just gets removed completely (no action needed)

        // Track change
        const change: OptimizationChange = {
          id: `remove_skill_${Date.now()}`,
          type: 'remove_skill',
          section: 'Skills',
          description: `Removed "${skillName}"`,
          applied: true
        };
        setAppliedChanges(prev => [...prev, change]);
      } else {
        console.error('Skill not found in any category:', skillName);
      }
    }
  };
  // Update skill in unified list
  const updateSkillInCV = (skillIndex: number, newValue: string) => {
    const skillsSection = optimizedSections.find(section => section.id === 'skills' && section.type === 'nested_list') as any;
    if (!skillsSection) return;

    // Get the unified skills list to find the actual skill name
    const currentUnifiedSkills = getUnifiedSkills();
    if (skillIndex < 0 || skillIndex >= currentUnifiedSkills.length) {
      console.error('Invalid skill index:', skillIndex);
      return;
    }

    const oldSkill = currentUnifiedSkills[skillIndex];
    if (!oldSkill || typeof oldSkill !== 'string') {
      console.error('Invalid skill name:', oldSkill);
      return;
    }

    const updatedSections = [...optimizedSections];
    const sectionIndex = updatedSections.findIndex(s => s.id === 'skills');

    if (sectionIndex !== -1) {
      const section = updatedSections[sectionIndex] as any;

      // Find and update the skill in the appropriate category
      let skillUpdated = false;
      if (section.categories && Array.isArray(section.categories)) {
        for (const category of section.categories) {
          if (category.items && Array.isArray(category.items)) {
            const skillIndexInCategory = category.items.indexOf(oldSkill);
            if (skillIndexInCategory !== -1) {
              category.items[skillIndexInCategory] = newValue;
              skillUpdated = true;
              break;
            }
          }
        }
      }

      if (skillUpdated) {
        setOptimizedSections(updatedSections);

        // Track change
        const change: OptimizationChange = {
          id: `update_skill_${Date.now()}`,
          type: 'add_skill',
          section: 'Skills',
          description: `Updated "${oldSkill}" to "${newValue}"`,
          applied: true
        };
        setAppliedChanges(prev => [...prev, change]);
      } else {
        console.error('Skill not found in any category for update:', oldSkill);
      }
    }
  };
  // Add custom skill
  const addCustomSkill = () => {
    if (!newSkillInput.trim()) return;
    
    addSkillToCV({
      name: newSkillInput.trim(),
      reason: 'Manually added for job optimization',
      priority: 'medium'
    });
    
    setNewSkillInput('');  };

  // Remove experience item
  const removeExperienceItem = (itemIndex: number) => {
    const experienceSection = optimizedSections.find(section => section.id === 'experience' && section.type === 'list') as any;
    if (!experienceSection) return;

    const updatedSections = [...optimizedSections];
    const sectionIndex = updatedSections.findIndex(s => s.id === 'experience');
    
    if (sectionIndex !== -1) {
      const section = updatedSections[sectionIndex] as any;
      const removedItem = section.items[itemIndex];
      section.items.splice(itemIndex, 1);
      
      setOptimizedSections(updatedSections);
      
      // Track change
      const change: OptimizationChange = {
        id: `remove_experience_${Date.now()}`,
        type: 'modify_experience',
        section: 'Experience',
        description: `Removed experience: ${removedItem.title} at ${removedItem.company}`,
        applied: true
      };
      setAppliedChanges([...appliedChanges, change]);
    }
  };

  // Add achievement to specific experience item
  const addAchievementToExperience = (itemIndex: number, itemId: string) => {
    const achievement = newAchievements[itemId]?.trim();
    if (!achievement) return;

    const experienceSection = optimizedSections.find(section => section.id === 'experience' && section.type === 'list') as any;
    if (!experienceSection) return;

    const updatedSections = [...optimizedSections];
    const sectionIndex = updatedSections.findIndex(s => s.id === 'experience');
    
    if (sectionIndex !== -1) {
      const section = updatedSections[sectionIndex] as any;
      if (section.items[itemIndex]) {
        if (!section.items[itemIndex].achievements) {
          section.items[itemIndex].achievements = [];
        }
        section.items[itemIndex].achievements.push(achievement);
        
        setOptimizedSections(updatedSections);
        setNewAchievements({...newAchievements, [itemId]: ''});
        
        // Track change
        const change: OptimizationChange = {
          id: `add_achievement_${Date.now()}`,
          type: 'modify_experience',
          section: 'Experience',
          description: `Added achievement to ${section.items[itemIndex].title}: "${achievement}"`,
          applied: true
        };
        setAppliedChanges([...appliedChanges, change]);
      }
    }
  };
  // Remove achievement from specific experience item
  const removeAchievementFromExperience = (itemIndex: number, achievementIndex: number) => {
    const experienceSection = optimizedSections.find(section => section.id === 'experience' && section.type === 'list') as any;
    if (!experienceSection) return;

    const updatedSections = [...optimizedSections];
    const sectionIndex = updatedSections.findIndex(s => s.id === 'experience');
    
    if (sectionIndex !== -1) {
      const section = updatedSections[sectionIndex] as any;
      if (section.items[itemIndex] && section.items[itemIndex].achievements) {
        const removedAchievement = section.items[itemIndex].achievements[achievementIndex];
        section.items[itemIndex].achievements.splice(achievementIndex, 1);
        
        setOptimizedSections(updatedSections);
        
        // Track change
        const change: OptimizationChange = {
          id: `remove_achievement_${Date.now()}`,
          type: 'modify_experience',
          section: 'Experience',
          description: `Removed achievement from ${section.items[itemIndex].title}: "${removedAchievement}"`,
          applied: true
        };
        setAppliedChanges([...appliedChanges, change]);
      }
    }  };

  // Remove project item
  const removeProjectItem = (itemIndex: number) => {
    const projectsSection = optimizedSections.find(section => section.id === 'projects' && section.type === 'list') as any;
    if (!projectsSection) return;

    const updatedSections = [...optimizedSections];
    const sectionIndex = updatedSections.findIndex(s => s.id === 'projects');
    
    if (sectionIndex !== -1) {
      const section = updatedSections[sectionIndex] as any;
      const removedItem = section.items[itemIndex];
      section.items.splice(itemIndex, 1);
      
      setOptimizedSections(updatedSections);
      
      // Track change
      const change: OptimizationChange = {
        id: `remove_project_${Date.now()}`,
        type: 'add_project',
        section: 'Projects',
        description: `Removed project: ${removedItem.title}`,
        applied: true
      };
      setAppliedChanges([...appliedChanges, change]);
    }
  };

  // Add technology to specific project item
  const addTechnologyToProject = (itemIndex: number, itemId: string) => {
    const technology = newTechnologies[itemId]?.trim();
    if (!technology) return;

    const projectsSection = optimizedSections.find(section => section.id === 'projects' && section.type === 'list') as any;
    if (!projectsSection) return;

    const updatedSections = [...optimizedSections];
    const sectionIndex = updatedSections.findIndex(s => s.id === 'projects');
    
    if (sectionIndex !== -1) {
      const section = updatedSections[sectionIndex] as any;
      if (section.items[itemIndex]) {
        if (!section.items[itemIndex].technologies) {
          section.items[itemIndex].technologies = [];
        }
        section.items[itemIndex].technologies.push(technology);
        
        setOptimizedSections(updatedSections);
        setNewTechnologies({...newTechnologies, [itemId]: ''});
        
        // Track change
        const change: OptimizationChange = {
          id: `add_technology_${Date.now()}`,
          type: 'add_project',
          section: 'Projects',
          description: `Added technology to ${section.items[itemIndex].title}: "${technology}"`,
          applied: true
        };
        setAppliedChanges([...appliedChanges, change]);
      }
    }
  };

  // Remove technology from specific project item
  const removeTechnologyFromProject = (itemIndex: number, techIndex: number) => {
    const projectsSection = optimizedSections.find(section => section.id === 'projects' && section.type === 'list') as any;
    if (!projectsSection) return;

    const updatedSections = [...optimizedSections];
    const sectionIndex = updatedSections.findIndex(s => s.id === 'projects');
    
    if (sectionIndex !== -1) {
      const section = updatedSections[sectionIndex] as any;
      if (section.items[itemIndex] && section.items[itemIndex].technologies) {
        const removedTech = section.items[itemIndex].technologies[techIndex];
        section.items[itemIndex].technologies.splice(techIndex, 1);
        
        setOptimizedSections(updatedSections);
        
        // Track change
        const change: OptimizationChange = {
          id: `remove_technology_${Date.now()}`,
          type: 'add_project',
          section: 'Projects',
          description: `Removed technology from ${section.items[itemIndex].title}: "${removedTech}"`,
          applied: true
        };
        setAppliedChanges([...appliedChanges, change]);
      }
    }
  };

  // Add contribution to specific project item
  const addContributionToProject = (itemIndex: number, itemId: string) => {
    const contribution = newContributions[itemId]?.trim();
    if (!contribution) return;

    const projectsSection = optimizedSections.find(section => section.id === 'projects' && section.type === 'list') as any;
    if (!projectsSection) return;

    const updatedSections = [...optimizedSections];
    const sectionIndex = updatedSections.findIndex(s => s.id === 'projects');
    
    if (sectionIndex !== -1) {
      const section = updatedSections[sectionIndex] as any;
      if (section.items[itemIndex]) {
        if (!section.items[itemIndex].contributions) {
          section.items[itemIndex].contributions = [];
        }
        section.items[itemIndex].contributions.push(contribution);
        
        setOptimizedSections(updatedSections);
        setNewContributions({...newContributions, [itemId]: ''});
        
        // Track change
        const change: OptimizationChange = {
          id: `add_contribution_${Date.now()}`,
          type: 'add_project',
          section: 'Projects',
          description: `Added contribution to ${section.items[itemIndex].title}: "${contribution}"`,
          applied: true
        };
        setAppliedChanges([...appliedChanges, change]);
      }
    }
  };

  // Remove contribution from specific project item
  const removeContributionFromProject = (itemIndex: number, contIndex: number) => {
    const projectsSection = optimizedSections.find(section => section.id === 'projects' && section.type === 'list') as any;
    if (!projectsSection) return;

    const updatedSections = [...optimizedSections];
    const sectionIndex = updatedSections.findIndex(s => s.id === 'projects');
    
    if (sectionIndex !== -1) {
      const section = updatedSections[sectionIndex] as any;
      if (section.items[itemIndex] && section.items[itemIndex].contributions) {
        const removedContribution = section.items[itemIndex].contributions[contIndex];
        section.items[itemIndex].contributions.splice(contIndex, 1);
        
        setOptimizedSections(updatedSections);
        
        // Track change
        const change: OptimizationChange = {
          id: `remove_contribution_${Date.now()}`,
          type: 'add_project',
          section: 'Projects',
          description: `Removed contribution from ${section.items[itemIndex].title}: "${removedContribution}"`,
          applied: true
        };
        setAppliedChanges([...appliedChanges, change]);
      }
    }
  };

  // Undo change
  const undoChange = (changeId: string) => {
    setAppliedChanges(appliedChanges.map(change => 
      change.id === changeId ? {...change, applied: false} : change
    ));
  };

  // Handle optimization completion
  const handleOptimize = () => {
    onOptimize(optimizedSections, appliedChanges.filter(change => change.applied));
  };
  // Get the current unified skills
  const unifiedSkills = getUnifiedSkills();

  // Calculate dynamic CV match score based on current skills (simplified scoring)
  const calculateDynamicScore = () => {
    try {
      const currentSkills = getUnifiedSkills();
      const matchingSkills = currentSkills.filter(skill => {
        // Additional safety check
        if (!skill || typeof skill !== 'string') return false;
        return getSkillCategory(skill) === 'match';
      }).length;

      // Count skills that are still missing (not in current CV)
      const currentSkillsLower = currentSkills.map(skill => skill.toLowerCase());
      const stillMissingSkills = (jobAnalysis.missing || []).filter(missingSkill => {
        if (typeof missingSkill === 'string') {
          return !currentSkillsLower.includes(missingSkill.toLowerCase());
        }
        return true; // Keep non-string items for backward compatibility
      }).length;

      const totalRequired = matchingSkills + stillMissingSkills;

      if (totalRequired === 0) return { score: 100, matchRate: 100, level: 'PASS', color: '#16a34a' };

      const matchRate = (matchingSkills / totalRequired) * 100;
      // Simplified scoring: use match rate directly without weakness penalty for consistency with backend
      const finalScore = Math.round(matchRate);

      let level: string, color: string;
      if (matchRate >= 80) {
        level = 'PASS';
        color = '#16a34a';
      } else if (matchRate >= 60) {
        level = 'NEGOTIABLE';
        color = '#eab308';
      } else {
        level = 'NOT_RECOMMEND';
        color = '#dc2626';
      }

      return { score: finalScore, matchRate: Math.round(matchRate), level, color };
    } catch (error) {
      console.error('Error calculating dynamic score:', error);
      return { score: 0, matchRate: 0, level: 'NOT_RECOMMEND', color: '#dc2626' };
    }
  };

  const dynamicScore = calculateDynamicScore();

  // Animated counter component
  const AnimatedCounter = ({ value, duration = 1000 }: { value: number; duration?: number }) => {
    const [displayValue, setDisplayValue] = useState(previousScore || 0);

    useEffect(() => {
      const startValue = displayValue;
      const endValue = value;
      const startTime = Date.now();

      const updateValue = () => {
        const now = Date.now();
        const progress = Math.min((now - startTime) / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = Math.round(startValue + (endValue - startValue) * easeOutQuart);

        setDisplayValue(currentValue);

        if (progress < 1) {
          requestAnimationFrame(updateValue);
        }
      };

      requestAnimationFrame(updateValue);
    }, [value, duration]);

    return <span>{displayValue}</span>;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Enhanced Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="flex items-center justify-center gap-3">
          <motion.div
            animate={{ rotate: scoreImprovement ? 360 : 0 }}
            transition={{ duration: 0.6 }}
          >
            <Sparkles className="h-8 w-8 text-blue-600" />
          </motion.div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            CV Optimization Studio
          </h2>
          <motion.div
            animate={{ rotate: scoreImprovement ? -360 : 0 }}
            transition={{ duration: 0.6 }}
          >
            <Target className="h-8 w-8 text-purple-600" />
          </motion.div>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Transform your CV with AI-powered suggestions. Watch your job match score improve in real-time as you optimize each section.
        </p>

        {/* Progress Summary */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center gap-6 mt-6"
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full">
            <Zap className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">
              {completedOptimizations} optimizations applied
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">
              {appliedChanges.filter(c => c.applied).length} improvements made
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* Enhanced Section Navigation Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative"
      >
        <div className="flex justify-center">
          <div className="flex gap-1 p-1 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl shadow-inner">
            {[
              { id: 'skills' as const, label: 'Skills', icon: Award, color: 'from-green-500 to-emerald-600' },
              { id: 'experience' as const, label: 'Experience', icon: Briefcase, color: 'from-blue-500 to-cyan-600' },
              { id: 'projects' as const, label: 'Projects', icon: FileText, color: 'from-purple-500 to-violet-600' }
            ].map((tab) => (
              <motion.button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-3 px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                }`}
                whileHover={{ scale: activeTab === tab.id ? 1.05 : 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className={`absolute inset-0 bg-gradient-to-r ${tab.color} rounded-lg`}
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <div className="relative z-10 flex items-center gap-2">
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                  {activeTab === tab.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 bg-white rounded-full"
                    />
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>      {/* Enhanced CV Grade Display - Dynamic Score */}
      {jobAnalysis.overall_grade && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-2 border-blue-200 shadow-xl">
            <CardContent className="p-8">
              <div className="flex items-center justify-center gap-8">
                {/* Enhanced Grade Circle with Animations */}
                <motion.div
                  className={`relative w-40 h-40 rounded-full border-8 flex items-center justify-center shadow-lg ${
                    dynamicScore.level === 'PASS' ? 'border-green-500 bg-gradient-to-br from-green-100 to-green-200' :
                    dynamicScore.level === 'NEGOTIABLE' ? 'border-yellow-500 bg-gradient-to-br from-yellow-100 to-yellow-200' :
                    'border-red-500 bg-gradient-to-br from-red-100 to-red-200'
                  }`}
                  animate={{
                    scale: scoreImprovement ? [1, 1.1, 1] : 1,
                    boxShadow: scoreImprovement ? [
                      "0 0 0 0 rgba(59, 130, 246, 0.7)",
                      "0 0 0 10px rgba(59, 130, 246, 0)",
                      "0 0 0 0 rgba(59, 130, 246, 0)"
                    ] : "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                  }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="text-center">
                    <motion.div
                      className={`text-xl font-bold ${
                        dynamicScore.level === 'PASS' ? 'text-green-700' :
                        dynamicScore.level === 'NEGOTIABLE' ? 'text-yellow-700' :
                        'text-red-700'
                      }`}
                      animate={{ scale: scoreImprovement ? [1, 1.2, 1] : 1 }}
                      transition={{ duration: 0.4 }}
                    >
                      {dynamicScore.level}
                    </motion.div>
                    <div className={`text-lg font-semibold ${
                      dynamicScore.level === 'PASS' ? 'text-green-600' :
                      dynamicScore.level === 'NEGOTIABLE' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      <AnimatedCounter value={dynamicScore.score} />/100
                    </div>
                  </div>

                  {/* Enhanced Progress Ring with Animation */}
                  <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="6"
                      className="text-gray-200"
                    />
                    <motion.circle
                      cx="80"
                      cy="80"
                      r="70"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="6"
                      strokeLinecap="round"
                      className={
                        dynamicScore.level === 'PASS' ? 'text-green-500' :
                        dynamicScore.level === 'NEGOTIABLE' ? 'text-yellow-500' :
                        'text-red-500'
                      }
                      initial={{ strokeDasharray: "0 440" }}
                      animate={{
                        strokeDasharray: `${(dynamicScore.score / 100) * 440} 440`,
                        filter: scoreImprovement ? "drop-shadow(0 0 8px currentColor)" : "none"
                      }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  </svg>
                </motion.div>

                {/* Enhanced Grade Details */}
                <div className="flex-1 space-y-4">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      CV Match Score
                      <motion.span
                        className="text-sm font-normal text-gray-500 ml-2"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        (Live Updates)
                      </motion.span>
                    </h3>
                  </motion.div>

                  <motion.p
                    className="text-gray-700 text-lg leading-relaxed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    {dynamicScore.level === 'PASS' ?
                      `🎉 Excellent match! ${dynamicScore.matchRate}% of required skills found in your CV.` :
                      dynamicScore.level === 'NEGOTIABLE' ?
                      `⚡ Good potential (${dynamicScore.matchRate}% match). Address missing requirements to strengthen your application.` :
                      `🎯 Significant gaps found (${dynamicScore.matchRate}% match). Consider developing missing skills before applying.`
                    }
                  </motion.p>

                  <motion.div
                    className="flex flex-wrap items-center gap-4 text-sm"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-full">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium text-green-700">
                        Skills Match ({unifiedSkills.filter(skill => skill && typeof skill === 'string' && getSkillCategory(skill) === 'match').length})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-full">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="font-medium text-red-700">
                        Missing ({jobAnalysis.missing?.length || 0})
                      </span>
                    </div>
                    <AnimatePresence>
                      {appliedChanges.filter(c => c.applied && c.type === 'add_skill').length > 0 && (
                        <motion.div
                          className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-full"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                        >
                          <motion.div
                            className="w-3 h-3 bg-blue-500 rounded-full"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          />
                          <span className="text-blue-600 font-medium">
                            +{appliedChanges.filter(c => c.applied && c.type === 'add_skill').length} skills added
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Skills Section */}
      {activeTab === 'skills' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Skills Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit3 className="h-5 w-5" />
                Current Skills (Color-Coded)
              </CardTitle>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded border border-green-600"></div>
                    <span>Job Match</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded border border-red-600"></div>
                    <span>Missing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-400 rounded border border-gray-500"></div>
                    <span>Neutral</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {unifiedSkills
                  .filter(skill => skill && typeof skill === 'string' && skill.trim().length > 0)
                  .map((skill: string, skillIndex: number) => {
                  const skillCategory = getCurrentSkillCategory(skill);
                  const skillColorClass = getCurrentSkillColor(skillCategory);
                  
                  return (
                    <div key={skillIndex} className="group relative">
                      {editingSkill?.index === skillIndex ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editingSkill.value}
                            onChange={(e) => setEditingSkill({...editingSkill, value: e.target.value})}
                            className="px-2 py-1 text-xs border rounded"
                            placeholder="Edit skill name"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                updateSkillInCV(skillIndex, editingSkill.value);
                                setEditingSkill(null);
                              }
                              if (e.key === 'Escape') {
                                setEditingSkill(null);
                              }
                            }}
                            autoFocus
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              updateSkillInCV(skillIndex, editingSkill.value);
                              setEditingSkill(null);
                            }}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingSkill(null)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (                        <div
                          className={`cursor-pointer group relative px-3 py-1 rounded-full text-sm font-medium border-2 transition-all duration-200 ${skillColorClass} ${
                            appliedChanges.some(change => 
                              change.applied && 
                              change.type === 'add_skill' && 
                              change.description.includes(skill)
                            ) ? 'ring-2 ring-blue-300 animate-pulse' : ''
                          }`}
                          onClick={() => setEditingSkill({index: skillIndex, value: skill})}
                          onContextMenu={(e) => showOptimizationPopup(e, 'skill', skill, `skill_${skillIndex}`)}
                          title={`${skill} - ${skillCategory === 'match' ? 'Matches job requirements' : 'Neutral skill'}`}
                        >
                          {skill}
                          <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-4 w-4 p-0 hover:bg-blue-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                showOptimizationPopup(e, 'skill', skill, `skill_${skillIndex}`);
                              }}
                              title="Show optimization suggestions"
                            >
                              <Edit3 className="h-3 w-3 text-blue-500" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-4 w-4 p-0 hover:bg-red-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeSkillFromCV(skillIndex);
                              }}
                            >
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Add custom skill */}
              <div className="border-t pt-4 space-y-2">
                <h4 className="font-medium text-gray-700">Add Custom Skill</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Skill name"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-md text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && addCustomSkill()}
                  />
                  <Button onClick={addCustomSkill} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Suggested Skills from Job Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Suggested Skills for This Job
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">              <AnimatePresence mode="popLayout">
                {suggestedSkills.length > 0 ? (
                  suggestedSkills.map((skillSuggestion, index) => (
                    <motion.div
                      key={`${skillSuggestion.name}-${index}`}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -100, scale: 0.95 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      layout
                      className="group border rounded-xl p-4 space-y-3 hover:border-blue-300 hover:shadow-md transition-all duration-300 bg-gradient-to-r from-white to-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Badge
                              variant={skillSuggestion.priority === 'high' ? 'destructive' : skillSuggestion.priority === 'medium' ? 'default' : 'secondary'}
                              className="text-xs font-semibold"
                            >
                              {skillSuggestion.priority === 'high' ? '🔥 HIGH' : skillSuggestion.priority === 'medium' ? '⚡ MED' : '💡 LOW'}
                            </Badge>
                          </motion.div>
                          <span className="font-semibold text-gray-800">{skillSuggestion.name}</span>
                        </div>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            size="sm"
                            onClick={() => addSkillToCVWithAnimation(skillSuggestion)}
                            variant="outline"
                            className="hover:bg-green-50 hover:border-green-500 hover:text-green-700 transition-all duration-200 group-hover:shadow-sm"
                          >
                            <motion.div
                              animate={animatingItems.has(skillSuggestion.name) ? { rotate: 360 } : {}}
                              transition={{ duration: 0.5 }}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                            </motion.div>
                            Add
                          </Button>
                        </motion.div>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{skillSuggestion.reason}</p>
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    className="text-center py-12"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <motion.div
                      className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center shadow-lg"
                      animate={{
                        scale: [1, 1.1, 1],
                        boxShadow: [
                          "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                          "0 10px 15px -3px rgba(34, 197, 94, 0.3)",
                          "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Check className="h-10 w-10 text-green-600" />
                    </motion.div>
                    <motion.p
                      className="text-gray-700 font-semibold text-lg mb-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      🎉 All suggested skills have been added!
                    </motion.p>
                    <motion.p
                      className="text-sm text-gray-500"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      Your CV now includes the key skills for this job
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence></CardContent>
          </Card>
        </div>
      )}

      {/* Skills Breakdown Display */}
      {activeTab === 'skills' && jobAnalysis.overall_grade && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Skills Analysis Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Skills Match */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <h4 className="font-semibold text-green-800">Skills Match</h4>
                  <span className="text-sm text-green-600">
                    ({unifiedSkills.filter(skill => skill && typeof skill === 'string' && getSkillCategory(skill) === 'match').length})
                  </span>
                </div>
                <div className="space-y-2">
                  {unifiedSkills.filter(skill => skill && typeof skill === 'string' && getSkillCategory(skill) === 'match').length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {unifiedSkills
                        .filter(skill => skill && typeof skill === 'string' && getSkillCategory(skill) === 'match')
                        .slice(0, 8)
                        .map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      {unifiedSkills.filter(skill => skill && typeof skill === 'string' && getSkillCategory(skill) === 'match').length > 8 && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          +{unifiedSkills.filter(skill => skill && typeof skill === 'string' && getSkillCategory(skill) === 'match').length - 8} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-green-600">No matching skills found</p>
                  )}
                  <p className="text-xs text-green-700 mt-2">
                    These skills align perfectly with job requirements
                  </p>
                </div>
              </div>

              {/* Neutral Skills */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
                  <h4 className="font-semibold text-gray-800">Neutral Skills</h4>
                  <span className="text-sm text-gray-600">
                    ({unifiedSkills.filter(skill => skill && typeof skill === 'string' && getSkillCategory(skill) === 'neutral').length})
                  </span>
                </div>
                <div className="space-y-2">
                  {unifiedSkills.filter(skill => skill && typeof skill === 'string' && getSkillCategory(skill) === 'neutral').length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {unifiedSkills
                        .filter(skill => skill && typeof skill === 'string' && getSkillCategory(skill) === 'neutral')
                        .slice(0, 8)
                        .map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      {unifiedSkills.filter(skill => skill && typeof skill === 'string' && getSkillCategory(skill) === 'neutral').length > 8 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                          +{unifiedSkills.filter(skill => skill && typeof skill === 'string' && getSkillCategory(skill) === 'neutral').length - 8} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">All skills are categorized</p>
                  )}
                  <p className="text-xs text-gray-700 mt-2">
                    Additional skills not specifically required
                  </p>
                </div>
              </div>

              {/* Missing Skills */}
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <h4 className="font-semibold text-red-800">Missing Skills</h4>
                  <span className="text-sm text-red-600">
                    ({(() => {
                      const currentSkills = getUnifiedSkills();
                      const currentSkillsLower = currentSkills.map(skill => skill.toLowerCase());
                      return (jobAnalysis.missing || []).filter(missingSkill => {
                        if (typeof missingSkill === 'string') {
                          return !currentSkillsLower.includes(missingSkill.toLowerCase());
                        }
                        return true;
                      }).length;
                    })()})
                  </span>
                </div>
                <div className="space-y-2">
                  {(() => {
                    const currentSkills = getUnifiedSkills();
                    const currentSkillsLower = currentSkills.map(skill => skill.toLowerCase());
                    const actuallyMissingSkills = (jobAnalysis.missing || []).filter(missingSkill => {
                      if (typeof missingSkill === 'string') {
                        return !currentSkillsLower.includes(missingSkill.toLowerCase());
                      }
                      return true;
                    });

                    return actuallyMissingSkills.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {actuallyMissingSkills
                          .slice(0, 8)
                          .map((missing, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full"
                              title={typeof missing === 'string' ? missing : missing.description}
                            >
                              {typeof missing === 'string' ? missing : (missing.skill || missing.category)}
                            </span>
                          ))}
                        {actuallyMissingSkills.length > 8 && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                            +{actuallyMissingSkills.length - 8} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-red-600">No missing skills identified</p>
                    );
                  })()}
                  <p className="text-xs text-red-700 mt-2">
                    Consider learning these skills to improve your match
                  </p>
                </div>
              </div>
            </div>            {/* Skills Summary Stats - Dynamic Updates */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-3">
                Skills Summary 
                <span className="text-sm font-normal text-gray-500 ml-2">(Updates in real-time)</span>
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{unifiedSkills.length}</div>
                  <div className="text-sm text-gray-600">Total Skills</div>
                </div>                <div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="text-2xl font-bold text-green-600">
                      {unifiedSkills.filter(skill => skill && typeof skill === 'string' && getSkillCategory(skill) === 'match').length}
                    </div>
                    {appliedChanges.filter(c => c.applied && c.type === 'add_skill').length > 0 && (
                      <div className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full animate-pulse">
                        +{appliedChanges.filter(c => c.applied && c.type === 'add_skill').length}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">Matching</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {(() => {
                      const currentSkills = getUnifiedSkills();
                      const currentSkillsLower = currentSkills.map(skill => skill.toLowerCase());
                      return (jobAnalysis.missing || []).filter(missingSkill => {
                        if (typeof missingSkill === 'string') {
                          return !currentSkillsLower.includes(missingSkill.toLowerCase());
                        }
                        return true;
                      }).length;
                    })()}
                  </div>
                  <div className="text-sm text-gray-600">Missing</div>
                </div>                <div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="text-2xl font-bold text-blue-600">
                      {dynamicScore.matchRate}%
                    </div>
                    {appliedChanges.filter(c => c.applied && c.type === 'add_skill').length > 0 && (
                      <div className="text-xs text-green-600">
                        ↗
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">Match Rate</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Experience Section */}
      {activeTab === 'experience' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Experience Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit3 className="h-5 w-5" />
                Current Experience
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const experienceSection = optimizedSections.find(section => section.id === 'experience' && section.type === 'list') as any;
                const experienceItems = experienceSection?.items || [];
                
                return experienceItems.length > 0 ? (
                  experienceItems.map((item: any, itemIndex: number) => (                    <div key={item.id || itemIndex} className="border rounded-lg p-4 space-y-3 hover:border-blue-300 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-800">{item.title || 'Job Title'}</h4>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-blue-600 hover:bg-blue-50 p-1 h-auto"
                              onClick={(e) => showOptimizationPopup(e, 'experience', item, `experience_${itemIndex}`)}
                              title="Show optimization suggestions for this experience"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-sm text-gray-600">{item.company || 'Company'}</p>
                          <p className="text-xs text-gray-500">{item.start_date} - {item.end_date || 'Present'}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeExperienceItem(itemIndex)}
                          className="text-red-500 hover:bg-red-50"
                          title="Remove this experience"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                        {/* Achievements for this experience */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Achievements:</label>
                        <div className="space-y-1">
                          {(Array.isArray(item.achievements) ? item.achievements : []).map((achievement: string, achIndex: number) => (
                            <div key={achIndex} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                              <span className="flex-1 text-sm">{achievement}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeAchievementFromExperience(itemIndex, achIndex)}
                                className="text-red-500 hover:bg-red-100 h-6 w-6 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                          
                          {/* Add new achievement */}
                          <div className="flex gap-2 mt-2">
                            <input
                              type="text"
                              placeholder="Add new achievement"
                              className="flex-1 px-2 py-1 text-sm border rounded"
                              value={newAchievements[item.id] || ''}
                              onChange={(e) => setNewAchievements({...newAchievements, [item.id]: e.target.value})}
                              onKeyDown={(e) => e.key === 'Enter' && addAchievementToExperience(itemIndex, item.id)}
                            />
                            <Button
                              size="sm"
                              onClick={() => addAchievementToExperience(itemIndex, item.id)}
                              disabled={!newAchievements[item.id]?.trim()}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No experience items found. Add experience through suggestions.
                  </p>
                );
              })()}
            </CardContent>
          </Card>          {/* Experience Analysis & Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Experience Analysis for This Job
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Missing Requirements */}
                {jobAnalysis.missing_requirements && jobAnalysis.missing_requirements.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-red-700 flex items-center gap-2">
                      <X className="h-4 w-4" />
                      Missing Requirements
                    </h4>
                    <div className="space-y-2">
                      {jobAnalysis.missing_requirements.slice(0, 3).map((req, index) => (
                        <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-800">{req}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}                {/* Experience Weaknesses */}
                {jobAnalysis.weaknesses && jobAnalysis.weaknesses.filter(w => w.category?.toLowerCase().includes('experience')).length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-orange-700 flex items-center gap-2">
                      <Edit3 className="h-4 w-4" />
                      Experience Improvement Areas
                    </h4>
                    <div className="space-y-2">
                      {jobAnalysis.weaknesses
                        .filter(w => w.category?.toLowerCase().includes('experience'))
                        .slice(0, 3)
                        .map((weakness, index) => (
                          <div key={index} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <p className="text-sm text-orange-800">{weakness.description}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Experience Analysis */}
                {jobAnalysis.experience_analysis && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-purple-700 flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Experience Requirements Analysis
                    </h4>
                    <div className="space-y-3">
                      {/* Experience Summary */}
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-purple-800">Your Experience</span>
                          <span className="text-sm text-purple-700">
                            {jobAnalysis.experience_analysis.candidate_total_experience.years} years 
                            ({jobAnalysis.experience_analysis.candidate_total_experience.level})
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-purple-800">Job Requirement</span>
                          <span className="text-sm text-purple-700">
                            {jobAnalysis.experience_analysis.job_requirements.minimum_years}+ years 
                            ({jobAnalysis.experience_analysis.job_requirements.seniority_level})
                          </span>
                        </div>
                        <div className="mt-2 text-center">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            jobAnalysis.experience_analysis.experience_analysis.meets_minimum 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {jobAnalysis.experience_analysis.experience_analysis.meets_minimum ? '✓ Meets Requirements' : '⚠ Experience Gap'}
                          </span>
                        </div>
                      </div>

                      {/* Experience Gaps */}
                      {jobAnalysis.experience_analysis.experience_analysis.gaps.length > 0 && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm font-medium text-red-800 mb-2">Experience Gaps:</p>
                          <ul className="text-sm text-red-700 space-y-1">
                            {jobAnalysis.experience_analysis.experience_analysis.gaps.slice(0, 3).map((gap, index) => (
                              <li key={index}>• {gap}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Experience Strengths */}
                      {jobAnalysis.experience_analysis.experience_analysis.strengths.length > 0 && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm font-medium text-green-800 mb-2">Experience Strengths:</p>
                          <ul className="text-sm text-green-700 space-y-1">
                            {jobAnalysis.experience_analysis.experience_analysis.strengths.slice(0, 3).map((strength, index) => (
                              <li key={index}>• {strength}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Experience Recommendations */}
                      {jobAnalysis.experience_analysis.experience_analysis.recommendations.length > 0 && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm font-medium text-blue-800 mb-2">Recommendations:</p>
                          <ul className="text-sm text-blue-700 space-y-1">
                            {jobAnalysis.experience_analysis.experience_analysis.recommendations.slice(0, 3).map((rec, index) => (
                              <li key={index}>• {rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* General Tips */}
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-700 flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Experience Optimization Tips
                  </h4>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="font-medium text-blue-800">Quantify Achievements</p>
                      <p>Use numbers, percentages, and metrics to show your impact.</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="font-medium text-green-800">Action Words</p>
                      <p>Start bullet points with strong action verbs like "Led", "Implemented", "Optimized".</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="font-medium text-purple-800">Relevance</p>
                      <p>Focus on experiences most relevant to the target job role.</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}      {/* Projects Section */}
      {activeTab === 'projects' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Projects */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit3 className="h-5 w-5" />
                Current Projects
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const projectsSection = optimizedSections.find(section => section.id === 'projects' && section.type === 'list') as any;
                const projectItems = projectsSection?.items || [];
                
                return projectItems.length > 0 ? (
                  projectItems.map((item: any, itemIndex: number) => (                    <div key={item.id || itemIndex} className="border rounded-lg p-4 space-y-3 hover:border-blue-300 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-800">{item.title || 'Project Title'}</h4>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-blue-600 hover:bg-blue-50 p-1 h-auto"
                              onClick={(e) => showOptimizationPopup(e, 'project', item, `project_${itemIndex}`)}
                              title="Show optimization suggestions for this project"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-sm text-gray-600">{item.description || 'Project description'}</p>
                          <p className="text-xs text-gray-500">{item.start_date} - {item.end_date || 'Present'}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeProjectItem(itemIndex)}
                          className="text-red-500 hover:bg-red-50"
                          title="Remove this project"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                        {/* Technologies for this project */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Technologies:</label>
                        <div className="flex flex-wrap gap-1">
                          {(Array.isArray(item.technologies) ? item.technologies : []).map((tech: string, techIndex: number) => (
                            <Badge key={techIndex} variant="outline" className="text-xs">
                              {tech}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeTechnologyFromProject(itemIndex, techIndex)}
                                className="ml-1 h-3 w-3 p-0 text-red-500 hover:bg-red-100"
                              >
                                <X className="h-2 w-2" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                        
                        {/* Add new technology */}
                        <div className="flex gap-2 mt-2">
                          <input
                            type="text"
                            placeholder="Add technology"
                            className="flex-1 px-2 py-1 text-sm border rounded"
                            value={newTechnologies[item.id] || ''}
                            onChange={(e) => setNewTechnologies({...newTechnologies, [item.id]: e.target.value})}
                            onKeyDown={(e) => e.key === 'Enter' && addTechnologyToProject(itemIndex, item.id)}
                          />
                          <Button
                            size="sm"
                            onClick={() => addTechnologyToProject(itemIndex, item.id)}
                            disabled={!newTechnologies[item.id]?.trim()}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>                      {/* Contributions for this project */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Key Contributions:</label>
                        <div className="space-y-1">
                          {(Array.isArray(item.contributions) ? item.contributions : []).map((contribution: string, contIndex: number) => (
                            <div key={contIndex} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                              <span className="flex-1 text-sm">{contribution}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeContributionFromProject(itemIndex, contIndex)}
                                className="text-red-500 hover:bg-red-100 h-6 w-6 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                          
                          {/* Add new contribution */}
                          <div className="flex gap-2 mt-2">
                            <input
                              type="text"
                              placeholder="Add key contribution"
                              className="flex-1 px-2 py-1 text-sm border rounded"
                              value={newContributions[item.id] || ''}
                              onChange={(e) => setNewContributions({...newContributions, [item.id]: e.target.value})}
                              onKeyDown={(e) => e.key === 'Enter' && addContributionToProject(itemIndex, item.id)}
                            />
                            <Button
                              size="sm"
                              onClick={() => addContributionToProject(itemIndex, item.id)}
                              disabled={!newContributions[item.id]?.trim()}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No projects found. Add projects through suggestions.
                  </p>
                );
              })()}
            </CardContent>
          </Card>          {/* Project Analysis & Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Projects Analysis for This Job
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Missing Technical Skills */}
                {jobAnalysis.missing_requirements && jobAnalysis.missing_requirements.filter(req => 
                  req.toLowerCase().includes('technology') || 
                  req.toLowerCase().includes('framework') || 
                  req.toLowerCase().includes('programming')).length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-red-700 flex items-center gap-2">
                      <X className="h-4 w-4" />
                      Missing Technical Skills
                    </h4>
                    <div className="space-y-2">
                      {jobAnalysis.missing_requirements
                        .filter(req => 
                          req.toLowerCase().includes('technology') || 
                          req.toLowerCase().includes('framework') || 
                          req.toLowerCase().includes('programming'))
                        .slice(0, 3)
                        .map((req, index) => (
                          <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-800">{req}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Project Optimization Tips */}
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-700 flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Project Optimization Tips
                  </h4>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="font-medium text-blue-800">Technical Stack</p>
                      <p>Highlight technologies that match the job requirements.</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="font-medium text-green-800">Business Impact</p>
                      <p>Show how your projects solved real problems or added value.</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="font-medium text-purple-800">Links & Evidence</p>
                      <p>Include GitHub links, live demos, or portfolio showcases when possible.</p>
                    </div>
                  </div>
                </div>

                {/* Course Recommendations for Projects */}
                {jobAnalysis.recommended_courses && jobAnalysis.recommended_courses.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-green-700 flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Recommended Learning
                    </h4>
                    <div className="space-y-2">
                      {jobAnalysis.recommended_courses.slice(0, 2).map((course, index) => (
                        <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-green-800">{course.title}</span>
                            <Badge variant={course.is_free ? 'secondary' : 'outline'} className="text-xs">
                              {course.is_free ? 'Free' : 'Paid'}
                            </Badge>
                          </div>
                          <p className="text-sm text-green-700">{course.platform} • {course.estimated_time}</p>
                          <p className="text-sm text-gray-600">{course.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>        </div>      )}

      {/* Applied Changes Summary */}
      {appliedChanges.filter(change => change.applied).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Applied Optimizations ({appliedChanges.filter(c => c.applied).length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {appliedChanges.filter(change => change.applied).map(change => (
                <div key={change.id} className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                  <span className="text-sm">{change.description}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => undoChange(change.id)}
                  >
                    Undo
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}      {/* Enhanced Action Buttons */}
      <motion.div
        className="flex flex-col sm:flex-row justify-center items-center gap-6 pt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        {/* Progress Summary */}
        <motion.div
          className="flex items-center gap-4 text-sm text-gray-600"
          animate={{ opacity: appliedChanges.filter(c => c.applied).length > 0 ? 1 : 0.6 }}
        >
          <div className="flex items-center gap-2">
            <motion.div
              className="w-3 h-3 bg-blue-500 rounded-full"
              animate={{ scale: appliedChanges.filter(c => c.applied).length > 0 ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="font-medium">
              {appliedChanges.filter(c => c.applied).length} optimizations applied
            </span>
          </div>
        </motion.div>

        <div className="flex gap-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all duration-200"
            >
              <X className="h-4 w-4 mr-2" />
              Reset Changes
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={handleOptimize}
              disabled={isLoading}
              size="lg"
              className="min-w-[250px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isLoading ? (
                <motion.div
                  className="flex items-center gap-2"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="h-4 w-4" />
                  </motion.div>
                  Optimizing Your CV...
                </motion.div>
              ) : (
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Apply Optimizations & Continue
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    →
                  </motion.div>
                </div>
              )}
            </Button>
          </motion.div>
        </div>
      </motion.div>      {/* Optimization Suggestions Popup */}      {popupState.show && (
        <div
          ref={popupRef}
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-w-sm w-80"
          style={{
            left: `${popupState.x}px`,
            top: `${popupState.y}px`
          }}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Optimization Tips
              </h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPopupState(prev => ({ ...prev, show: false }))}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {popupState.suggestions.map((suggestion, index) => (
                <div key={index} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    {suggestion.type === 'weakness' && <AlertCircle className="h-4 w-4 text-red-500" />}
                    {suggestion.type === 'missing_requirement' && <X className="h-4 w-4 text-orange-500" />}
                    {suggestion.type === 'enhancement' && <TrendingUp className="h-4 w-4 text-blue-500" />}
                    {suggestion.type === 'course' && <BookOpen className="h-4 w-4 text-green-500" />}
                    <Badge 
                      variant={suggestion.priority === 'high' ? 'destructive' : suggestion.priority === 'medium' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {suggestion.priority}
                    </Badge>
                  </div>
                  
                  <h4 className="font-medium text-sm text-gray-800">{suggestion.title}</h4>
                  <p className="text-xs text-gray-600">{suggestion.description}</p>
                  
                  {suggestion.action && (
                    <div className="bg-blue-50 p-2 rounded text-xs text-blue-800">
                      <strong>Action:</strong> {suggestion.action}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-gray-500 text-center">
                Right-click or click the <Edit3 className="inline h-3 w-3" /> icon on any item for optimization tips
              </p>
            </div>          </div>
        </div>
      )}
      
      {/* Enhanced Notification Toast */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-xl border-l-4 max-w-sm backdrop-blur-sm ${
              notification.type === 'success' ? 'bg-green-50/90 border-green-500 text-green-800' :
              notification.type === 'warning' ? 'bg-yellow-50/90 border-yellow-500 text-yellow-800' :
              'bg-blue-50/90 border-blue-500 text-blue-800'
            }`}
          >
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: notification.type === 'success' ? [0, 360, 0] : 0
                }}
                transition={{ duration: 0.6 }}
              >
                {notification.type === 'success' && <Check className="h-5 w-5 text-green-600" />}
                {notification.type === 'warning' && <AlertCircle className="h-5 w-5 text-yellow-600" />}
                {notification.type === 'info' && <Award className="h-5 w-5 text-blue-600" />}
              </motion.div>
              <span className="font-semibold">{notification.message}</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InteractiveCVOptimizer;
