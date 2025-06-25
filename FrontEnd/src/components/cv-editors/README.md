# Enhanced CV Editor Components

This directory contains enhanced editor components for the CV builder application. These components provide a consistent UI, animations, and better error handling for all list-based inputs.

## Components

### GenericListEditor

A flexible component for editing lists of items with configurable fields. It supports:
- Text inputs
- Textareas
- Date fields
- Checkboxes
- Nested arrays (using ListInputField)

### Specialized Editors

We've created specialized versions for each section type:

1. **EducationEditorNew**: For educational history
2. **ExperienceEditorNew**: For work experience with achievements
3. **ProjectsEditorNew**: For projects with technologies and contributions
4. **SkillsEditorNew**: For skill categories and lists

## How to Use

### Basic Usage

```tsx
import { EducationEditorNew } from './cv-editors/new-editors';

function MyComponent() {
  // Your section state
  const [educationSection, setEducationSection] = useState({
    id: 'education',
    name: 'Education',
    type: 'list',
    items: [],
    template: {
      institution: '',
      degree: '',
      location: '',
      graduation_date: '',
      gpa: ''
    }
  });

  return (
    <EducationEditorNew 
      section={educationSection}
      onChange={setEducationSection}
    />
  );
}
```

### Using GenericListEditor Directly

For custom list types, you can use the GenericListEditor component directly:

```tsx
import GenericListEditor, { FieldConfig } from './ui/GenericListEditor';

// Define your item type
interface CustomItem {
  id: string;
  name: string;
  value: string;
  tags: string[];
}

// Define field configuration
const fields: FieldConfig[] = [
  { key: 'name', label: 'Name', required: true },
  { key: 'value', label: 'Value', type: 'textarea', span: 2 },
  { key: 'tags', label: 'Tags' }
];

// In your component
function MyComponent() {
  const [items, setItems] = useState<CustomItem[]>([]);
  const template = { name: '', value: '', tags: [] };

  return (
    <GenericListEditor
      title="Custom Items"
      items={items}
      onChange={setItems}
      template={template}
      fields={fields}
      addButtonText="Add Item"
    />
  );
}
```

## Benefits

1. **Consistent UI**: All list inputs share the same styling and behavior
2. **Animations**: Smooth animations for adding/removing items
3. **Error Prevention**: Better handling of arrays and nested data
4. **Type Safety**: Full TypeScript support with generics
5. **Customizable**: Configure fields, labels, and validation

## Migration

To migrate from the old editors to the new ones:

1. Import from `new-editors.tsx` instead of `index.tsx`
2. Update component names (e.g., `EducationEditor` → `EducationEditorNew`)

The props interface remains the same, so no other changes are needed. 