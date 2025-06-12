import React, { useState, useEffect, useRef } from 'react';
import { JobDescriptionAnalysis, EditableSection } from '../../types';
import { Button } from './button';
import { Card, CardHeader, CardTitle, CardContent } from './card';
import { Badge } from './badge';
import { Trash2, Plus, Edit3, Check, X, Award, Briefcase, FileText, AlertCircle, TrendingUp, BookOpen } from 'lucide-react';

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
  const popupRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Extract suggestions from job analysis
    const skills: SkillToAdd[] = [];
    const experiences: ExperienceToAdd[] = [];
    const projects: ProjectToAdd[] = [];

    // From missing requirements
    jobAnalysis.missing_requirements?.forEach((req) => {
      if (req.toLowerCase().includes('skill') || req.toLowerCase().includes('technology') || req.toLowerCase().includes('programming')) {
        skills.push({
          name: req,
          reason: 'Missing requirement from job description',
          priority: 'high'
        });
      }
    });

    // From recommended courses (extract skills that courses teach)
    jobAnalysis.recommended_courses?.forEach(course => {
      if (course.skill_addressed) {
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
  }, [jobAnalysis]);

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

  // Show notification
  const showNotification = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
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
    
    setPopupState({
      show: true,
      x: rect.right + 10,
      y: rect.top,
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
      if (category.items) {
        allSkills.push(...category.items);
      }
    });
    return allSkills;
  };
  // Get skill categorization based on job analysis
  const getSkillCategory = (skill: string): 'match' | 'not_needed' | 'missing' | 'neutral' => {
    if (!jobAnalysis) return 'neutral';
    
    // Check if skill matches job requirements
    const isMatch = jobAnalysis.matches?.some(match => {
      // Handle both old format (object with description/category) and new format (string)
      if (typeof match === 'string') {
        return match.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(match.toLowerCase());
      } else {
        return match.description?.toLowerCase().includes(skill.toLowerCase()) ||
               match.category?.toLowerCase().includes(skill.toLowerCase()) ||
               match.skill?.toLowerCase().includes(skill.toLowerCase());
      }
    });
    if (isMatch) return 'match';
    
    // Check if skill is not needed for the job
    const isNotNeeded = jobAnalysis.not_needed?.some(notNeeded => {
      // Handle both old format (object with description/category) and new format (string)
      if (typeof notNeeded === 'string') {
        return notNeeded.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(notNeeded.toLowerCase());
      } else {
        return notNeeded.description?.toLowerCase().includes(skill.toLowerCase()) ||
               notNeeded.category?.toLowerCase().includes(skill.toLowerCase()) ||
               notNeeded.skill?.toLowerCase().includes(skill.toLowerCase());
      }
    });
    if (isNotNeeded) return 'not_needed';
    
    // Check if skill is missing/recommended
    const isMissing = jobAnalysis.missing?.some(missing => {
      // Handle both old format (object with description/category) and new format (string)
      if (typeof missing === 'string') {
        return missing.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(missing.toLowerCase());
      } else {
        return missing.description?.toLowerCase().includes(skill.toLowerCase()) ||
               missing.category?.toLowerCase().includes(skill.toLowerCase()) ||
               missing.skill?.toLowerCase().includes(skill.toLowerCase());
      }
    });
    if (isMissing) return 'missing';
    
    return 'neutral';
  };

  // Get skill color based on category
  const getSkillColor = (category: 'match' | 'not_needed' | 'missing' | 'neutral'): string => {
    switch (category) {
      case 'match':
        return 'border-green-500 bg-green-50 text-green-800 hover:bg-green-100';
      case 'not_needed':
        return 'border-yellow-500 bg-yellow-50 text-yellow-800 hover:bg-yellow-100';
      case 'missing':
        return 'border-red-500 bg-red-50 text-red-800 hover:bg-red-100';
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

    const updatedSections = [...optimizedSections];
    const sectionIndex = updatedSections.findIndex(s => s.id === 'skills');
    
    if (sectionIndex !== -1) {
      const section = updatedSections[sectionIndex] as any;
      if (section.categories && section.categories[0] && section.categories[0].items) {
        const skillName = section.categories[0].items[skillIndex];
        section.categories[0].items.splice(skillIndex, 1);
        
        setOptimizedSections(updatedSections);
        
        // Track change
        const change: OptimizationChange = {
          id: `remove_skill_${Date.now()}`,
          type: 'remove_skill',
          section: 'Skills',
          description: `Removed "${skillName}" (not required for this job)`,
          applied: true
        };
        setAppliedChanges(prev => [...prev, change]);
      }
    }
  };
  // Update skill in unified list
  const updateSkillInCV = (skillIndex: number, newValue: string) => {
    const skillsSection = optimizedSections.find(section => section.id === 'skills' && section.type === 'nested_list') as any;
    if (!skillsSection) return;

    const updatedSections = [...optimizedSections];
    const sectionIndex = updatedSections.findIndex(s => s.id === 'skills');
    
    if (sectionIndex !== -1) {
      const section = updatedSections[sectionIndex] as any;
      if (section.categories && section.categories[0] && section.categories[0].items) {
        const oldSkill = section.categories[0].items[skillIndex];
        section.categories[0].items[skillIndex] = newValue;
        
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

  // Calculate dynamic CV match score based on current skills
  const calculateDynamicScore = () => {
    const currentSkills = getUnifiedSkills();
    const matchingSkills = currentSkills.filter(skill => getSkillCategory(skill) === 'match').length;
    const missingSkills = jobAnalysis.missing?.length || 0;
    const totalRequired = matchingSkills + missingSkills;
    
    if (totalRequired === 0) return { score: 100, matchRate: 100, level: 'PASS', color: '#16a34a' };
    
    const matchRate = (matchingSkills / totalRequired) * 100;
    const weaknessCount = jobAnalysis.weaknesses?.length || 0;
    const weaknessPenalty = Math.min(weaknessCount * 2, 10);
    const finalScore = Math.max(0, Math.min(100, matchRate - weaknessPenalty));
    
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
    
    return { score: Math.round(finalScore), matchRate: Math.round(matchRate), level, color };
  };

  const dynamicScore = calculateDynamicScore();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-800">CV Optimization for Job Match</h2>
        <p className="text-gray-600">
          Optimize your CV sections to better match the job requirements. Make changes across all sections of your CV.
        </p>
      </div>      {/* Section Navigation Tabs */}
      <div className="flex flex-wrap justify-center gap-2 p-2 bg-gray-50 rounded-lg">        {[
          { id: 'skills' as const, label: 'Skills', icon: Award },
          { id: 'experience' as const, label: 'Experience', icon: Briefcase },
          { id: 'projects' as const, label: 'Projects', icon: FileText }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>      {/* CV Grade Display - Dynamic Score */}
      {jobAnalysis.overall_grade && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-6">
              {/* Grade Circle - Using Dynamic Score */}
              <div className={`relative w-32 h-32 rounded-full border-8 flex items-center justify-center ${
                dynamicScore.level === 'PASS' ? 'border-green-500 bg-green-100' :
                dynamicScore.level === 'NEGOTIABLE' ? 'border-yellow-500 bg-yellow-100' :
                'border-red-500 bg-red-100'
              }`}>
                <div className="text-center">
                  <div className={`text-lg font-bold ${
                    dynamicScore.level === 'PASS' ? 'text-green-700' :
                    dynamicScore.level === 'NEGOTIABLE' ? 'text-yellow-700' :
                    'text-red-700'
                  }`}>
                    {dynamicScore.level}
                  </div>
                  <div className={`text-sm font-semibold ${
                    dynamicScore.level === 'PASS' ? 'text-green-600' :
                    dynamicScore.level === 'NEGOTIABLE' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {dynamicScore.score}/100
                  </div>
                </div>
                {/* Progress Ring - Dynamic */}
                <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-gray-200"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeDasharray={`${(dynamicScore.score / 100) * 326.7} 326.7`}
                    className={
                      dynamicScore.level === 'PASS' ? 'text-green-500' :
                      dynamicScore.level === 'NEGOTIABLE' ? 'text-yellow-500' :
                      'text-red-500'
                    }
                  />
                </svg>
              </div>
                {/* Grade Details - Dynamic */}
              <div className="flex-1 space-y-3">
                <h3 className="text-xl font-bold text-gray-800">
                  CV Match Score 
                  <span className="text-sm font-normal text-gray-500 ml-2">(Updates in real-time)</span>
                </h3>
                <p className="text-gray-700">
                  {dynamicScore.level === 'PASS' ? 
                    `Excellent match! ${dynamicScore.matchRate}% of required skills found in your CV.` :
                    dynamicScore.level === 'NEGOTIABLE' ?
                    `Good potential (${dynamicScore.matchRate}% match). Address missing requirements to strengthen your application.` :
                    `Significant gaps found (${dynamicScore.matchRate}% match). Consider developing missing skills before applying.`
                  }
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Skills Match ({unifiedSkills.filter(skill => getSkillCategory(skill) === 'match').length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Missing ({jobAnalysis.missing?.length || 0})</span>
                  </div>
                  {appliedChanges.filter(c => c.applied && c.type === 'add_skill').length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-blue-600 font-medium">
                        +{appliedChanges.filter(c => c.applied && c.type === 'add_skill').length} skills added
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>)}

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
                    <div className="w-3 h-3 bg-yellow-500 rounded border border-yellow-600"></div>
                    <span>Not Needed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded border border-red-600"></div>
                    <span>Missing</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {unifiedSkills.map((skill: string, skillIndex: number) => {
                  const skillCategory = getSkillCategory(skill);
                  const skillColorClass = getSkillColor(skillCategory);
                  
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
                          title={`${skill} - ${skillCategory === 'match' ? 'Matches job requirements' : 
                                                skillCategory === 'not_needed' ? 'Not needed for this job' :
                                                skillCategory === 'missing' ? 'Missing from job requirements' : 'Neutral skill'}`}
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
            <CardContent className="space-y-3">              {suggestedSkills.length > 0 ? (
                suggestedSkills.map((skillSuggestion, index) => (
                  <div key={index} className="border rounded-lg p-3 space-y-2 hover:border-blue-300 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={skillSuggestion.priority === 'high' ? 'destructive' : 'secondary'}>
                          {skillSuggestion.priority}
                        </Badge>
                        <span className="font-medium">{skillSuggestion.name}</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addSkillToCV(skillSuggestion)}
                        variant="outline"
                        className="hover:bg-green-50 hover:border-green-500 hover:text-green-700 transition-colors"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600">{skillSuggestion.reason}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-gray-500 font-medium">All suggested skills have been added!</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Your CV now includes the key skills for this job
                  </p>
                </div>
              )}</CardContent>
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
                    ({unifiedSkills.filter(skill => getSkillCategory(skill) === 'match').length})
                  </span>
                </div>
                <div className="space-y-2">
                  {unifiedSkills.filter(skill => getSkillCategory(skill) === 'match').length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {unifiedSkills
                        .filter(skill => getSkillCategory(skill) === 'match')
                        .slice(0, 8)
                        .map((skill, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      {unifiedSkills.filter(skill => getSkillCategory(skill) === 'match').length > 8 && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          +{unifiedSkills.filter(skill => getSkillCategory(skill) === 'match').length - 8} more
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

              {/* Not Needed Skills */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                  <h4 className="font-semibold text-yellow-800">Not Needed</h4>
                  <span className="text-sm text-yellow-600">
                    ({unifiedSkills.filter(skill => getSkillCategory(skill) === 'not_needed').length})
                  </span>
                </div>
                <div className="space-y-2">
                  {unifiedSkills.filter(skill => getSkillCategory(skill) === 'not_needed').length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {unifiedSkills
                        .filter(skill => getSkillCategory(skill) === 'not_needed')
                        .slice(0, 8)
                        .map((skill, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      {unifiedSkills.filter(skill => getSkillCategory(skill) === 'not_needed').length > 8 && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                          +{unifiedSkills.filter(skill => getSkillCategory(skill) === 'not_needed').length - 8} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-yellow-600">All skills are relevant</p>
                  )}
                  <p className="text-xs text-yellow-700 mt-2">
                    Consider removing these to save space
                  </p>
                </div>
              </div>

              {/* Missing Skills */}
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <h4 className="font-semibold text-red-800">Missing Skills</h4>
                  <span className="text-sm text-red-600">
                    ({jobAnalysis.missing?.length || 0})
                  </span>
                </div>
                <div className="space-y-2">
                  {jobAnalysis.missing && jobAnalysis.missing.length > 0 ? (
                    <div className="flex flex-wrap gap-1">                      {jobAnalysis.missing
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
                      {(jobAnalysis.missing?.length || 0) > 8 && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                          +{(jobAnalysis.missing?.length || 0) - 8} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-red-600">No missing skills identified</p>
                  )}
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
                      {unifiedSkills.filter(skill => getSkillCategory(skill) === 'match').length}
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
                    {jobAnalysis.missing?.length || 0}
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
      )}      {/* Action Buttons */}
      <div className="flex justify-center gap-4 pt-6">
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
        >
          Reset Changes
        </Button>
        <Button
          onClick={handleOptimize}
          disabled={isLoading}
          size="lg"
          className="min-w-[200px]"
        >
          {isLoading ? 'Optimizing...' : 'Apply Optimizations & Continue'}
        </Button>
      </div>      {/* Optimization Suggestions Popup */}      {popupState.show && (
        <div
          ref={popupRef}
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-w-sm w-80 top-4 right-4"
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
      
      {/* Notification Toast */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border-l-4 max-w-sm transform transition-all duration-300 ${
          notification.type === 'success' ? 'bg-green-50 border-green-500 text-green-800' :
          notification.type === 'warning' ? 'bg-yellow-50 border-yellow-500 text-yellow-800' :
          'bg-blue-50 border-blue-500 text-blue-800'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' && <Check className="h-5 w-5 text-green-600" />}
            {notification.type === 'warning' && <AlertCircle className="h-5 w-5 text-yellow-600" />}
            {notification.type === 'info' && <Award className="h-5 w-5 text-blue-600" />}
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveCVOptimizer;
