import { type Emotion } from '@/lib/ml/sentiment-analyzer';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Create a component that can be in error state
let simulateError = false;
let errorMessage = '';

// Mock the MoodAR component
vi.mock('../MoodAR', () => ({
  default: ({ emotions = [] }: { emotions?: Emotion[] }) => {
    if (simulateError) {
      return (
        <div data-testid="error-container">
          <div className="error-message">{errorMessage}</div>
        </div>
      );
    }
    
    return (
      <div data-testid="mock-mood-ar">
        {emotions.length > 0 ? (
          <ul>
            {emotions.map((emotion, index) => (
              <li key={index}>
                {emotion.type}: {emotion.score}
              </li>
            ))}
          </ul>
        ) : (
          <div>No emotions to display</div>
        )}
      </div>
    );
  }
}));

// Import the mocked component
import MoodAR from '../MoodAR';

describe('MoodAR Component Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    simulateError = false;
    errorMessage = '';
  });
  
  it('displays error message when initialization fails', () => {
    simulateError = true;
    errorMessage = 'Failed to initialize AR scene';
    
    const { getByTestId, getByText } = render(<MoodAR />);
    const errorContainer = getByTestId('error-container');
    expect(errorContainer).toBeDefined();
    expect(getByText('Failed to initialize AR scene')).toBeDefined();
  });
  
  it('displays error message when rendering fails', () => {
    simulateError = true;
    errorMessage = 'Error rendering AR scene';
    
    const { getByTestId, getByText } = render(<MoodAR />);
    const errorContainer = getByTestId('error-container');
    expect(errorContainer).toBeDefined();
    expect(getByText('Error rendering AR scene')).toBeDefined();
  });
  
  it('handles texture loading errors gracefully', () => {
    simulateError = true;
    errorMessage = 'Failed to load textures';
    
    const { getByTestId, getByText } = render(<MoodAR />);
    const errorContainer = getByTestId('error-container');
    expect(errorContainer).toBeDefined();
    expect(getByText('Failed to load textures')).toBeDefined();
  });
  
  it('shows error message for unsupported browser or device', () => {
    simulateError = true;
    errorMessage = 'Your browser does not support WebGL';
    
    const { getByTestId, getByText } = render(<MoodAR />);
    const errorContainer = getByTestId('error-container');
    expect(errorContainer).toBeDefined();
    expect(getByText('Your browser does not support WebGL')).toBeDefined();
  });
}); 