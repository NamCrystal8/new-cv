# CV Preview Panel Documentation

## Overview

The CV Preview Panel is a real-time preview component that shows users exactly how their CV will look when they apply recommendations from the recommendation carousel. It provides an interactive before/after comparison with Harvard-style formatting that matches the final PDF output.

## Features

### 1. Real-time Preview
- **Live Updates**: Preview updates instantly as users navigate between recommendations
- **Before/After Toggle**: Users can switch between the current state and the modified state
- **Change Highlighting**: Visual indicators show what content will be added or modified

### 2. Harvard-style Formatting
- **Consistent Styling**: Matches the LaTeX template used for final PDF generation
- **Professional Layout**: Clean, academic-style formatting with proper typography
- **Section-specific Rendering**: Each CV section (header, education, experience, etc.) is rendered with appropriate formatting

### 3. Visual Feedback
- **Change Annotations**: Clear indicators show what modifications will be made
- **Highlight Effects**: Modified content is highlighted with subtle animations
- **Status Indicators**: Shows whether viewing "Before" or "After" state

### 4. Responsive Design
- **Mobile-friendly**: Adapts to different screen sizes
- **Sticky Positioning**: On larger screens, preview panel stays in view while scrolling
- **Flexible Layout**: Switches between side-by-side and stacked layouts

## Component Structure

### CVPreviewPanel
Main container component that manages the preview state and layout.

**Props:**
- `currentCVData`: Array of current CV sections
- `currentRecommendation`: The recommendation being previewed
- `userInput`: User's custom input for the recommendation

**Features:**
- Before/after toggle buttons
- Sticky positioning on larger screens
- Change summary display
- Loading states for missing data

### CVSectionPreview
Renders individual CV sections in Harvard style.

**Props:**
- `section`: The CV section to render
- `changes`: Array of changes to highlight
- `sectionType`: Type of section being rendered

**Supported Section Types:**
- **Header**: Name, contact information with proper formatting
- **Education**: Institution, degree, dates, GPA, coursework
- **Experience**: Company, title, dates, achievements with bullet points
- **Projects**: Title, description, technologies, contributions
- **Skills**: Categorized skill lists
- **Languages**: Language and proficiency levels

## Usage Example

```tsx
import RecommendationsCarousel from '@/components/ui/RecommendationsCarousel';

function CVImprovementPage() {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [currentCVData, setCurrentCVData] = useState<EditableSection[]>([]);

  return (
    <RecommendationsCarousel
      recommendations={recommendations}
      currentCVData={currentCVData}
      onComplete={(updatedRecommendations) => {
        // Handle completion
      }}
    />
  );
}
```

## Styling

The component uses a combination of Tailwind CSS classes and custom CSS defined in `CVPreview.css`:

- **Harvard-style typography**: Palatino font family, proper spacing
- **Professional colors**: Subtle grays and blues for a clean look
- **Responsive breakpoints**: Mobile-first design with desktop enhancements
- **Animation effects**: Smooth transitions for state changes

## Technical Implementation

### Data Flow
1. **Input Processing**: Takes current CV data and recommendation
2. **Preview Generation**: Creates modified version by applying recommendation
3. **Change Detection**: Identifies what will be modified
4. **Rendering**: Displays formatted preview with highlighting

### Change Application Logic
The component intelligently applies different types of changes:

- **Field Updates**: Modifies specific fields (name, email, etc.)
- **List Additions**: Adds new items to education, experience, projects
- **Content Enhancement**: Improves existing content with better phrasing
- **Section Creation**: Previews entirely new sections

### Performance Considerations
- **Memoization**: Prevents unnecessary re-renders
- **Lazy Loading**: Only generates preview when needed
- **Efficient Updates**: Minimal DOM manipulation for smooth interactions

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile Browsers**: iOS Safari, Chrome Mobile
- **Responsive Design**: Works on screens from 320px to 4K displays

## Accessibility

- **Keyboard Navigation**: Full keyboard support for toggle buttons
- **Screen Readers**: Proper ARIA labels and semantic HTML
- **Color Contrast**: Meets WCAG 2.1 AA standards
- **Focus Management**: Clear focus indicators and logical tab order

## Future Enhancements

- **PDF Preview**: Direct PDF rendering in the preview panel
- **Export Options**: Save preview as image or PDF
- **Comparison Mode**: Side-by-side before/after view
- **Template Selection**: Preview with different CV templates
- **Real-time Collaboration**: Multi-user preview sharing
