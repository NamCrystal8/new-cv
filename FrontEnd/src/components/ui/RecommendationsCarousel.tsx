import React, { useState, useEffect } from 'react';
import { RecommendationItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface RecommendationsCarouselProps {
  recommendations: RecommendationItem[];
  onComplete: (updatedRecommendations: RecommendationItem[]) => void;
}

// Helper function to extract section part from field
const getSectionFromField = (field: string): string => {
  if (field.includes('.')) {
    return field.split('.')[0];
  }
  return field;
};

// Safely render any value that might be an object
const safeRender = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '[Object]';
    }
  }
  return String(value);
};

// Component to render a preview of how the entire section will look with the changes
const CVSectionPreview: React.FC<{
  section: string;
  field: string;
  current: string;
  suggested: string;
  userInput: string;
  recommendations: RecommendationItem[];
}> = ({ section, field, current, suggested, userInput, recommendations }) => {
  // The content to display (either user input or suggestion)
  const newContent = userInput.trim() || suggested;
  
  // Helper function to get section recommendations
  const getSectionRecommendations = () => {
    // Get all recommendations for this section
    return recommendations.filter(rec => 
      rec.section.toLowerCase() === section.toLowerCase()
    );
  };
  
  // Helper function to format the preview based on section type
  const renderPreview = () => {
    const sectionLower = section.toLowerCase();
    
    switch (sectionLower) {
      case 'header':
        return renderHeaderSection(field, newContent);
      case 'education':
        return renderEducationSection(field, newContent);
      case 'experience':
        return renderExperienceSection(field, newContent);
      case 'skills':
        return renderSkillsSection(field, newContent);
      case 'projects':
        return renderProjectsSection(field, newContent);
      default:
        return (
          <div className="p-4 bg-white rounded-md">
            <h3 className="text-base font-medium">{sectionLower}</h3>
            <p className="mt-1 text-gray-800 whitespace-pre-wrap">
              {field === 'general' ? newContent : `Field "${field}" updated to: ${newContent}`}
            </p>
          </div>
        );
    }
  };
  
  // Render header section with all contact info
  const renderHeaderSection = (changedField: string, changedContent: string) => {
    // Build mock header data
    const mockHeader = {
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "+1 (555) 123-4567",
      location: "San Francisco, CA"
    };
    
    // Apply the current change
    if (changedField === 'name') {
      mockHeader.name = changedContent;
    } else if (changedField === 'email') {
      mockHeader.email = changedContent;
    } else if (changedField === 'phone') {
      mockHeader.phone = changedContent;
    } else if (changedField === 'location') {
      mockHeader.location = changedContent;
    }
    
    // Apply other pending changes from recommendations
    getSectionRecommendations().forEach(rec => {
      if (rec.field === 'name' && rec.field !== changedField) {
        mockHeader.name = rec.suggested;
      } else if (rec.field === 'email' && rec.field !== changedField) {
        mockHeader.email = rec.suggested;
      } else if (rec.field === 'phone' && rec.field !== changedField) {
        mockHeader.phone = rec.suggested;
      } else if (rec.field === 'location' && rec.field !== changedField) {
        mockHeader.location = rec.suggested;
      }
    });
    
    return (
      <div className="p-4 bg-white rounded-md">
        <h2 className={`text-xl font-bold ${changedField === 'name' ? 'text-blue-800 bg-blue-50 px-1' : 'text-gray-800'}`}>
          {mockHeader.name}
        </h2>
        <div className="mt-3 flex flex-col sm:flex-row sm:flex-wrap gap-y-1 gap-x-4">
          <div className={`flex items-center ${changedField === 'email' ? 'text-blue-800 bg-blue-50 px-1' : 'text-gray-600'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            <span>{mockHeader.email}</span>
          </div>
          
          <div className={`flex items-center ${changedField === 'phone' ? 'text-blue-800 bg-blue-50 px-1' : 'text-gray-600'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
            <span>{mockHeader.phone}</span>
          </div>
          
          <div className={`flex items-center ${changedField === 'location' ? 'text-blue-800 bg-blue-50 px-1' : 'text-gray-600'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span>{mockHeader.location}</span>
          </div>
        </div>
      </div>
    );
  };
  
  // Render education section
  const renderEducationSection = (changedField: string, changedContent: string) => {
    // Create sample education items with proper typing
    type MockEducationItem = {
      id: string;
      institution: string;
      degree: string;
      location: string;
      graduation_date: string;
      dates: string;
      relevant_coursework: string;
      gpa: string;
      honors: string;
      [key: string]: string; // Allow string indexing
    };
    
    const mockEducation: MockEducationItem[] = [
      {
        id: "education_0",
        institution: "Stanford University",
        degree: "Master of Science in Computer Science",
        location: "Stanford, CA",
        graduation_date: "2022",
        dates: "",
        relevant_coursework: "",
        gpa: "",
        honors: ""
      },
      {
        id: "education_1",
        institution: "MIT",
        degree: "Bachelor of Science in Computer Science",
        location: "Cambridge, MA",
        graduation_date: "2020",
        dates: "",
        relevant_coursework: "",
        gpa: "",
        honors: ""
      }
    ];
    
    // Parse the field to extract index and property if it follows pattern like "education.0.institution"
    let targetIndex = -1;
    let targetProperty = "";
    
    if (changedField.includes('.')) {
      const parts = changedField.split('.');
      if (parts.length === 3) {
        targetIndex = parseInt(parts[1]);
        targetProperty = parts[2];
        
        // Apply the change to the mock data
        if (targetIndex >= 0 && targetIndex < mockEducation.length) {
          // Check if the property exists on our mock object before setting it
          if (Object.prototype.hasOwnProperty.call(mockEducation[targetIndex], targetProperty)) {
            mockEducation[targetIndex][targetProperty] = changedContent;
          }
        }
      }
    }
    
    return (
      <div className="p-4 bg-white rounded-md">
        <h3 className="text-lg font-semibold mb-3 text-gray-700 border-b pb-1">Education</h3>
        <div className="space-y-4">
          {mockEducation.map((edu, index) => (
            <div key={edu.id} className={index === targetIndex ? "border-l-2 border-blue-500 pl-3" : "pl-3"}>
              <h4 className={`font-bold ${targetIndex === index && targetProperty === 'institution' ? 'text-blue-800 bg-blue-50 px-1' : 'text-gray-800'}`}>
                {edu.institution}
              </h4>
              <p className={`${targetIndex === index && targetProperty === 'degree' ? 'text-blue-800 bg-blue-50 px-1' : 'text-gray-800'} italic`}>
                {edu.degree}
              </p>
              <div className="flex justify-between text-sm text-gray-600 mt-1">
                <span className={targetIndex === index && targetProperty === 'location' ? 'text-blue-800 bg-blue-50 px-1' : ''}>
                  {edu.location}
                </span>
                <span className={targetIndex === index && targetProperty === 'graduation_date' ? 'text-blue-800 bg-blue-50 px-1' : ''}>
                  {edu.graduation_date}
                </span>
              </div>
              
              {edu.gpa && (
                <div className={`mt-1 text-sm ${targetIndex === index && targetProperty === 'gpa' ? 'text-blue-800 bg-blue-50 px-1' : 'text-gray-600'}`}>
                  GPA: {edu.gpa}
                </div>
              )}
              
              {edu.relevant_coursework && (
                <div className={`mt-1 text-sm ${targetIndex === index && targetProperty === 'relevant_coursework' ? 'text-blue-800 bg-blue-50 px-1' : 'text-gray-600'}`}>
                  Relevant Coursework: {edu.relevant_coursework}
                </div>
              )}
              
              {edu.honors && (
                <div className={`mt-1 text-sm ${targetIndex === index && targetProperty === 'honors' ? 'text-blue-800 bg-blue-50 px-1' : 'text-gray-600'}`}>
                  Honors: {edu.honors}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Render experience section
  const renderExperienceSection = (changedField: string, changedContent: string) => {
    // Create sample experience items with proper typing
    type MockExperienceItem = {
      id: string;
      company: string;
      title: string;
      location: string;
      start_date: string;
      end_date: string;
      achievements: string[];
      [key: string]: string | string[];
    };
    
    // Create sample experience items
    const mockExperience: MockExperienceItem[] = [
      {
        id: "experience_0",
        company: "Google",
        title: "Senior Software Engineer",
        location: "Mountain View, CA",
        start_date: "2020",
        end_date: "Present",
        achievements: [
          "Led development of a major feature that increased user engagement by 25%",
          "Mentored 5 junior engineers and improved team productivity by 15%"
        ]
      },
      {
        id: "experience_1",
        company: "Microsoft",
        title: "Software Engineer",
        location: "Redmond, WA",
        start_date: "2018",
        end_date: "2020",
        achievements: [
          "Developed backend services that scaled to millions of users",
          "Optimized database queries resulting in 30% performance improvement"
        ]
      }
    ];
    
    // Parse the field to extract index and property
    let targetIndex = -1;
    let targetProperty = "";
    
    if (changedField.includes('.')) {
      const parts = changedField.split('.');
      if (parts.length === 3) {
        targetIndex = parseInt(parts[1]);
        targetProperty = parts[2];
        
        // Apply the change to the mock data
        if (targetIndex >= 0 && targetIndex < mockExperience.length) {
          if (targetProperty === 'achievements') {
            // Handle achievements as an array
            // Ensure changedContent is treated as a string before splitting
            mockExperience[targetIndex].achievements = String(changedContent).split('\n').map(a => a.trim()).filter(a => a);
          } else if (Object.prototype.hasOwnProperty.call(mockExperience[targetIndex], targetProperty)) {
            // Safe indexing for string properties
            (mockExperience[targetIndex] as any)[targetProperty] = changedContent;
          }
        }
      }
    }
    
    return (
      <div className="p-4 bg-white rounded-md">
        <h3 className="text-lg font-semibold mb-3 text-gray-700 border-b pb-1">Experience</h3>
        <div className="space-y-4">
          {mockExperience.map((exp, index) => (
            <div key={exp.id} className={index === targetIndex ? "border-l-2 border-blue-500 pl-3" : "pl-3"}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <h4 className={`font-bold ${targetIndex === index && targetProperty === 'company' ? 'text-blue-800 bg-blue-50 px-1' : 'text-gray-800'}`}>
                  {exp.company}
                </h4>
                <div className="text-sm text-gray-600">
                  <span className={targetIndex === index && (targetProperty === 'start_date' || targetProperty === 'end_date') ? 'text-blue-800 bg-blue-50 px-1' : ''}>
                    {exp.start_date} - {exp.end_date}
                  </span>
                </div>
              </div>
              <p className={`${targetIndex === index && targetProperty === 'title' ? 'text-blue-800 bg-blue-50 px-1' : 'text-gray-800'} font-medium`}>
                {exp.title}
              </p>
              <p className={`text-sm text-gray-600 mb-1 ${targetIndex === index && targetProperty === 'location' ? 'text-blue-800 bg-blue-50 px-1' : ''}`}>
                {exp.location}
              </p>
              <ul className={`list-disc list-inside text-gray-700 text-sm space-y-1 ${targetIndex === index && targetProperty === 'achievements' ? 'bg-blue-50 px-2 py-1 rounded' : ''}`}>
                {exp.achievements.map((achievement, i) => (
                  <li key={i}>{achievement}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Render skills section
  const renderSkillsSection = (changedField: string, changedContent: string) => {
    // Create sample skills categories
    const mockSkills = [
      {
        id: "skill_category_0",
        name: "Programming Languages",
        items: ["JavaScript", "TypeScript", "Python", "Java", "C++"]
      },
      {
        id: "skill_category_1",
        name: "Frameworks & Libraries",
        items: ["React", "Angular", "Vue", "Node.js", "Express", "Django"]
      },
      {
        id: "skill_category_2",
        name: "Tools & Platforms",
        items: ["Git", "Docker", "Kubernetes", "AWS", "Azure", "GCP"]
      }
    ];
    
    // Parse the field to extract category index and skill index if applicable
    let targetCategoryIndex = -1;
    let targetSkillIndex = -1;
    
    if (changedField.includes('.')) {
      const parts = changedField.split('.');
      if (parts.length === 3) {
        targetCategoryIndex = parseInt(parts[1]);
        targetSkillIndex = parseInt(parts[2]);
        
        // Apply the change to the mock data
        if (targetCategoryIndex >= 0 && targetCategoryIndex < mockSkills.length) {
          if (targetSkillIndex >= 0 && targetSkillIndex < mockSkills[targetCategoryIndex].items.length) {
            mockSkills[targetCategoryIndex].items[targetSkillIndex] = changedContent;
          } else if (changedField.endsWith('.name')) {
            mockSkills[targetCategoryIndex].name = changedContent;
          }
        }
      }
    }
    
    return (
      <div className="p-4 bg-white rounded-md">
        <h3 className="text-lg font-semibold mb-3 text-gray-700 border-b pb-1">Skills</h3>
        <div className="space-y-3">
          {mockSkills.map((category, catIndex) => (
            <div key={category.id} className={catIndex === targetCategoryIndex ? "border-l-2 border-blue-500 pl-3" : "pl-3"}>
              <h4 className={`font-medium mb-1 ${catIndex === targetCategoryIndex && targetSkillIndex === -1 ? 'text-blue-800 bg-blue-50 px-1' : 'text-gray-700'}`}>
                {category.name}
              </h4>
              <div className="flex flex-wrap gap-2">
                {category.items.map((skill, skillIndex) => (
                  <span 
                    key={skillIndex} 
                    className={`px-2 py-1 rounded-full text-sm ${
                      catIndex === targetCategoryIndex && skillIndex === targetSkillIndex
                        ? 'bg-blue-200 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Render projects section
  const renderProjectsSection = (changedField: string, changedContent: string) => {
    // Create sample projects with proper typing
    type MockProjectItem = {
      id: string;
      title: string;
      description: string;
      start_date: string;
      end_date: string;
      technologies: string[];
      contributions: string[];
      [key: string]: string | string[];
    };
    
    // Create sample projects
    const mockProjects: MockProjectItem[] = [
      {
        id: "project_0",
        title: "E-commerce Platform",
        description: "A full-stack e-commerce application with React and Node.js",
        start_date: "Jan 2021",
        end_date: "Jun 2021",
        technologies: ["React", "Node.js", "MongoDB", "Express"],
        contributions: [
          "Implemented the shopping cart and checkout functionality",
          "Developed the user authentication system",
          "Created responsive UI components"
        ]
      },
      {
        id: "project_1",
        title: "Machine Learning Image Classifier",
        description: "An image classification application using TensorFlow",
        start_date: "Jul 2020",
        end_date: "Dec 2020",
        technologies: ["Python", "TensorFlow", "Keras", "Flask"],
        contributions: [
          "Trained a custom CNN model with 95% accuracy",
          "Built a Flask API for serving predictions",
          "Created a web interface for uploading and classifying images"
        ]
      }
    ];
    
    // Parse the field to extract index and property
    let targetIndex = -1;
    let targetProperty = "";
    
    if (changedField.includes('.')) {
      const parts = changedField.split('.');
      if (parts.length === 3) {
        targetIndex = parseInt(parts[1]);
        targetProperty = parts[2];
        
        // Apply the change to the mock data
        if (targetIndex >= 0 && targetIndex < mockProjects.length) {
          if (targetProperty === 'technologies') {
            // Handle technologies as an array
            mockProjects[targetIndex].technologies = String(changedContent).split(',').map(t => t.trim());
          } else if (targetProperty === 'contributions') {
            // Handle contributions as an array
            mockProjects[targetIndex].contributions = String(changedContent).split('\n').map(c => c.trim()).filter(c => c);
          } else if (Object.prototype.hasOwnProperty.call(mockProjects[targetIndex], targetProperty)) {
            // Safe indexing for string properties
            (mockProjects[targetIndex] as any)[targetProperty] = changedContent;
          }
        }
      }
    }
    
    return (
      <div className="p-4 bg-white rounded-md">
        <h3 className="text-lg font-semibold mb-3 text-gray-700 border-b pb-1">Projects</h3>
        <div className="space-y-4">
          {mockProjects.map((project, index) => (
            <div key={project.id} className={index === targetIndex ? "border-l-2 border-blue-500 pl-3" : "pl-3"}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <h4 className={`font-bold ${targetIndex === index && targetProperty === 'title' ? 'text-blue-800 bg-blue-50 px-1' : 'text-gray-800'}`}>
                  {project.title}
                </h4>
                <div className="text-xs text-gray-600">
                  <span className={targetIndex === index && (targetProperty === 'start_date' || targetProperty === 'end_date') ? 'text-blue-800 bg-blue-50 px-1' : ''}>
                    {project.start_date} - {project.end_date}
                  </span>
                </div>
              </div>
              <p className={`mt-1 text-sm ${targetIndex === index && targetProperty === 'description' ? 'text-blue-800 bg-blue-50 px-1' : 'text-gray-700'}`}>
                {project.description}
              </p>
              
              <div className={`mt-2 ${targetIndex === index && targetProperty === 'technologies' ? 'bg-blue-50 px-2 py-1 rounded' : ''}`}>
                <span className="text-xs font-medium text-gray-500">Technologies: </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {project.technologies.map((tech, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-gray-800 rounded text-xs">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className={`mt-2 ${targetIndex === index && targetProperty === 'contributions' ? 'bg-blue-50 px-2 py-1 rounded' : ''}`}>
                <span className="text-xs font-medium text-gray-500">Key Contributions:</span>
                <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 mt-1">
                  {project.contributions.map((contribution, i) => (
                    <li key={i}>{contribution}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="mt-6 border border-gray-200 rounded-md overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <h3 className="font-medium text-gray-700">Section Preview</h3>
        <p className="text-xs text-gray-500">This shows how the entire section will look with your change applied</p>
      </div>
      <div className="p-2">
        {renderPreview()}
      </div>
    </div>
  );
};

const RecommendationsCarousel: React.FC<RecommendationsCarouselProps> = ({
  recommendations,
  onComplete
}) => {
  // Group recommendations by section
  const [groupedRecommendations, setGroupedRecommendations] = useState<{[key: string]: RecommendationItem[]}>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [editedRecommendations, setEditedRecommendations] = useState<RecommendationItem[]>(recommendations);
  const [userInput, setUserInput] = useState('');

  // Group recommendations by section
  useEffect(() => {
    const grouped: {[key: string]: RecommendationItem[]} = {};
    recommendations.forEach(rec => {
      if (!grouped[rec.section]) {
        grouped[rec.section] = [];
      }
      grouped[rec.section].push(rec);
    });
    setGroupedRecommendations(grouped);
    setCategories(Object.keys(grouped));
  }, [recommendations]);

  // Handle next recommendation in current category
  const handleNextInCategory = () => {
    const currentCategoryItems = groupedRecommendations[categories[currentCategoryIndex]] || [];
    
    if (currentItemIndex < currentCategoryItems.length - 1) {
      // Move to next item in current category
      setCurrentItemIndex(currentItemIndex + 1);
      setUserInput(''); // Reset user input
    } else {
      // We've reached the end of this category
      handleNextCategory();
    }
  };

  // Handle moving to next category
  const handleNextCategory = () => {
    if (currentCategoryIndex < categories.length - 1) {
      // Move to next category
      setCurrentCategoryIndex(currentCategoryIndex + 1);
      setCurrentItemIndex(0); // Reset to first item in new category
      setUserInput(''); // Reset user input
    } else {
      // We've reached the end of all categories
      onComplete(editedRecommendations);
    }
  };

  // Handle user accepting suggestion
  const handleAccept = () => {
    // Just move to the next without changing anything
    handleNextInCategory();
  };

  // Handle user editing the suggestion
  const handleEdit = () => {
    if (userInput.trim()) {
      // Find the current recommendation
      const currentCategory = categories[currentCategoryIndex];
      const currentRec = groupedRecommendations[currentCategory][currentItemIndex];
      
      // Update recommendation in our state
      const updatedRecommendations = editedRecommendations.map(rec => {
        if (rec.id === currentRec.id) {
          return { ...rec, suggested: userInput };
        }
        return rec;
      });
      
      setEditedRecommendations(updatedRecommendations);
    }
    
    handleNextInCategory();
  };

  // If no recommendations, show a message
  if (recommendations.length === 0) {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
          <CardDescription>No recommendations available</CardDescription>
        </CardHeader>
        <CardContent>
          <p>No specific recommendations were generated for your CV.</p>
        </CardContent>
        <CardFooter>
          <Button onClick={() => onComplete([])}>Continue</Button>
        </CardFooter>
      </Card>
    );
  }

  // Calculate current category & item
  const currentCategory = categories[currentCategoryIndex] || "";
  const currentCategoryItems = groupedRecommendations[currentCategory] || [];
  const currentRecommendation = currentCategoryItems[currentItemIndex] || recommendations[0];
  
  // Calculate progress
  const currentCategoryProgress = ((currentItemIndex + 1) / currentCategoryItems.length) * 100;
  const overallProgress = (
    (categories.slice(0, currentCategoryIndex).reduce((acc, cat) => 
      acc + (groupedRecommendations[cat]?.length || 0), 0) + currentItemIndex + 1
    ) / recommendations.length
  ) * 100;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Personalized Recommendations</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Review and apply these AI-generated suggestions to enhance your CV.
        </p>
      </div>
      
      {/* Category indicator */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-500">
          Category {currentCategoryIndex + 1} of {categories.length}: <span className="text-blue-600 font-semibold">{currentCategory}</span>
        </span>
        <span className="text-sm font-medium text-gray-500">
          Overall: {Math.round(overallProgress)}% complete
        </span>
      </div>
      
      {/* Overall progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
        <div 
          className="bg-blue-600 h-1.5 rounded-full transition-all duration-300 ease-in-out" 
          style={{ width: `${overallProgress}%` }}
        ></div>
      </div>
      
      {/* Category progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-1 mb-4">
        <div 
          className="bg-blue-400 h-1 rounded-full transition-all duration-300 ease-in-out" 
          style={{ width: `${currentCategoryProgress}%` }}
        ></div>
      </div>
      
      <Card className="w-full border-blue-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {safeRender(currentRecommendation.section)}
          </CardTitle>
          <CardDescription>
            {safeRender(currentRecommendation.field)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Current Content:</h4>
            <div className="p-3 bg-gray-50 rounded border border-gray-200 text-gray-800">
              {safeRender(currentRecommendation.current)}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Suggested Improvement:</h4>
            <div className="p-3 bg-blue-50 rounded border border-blue-200 text-blue-800">
              {safeRender(currentRecommendation.suggested)}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Your Edited Version (Optional):</h4>
            <textarea 
              className="w-full p-3 bg-white rounded border border-gray-300 text-gray-800"
              rows={3}
              placeholder="Enter your own version or leave empty to accept suggestion"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
            />
          </div>
          
          {/* Updated Preview Section */}
          <CVSectionPreview 
            section={currentRecommendation.section}
            field={currentRecommendation.field}
            current={currentRecommendation.current}
            suggested={currentRecommendation.suggested}
            userInput={userInput}
            recommendations={recommendations}
          />
        </CardContent>
        <CardFooter className="justify-between space-x-2 border-t border-gray-100 pt-4">
          <div className="text-sm text-muted-foreground">
            {currentItemIndex + 1} of {currentCategoryItems.length} in current category
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleAccept}>
              Skip
            </Button>
            {userInput ? (
              <Button onClick={handleEdit}>
                Save & Continue
              </Button>
            ) : (
              <Button onClick={handleNextInCategory}>
                Accept & Continue
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
      
      {/* Skip category button */}
      <div className="flex justify-end mt-4">
        <Button variant="ghost" size="sm" onClick={handleNextCategory} className="text-sm">
          Skip all in this category &rarr;
        </Button>
      </div>
    </div>
  );
};

export default RecommendationsCarousel; 