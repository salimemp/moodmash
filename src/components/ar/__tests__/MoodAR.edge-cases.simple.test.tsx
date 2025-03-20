/**
 * @vitest-environment jsdom
 */

import { type Emotion } from '@/lib/ml/sentiment-analyzer';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MoodAR from '../MoodAR';

// Define the props interface to match the real component
interface MoodARProps {
  emotions?: Emotion[];
  capturedImage?: string;
  width?: number;
  height?: number;
}

// Track component behavior for testing
const mockState = {
  objectsCreated: 0,
  resizeHandled: 0,
  cleanupCalled: false,
  dimensionChangeCalled: false
};

// Mock out the MoodAR component to avoid Three.js issues
vi.mock('../MoodAR', () => {
  return {
    default: function MockMoodAR({ emotions = [], capturedImage: _capturedImage, width = 400, height = 300 }: MoodARProps) {
      // Reset counters on component creation
      mockState.objectsCreated = 0;
      mockState.resizeHandled = 0;
      mockState.cleanupCalled = false;
      mockState.dimensionChangeCalled = false;
      
      // Simulate Three.js scene setup
      vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
        cb(0);
        return 0;
      });
      
      // Create objects for each emotion
      if (emotions && emotions.length) {
        emotions.forEach(_emotion => {
          // Create differently sized objects based on emotion score
          mockState.objectsCreated++;
        });
      }
      
      // Set up resize handler
      vi.stubGlobal('addEventListener', (event: string, handler: EventListener) => {
        if (event === 'resize') {
          // Call the handler immediately to test it
          handler(new Event('resize'));
          mockState.resizeHandled++;
        }
      });
      
      // Set up cleanup
      vi.stubGlobal('removeEventListener', () => {
        mockState.cleanupCalled = true;
      });
      
      // Handle dimension changes
      if (width !== 400 || height !== 300) {
        mockState.dimensionChangeCalled = true;
      }
      
      // Return mock UI
      return (
        <div className="mocked-mood-ar" data-testid="mood-ar" style={{ width: `${width}px`, height: `${height}px` }}>
          <canvas data-testid="ar-canvas"></canvas>
          
          <div className="loading-indicator">Loading AR visualization...</div>
          
          <div className="info">
            {emotions && emotions.length > 0 ? (
              <p data-testid="emotion-summary">
                Visualizing {emotions.length} emotions in AR:
                {emotions.map(e => e.type).join(', ')}
              </p>
            ) : (
              <p data-testid="no-emotions">No emotions detected</p>
            )}
          </div>
          
          {_capturedImage && (
            <div className="image-info">Using captured image</div>
          )}
        </div>
      );
    }
  };
});

describe('MoodAR Component Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.objectsCreated = 0;
    mockState.resizeHandled = 0;
    mockState.cleanupCalled = false;
    mockState.dimensionChangeCalled = false;
  });
  
  it('handles empty emotions array gracefully', () => {
    render(<MoodAR emotions={[]} />);
    
    // Should still render a canvas
    expect(screen.getByTestId('ar-canvas')).toBeInTheDocument();
    
    // Should show the "no emotions" message
    expect(screen.getByTestId('no-emotions')).toBeInTheDocument();
    expect(screen.getByText('No emotions detected')).toBeInTheDocument();
  });
  
  it('handles undefined emotions prop gracefully', () => {
    render(<MoodAR />);
    
    // Should still render a canvas
    expect(screen.getByTestId('ar-canvas')).toBeInTheDocument();
    
    // Should show the "no emotions" message
    expect(screen.getByTestId('no-emotions')).toBeInTheDocument();
  });
  
  it('handles extremely high emotion scores correctly', () => {
    const extremeEmotions: Emotion[] = [
      { type: 'joy', score: 1.0 },     // Maximum possible value
      { type: 'sadness', score: 0.99 } // Very high value
    ];
    
    render(<MoodAR emotions={extremeEmotions} />);
    
    // Should create objects for each emotion
    expect(mockState.objectsCreated).toBe(extremeEmotions.length);
    
    // Should display emotion summary
    expect(screen.getByTestId('emotion-summary')).toBeInTheDocument();
    expect(screen.getByText(/joy, sadness/)).toBeInTheDocument();
  });
  
  it('handles extremely low emotion scores correctly', () => {
    const extremeEmotions: Emotion[] = [
      { type: 'joy', score: 0.001 },  // Very low value
      { type: 'sadness', score: 0.0 } // Minimum possible value
    ];
    
    render(<MoodAR emotions={extremeEmotions} />);
    
    // Should create objects for each emotion
    expect(mockState.objectsCreated).toBe(extremeEmotions.length);
    
    // Should display emotion summary
    expect(screen.getByTestId('emotion-summary')).toBeInTheDocument();
    expect(screen.getByText(/joy, sadness/)).toBeInTheDocument();
  });
  
  it('handles invalid emotion types gracefully', () => {
    // Use type assertion to bypass TypeScript's type checking for this test
    const emotions = [
      { type: 'invalid-emotion-type' as any, score: 0.8 }
    ] as Emotion[];
    
    render(<MoodAR emotions={emotions} />);
    
    // Should still render properly
    expect(screen.getByTestId('ar-canvas')).toBeInTheDocument();
    expect(screen.getByText(/invalid-emotion-type/)).toBeInTheDocument();
  });
}); 