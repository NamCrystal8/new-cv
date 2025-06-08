import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the ListInputField component since it's not the focus of this test
jest.mock('../ListInputField', () => {
  return function MockListInputField({ items, onChange, placeholder }: any) {
    return (
      <div data-testid="list-input-field">
        <div>Items: {JSON.stringify(items)}</div>
        <input
          placeholder={placeholder}
          onChange={(e) => {
            const newItems = [...items, e.target.value];
            onChange(newItems);
          }}
        />
      </div>
    );
  };
});

// Mock the Button component
jest.mock('../button', () => ({
  Button: ({ children, onClick, variant, ...props }: any) => (
    <button onClick={onClick} data-variant={variant} {...props}>
      {children}
    </button>
  ),
}));

// Extract SmartInputField for testing
const SmartInputField: React.FC<{
  value: string;
  onChange: (value: string) => void;
  suggestedContent: string;
  placeholder?: string;
}> = ({ value, onChange, suggestedContent, placeholder = "Enter your own version or leave empty to accept suggestion" }) => {
  const [inputMode, setInputMode] = React.useState<'auto' | 'list' | 'text'>('auto');
  const [listItems, setListItems] = React.useState<string[]>([]);

  // Determine if the suggested content is a JSON array
  const isSuggestedList = React.useMemo(() => {
    const content = String(suggestedContent);
    if (content.startsWith('[') && content.endsWith(']')) {
      try {
        const parsed = JSON.parse(content);
        return Array.isArray(parsed);
      } catch {
        return false;
      }
    }
    return false;
  }, [suggestedContent]);

  // Reset internal state when value is cleared externally or when suggested content type changes
  React.useEffect(() => {
    if (!value.trim()) {
      setListItems([]);
      setInputMode('auto');
    }
  }, [value]);

  // Reset state when suggested content type changes
  React.useEffect(() => {
    // Reset to auto mode when suggested content type changes
    setInputMode('auto');
    setListItems([]);
  }, [isSuggestedList]);

  // Initialize list items from value or suggested content
  React.useEffect(() => {
    if (value) {
      // Try to parse the current value as JSON array
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          setListItems(parsed);
          setInputMode('list');
          return;
        }
      } catch {
        // Not a JSON array, keep as text
        setListItems([]);
        if (inputMode === 'auto') {
          setInputMode(isSuggestedList ? 'list' : 'text');
        }
      }
    } else {
      // No current value - initialize based on suggested content
      if (isSuggestedList) {
        try {
          const parsed = JSON.parse(suggestedContent);
          setListItems(parsed);
          setInputMode('list');
        } catch {
          setListItems([]);
          setInputMode('text');
        }
      } else {
        setListItems([]);
        setInputMode('text');
      }
    }
  }, [value, suggestedContent, isSuggestedList, inputMode]);

  const handleListChange = (newItems: string[]) => {
    setListItems(newItems);
    onChange(JSON.stringify(newItems));
  };

  const handleTextChange = (newValue: string) => {
    onChange(newValue);
  };

  const handleModeSwitch = (mode: 'list' | 'text') => {
    setInputMode(mode);
    if (mode === 'list' && !value) {
      // Start with suggested items if available
      if (isSuggestedList) {
        try {
          const parsed = JSON.parse(suggestedContent);
          setListItems(parsed);
          onChange(JSON.stringify(parsed));
        } catch {
          setListItems([]);
          onChange('[]');
        }
      } else {
        setListItems([]);
        onChange('[]');
      }
    } else if (mode === 'text' && Array.isArray(listItems) && listItems.length > 0) {
      // Convert list items to text format
      const textValue = listItems.join('\n');
      onChange(textValue);
    }
  };

  // Determine current mode
  const currentMode = inputMode === 'auto' ? (isSuggestedList ? 'list' : 'text') : inputMode;

  return (
    <div className="space-y-2" data-testid="smart-input-field">
      {/* Mode selector */}
      <div className="flex gap-2">
        <button
          type="button"
          data-variant={currentMode === 'text' ? 'default' : 'outline'}
          onClick={() => handleModeSwitch('text')}
          data-testid="text-mode-button"
        >
          Text
        </button>
        <button
          type="button"
          data-variant={currentMode === 'list' ? 'default' : 'outline'}
          onClick={() => handleModeSwitch('list')}
          data-testid="list-mode-button"
        >
          List
        </button>
      </div>

      {/* Input field based on current mode */}
      {currentMode === 'list' ? (
        <div data-testid="list-input-field">
          <div>Items: {JSON.stringify(listItems)}</div>
          <input
            placeholder="Add item"
            onChange={(e) => {
              const newItems = [...listItems, e.target.value];
              handleListChange(newItems);
            }}
          />
        </div>
      ) : (
        <textarea 
          className="w-full p-3 bg-white rounded border border-gray-300 text-gray-800"
          rows={3}
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleTextChange(e.target.value)}
          data-testid="text-input"
        />
      )}
    </div>
  );
};

describe('SmartInputField', () => {
  it('should reset state when transitioning from list to text recommendations', async () => {
    const mockOnChange = jest.fn();
    
    // First render with list suggestion
    const { rerender } = render(
      <SmartInputField
        value=""
        onChange={mockOnChange}
        suggestedContent='["Item 1", "Item 2", "Item 3"]'
        placeholder="Test placeholder"
      />
    );

    // Should be in list mode
    expect(screen.getByTestId('list-input-field')).toBeInTheDocument();
    expect(screen.getByText('Items: ["Item 1","Item 2","Item 3"]')).toBeInTheDocument();

    // Now change to text suggestion
    rerender(
      <SmartInputField
        value=""
        onChange={mockOnChange}
        suggestedContent="This is a text recommendation"
        placeholder="Test placeholder"
      />
    );

    // Should switch to text mode and clear list items
    await waitFor(() => {
      expect(screen.getByTestId('text-input')).toBeInTheDocument();
      expect(screen.queryByTestId('list-input-field')).not.toBeInTheDocument();
    });
  });

  it('should properly handle key prop changes by resetting component state', () => {
    const mockOnChange = jest.fn();
    
    // First recommendation with list
    const { rerender } = render(
      <SmartInputField
        key="rec1-0"
        value=""
        onChange={mockOnChange}
        suggestedContent='["Skill 1", "Skill 2"]'
      />
    );

    expect(screen.getByTestId('list-input-field')).toBeInTheDocument();

    // Second recommendation with text (different key)
    rerender(
      <SmartInputField
        key="rec2-1"
        value=""
        onChange={mockOnChange}
        suggestedContent="This is text content"
      />
    );

    // Should show text input
    expect(screen.getByTestId('text-input')).toBeInTheDocument();
    expect(screen.queryByTestId('list-input-field')).not.toBeInTheDocument();
  });

  it('should clear list items when value is cleared', async () => {
    const mockOnChange = jest.fn();
    
    const { rerender } = render(
      <SmartInputField
        value='["Item 1", "Item 2"]'
        onChange={mockOnChange}
        suggestedContent='["Item 1", "Item 2"]'
      />
    );

    // Should be in list mode with items
    expect(screen.getByTestId('list-input-field')).toBeInTheDocument();

    // Clear the value
    rerender(
      <SmartInputField
        value=""
        onChange={mockOnChange}
        suggestedContent='["Item 1", "Item 2"]'
      />
    );

    // Should reset to suggested items
    await waitFor(() => {
      expect(screen.getByText('Items: ["Item 1","Item 2"]')).toBeInTheDocument();
    });
  });
});
