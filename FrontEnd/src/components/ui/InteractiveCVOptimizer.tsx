import React, { useState, useEffect, useRef } from 'react';
import { JobDescriptionAnalysis, EditableSection } from '../../types';
import { Button } from './button';
import { Card, CardHeader, CardTitle, CardContent } from './card';
import { Badge } from './badge';
import { Trash2, Plus, Edit3, Check, X, User, Award, Briefcase, GraduationCap, FileText, AlertCircle, TrendingUp, BookOpen } from 'lucide-react';

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
  const [suggestedExperiences, setSuggestedExperiences] = useState<ExperienceToAdd[]>([]);  const [suggestedProjects, setSuggestedProjects] = useState<ProjectToAdd[]>([]);  const [editingSkill, setEditingSkill] = useState<{index: number, value: string} | null>(null);
  const [newSkillInput, setNewSkillInput] = useState<string>('');
  const [newAchievements, setNewAchievements] = useState<Record<string, string>>({});  const [newTechnologies, setNewTechnologies] = useState<Record<string, string>>({});
  const [newContributions, setNewContributions] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'skills' | 'experience' | 'projects' | 'education' | 'contact'>('skills');
  const [popupState, setPopupState] = useState<PopupState>({
    show: false,
    x: 0,
    y: 0,
    suggestions: [],
    itemType: 'skill',
    itemId: ''
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
    }
  }, [popupState.show]);

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

  // Add skill to unified skills list
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
      }
      
      setOptimizedSections(updatedSections);
      
      // Track change
      const change: OptimizationChange = {
        id: `add_skill_${Date.now()}`,
        type: 'add_skill',
        section: 'Skills',
        description: `Added "${skillToAdd.name}" - ${skillToAdd.reason}`,
        applied: true
      };
      setAppliedChanges([...appliedChanges, change]);
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
        setAppliedChanges([...appliedChanges, change]);
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
        setAppliedChanges([...appliedChanges, change]);
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-800">CV Optimization for Job Match</h2>
        <p className="text-gray-600">
          Optimize your CV sections to better match the job requirements. Make changes across all sections of your CV.
        </p>
      </div>

      {/* Section Navigation Tabs */}
      <div className="flex flex-wrap justify-center gap-2 p-2 bg-gray-50 rounded-lg">
        {[
          { id: 'skills' as const, label: 'Skills', icon: Award },
          { id: 'experience' as const, label: 'Experience', icon: Briefcase },
          { id: 'projects' as const, label: 'Projects', icon: FileText },
          { id: 'education' as const, label: 'Education', icon: GraduationCap },
          { id: 'contact' as const, label: 'Contact', icon: User }
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
      </div>

      {/* Skills Section */}
      {activeTab === 'skills' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Skills Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit3 className="h-5 w-5" />
                Current Skills
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {unifiedSkills.map((skill: string, skillIndex: number) => (
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
                      </div>                    ) : (
                      <Badge
                        variant="secondary"
                        className="cursor-pointer hover:bg-gray-200 group relative"
                        onClick={() => setEditingSkill({index: skillIndex, value: skill})}
                        onContextMenu={(e) => showOptimizationPopup(e, 'skill', skill, `skill_${skillIndex}`)}
                      >
                        {skill}
                        <div className="flex items-center gap-1 ml-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 hover:bg-blue-100"
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
                            className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 hover:bg-red-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSkillFromCV(skillIndex);
                            }}
                          >
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      </Badge>
                    )}
                  </div>
                ))}
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
            <CardContent className="space-y-3">
              {suggestedSkills.length > 0 ? (
                suggestedSkills.map((skillSuggestion, index) => (
                  <div key={index} className="border rounded-lg p-3 space-y-2">
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
                      >
                        Add
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600">{skillSuggestion.reason}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No specific skill suggestions available
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}      {/* Experience Section */}
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
                )}

                {/* Experience Weaknesses */}
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
          </Card>
        </div>
      )}

      {activeTab === 'education' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Education Optimization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Education optimization features coming soon. Consider highlighting relevant coursework and academic achievements.
            </p>
          </CardContent>
        </Card>
      )}

      {activeTab === 'contact' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Contact information optimization features coming soon. Ensure your contact details are professional and up-to-date.
            </p>
          </CardContent>
        </Card>
      )}

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
      </div>      {/* Optimization Suggestions Popup */}
      {popupState.show && (
        <div
          ref={popupRef}
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-w-sm w-80"
          style={
            {
              left: `${Math.min(popupState.x, window.innerWidth - 320)}px`,
              top: `${Math.min(popupState.y, window.innerHeight - 400)}px`,
            } as React.CSSProperties
          }
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveCVOptimizer;
