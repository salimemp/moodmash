import CameraMoodPage from '@/pages/camera-mood';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/router';
import { describe, expect, it, vi } from 'vitest';

// Mock the components used in the page
vi.mock('@/components/camera/CameraCapture', () => ({
  default: vi.fn().mockImplementation(({ onEmotionDetected, onImageCaptured }) => (
    <div data-testid="mock-camera-capture">
      <button 
        onClick={() => onEmotionDetected?.([
          { emotion: 'joy', score: 0.8 },
          { emotion: 'sadness', score: 0.2 },
        ])}
      >
        Mock Detect Emotions
      </button>
      <button 
        onClick={() => onImageCaptured?.('data:image/jpeg;base64,mockImageData')}
      >
        Mock Capture Image
      </button>
    </div>
  )),
}));

vi.mock('@/components/ar/MoodAR', () => ({
  default: vi.fn().mockImplementation(({ emotions, capturedImage }) => (
    <div data-testid="mock-mood-ar">
      <div>Mock AR Component</div>
      <div>Emotions: {JSON.stringify(emotions)}</div>
      <div>Image: {capturedImage?.substring(0, 30)}...</div>
    </div>
  )),
}));

vi.mock('@/components/layout/main-layout', () => ({
  MainLayout: vi.fn().mockImplementation(({ children }) => (
    <div data-testid="mock-main-layout">{children}</div>
  )),
}));

vi.mock('next/router', () => ({
  useRouter: vi.fn()
}));

describe('CameraMoodPage', () => {
  it('renders the initial camera capture step', () => {
    render(<CameraMoodPage />);
    
    // Check title and description
    expect(screen.getByText(/camera mood creator/i)).toBeInTheDocument();
    expect(screen.getByText(/express yourself with our camera-based mood creation tool/i)).toBeInTheDocument();
    
    // Check step 1 is visible
    expect(screen.getByText(/step 1: capture your mood/i)).toBeInTheDocument();
    
    // The camera component should be rendered
    expect(screen.getByTestId('mock-camera-capture')).toBeInTheDocument();
  });
  
  it('transitions to AR step when image is captured', async () => {
    const user = userEvent.setup();
    render(<CameraMoodPage />);
    
    // Find and click the mock capture button
    const captureButton = screen.getByText(/mock capture image/i);
    await user.click(captureButton);
    
    // Should transition to step 2
    expect(screen.getByText(/step 2: your mood in ar/i)).toBeInTheDocument();
    
    // AR component should be visible
    expect(screen.getByTestId('mock-mood-ar')).toBeInTheDocument();
  });
  
  it('transitions to save step when continue is clicked', async () => {
    const user = userEvent.setup();
    render(<CameraMoodPage />);
    
    // First capture an image to get to step 2
    const captureButton = screen.getByText(/mock capture image/i);
    await user.click(captureButton);
    
    // Now click continue to go to step 3
    const continueButton = screen.getByRole('button', { name: /continue/i });
    await user.click(continueButton);
    
    // Should transition to step 3
    expect(screen.getByText(/step 3: save your mood/i)).toBeInTheDocument();
  });
  
  it('resets the process when "Try Again" is clicked', async () => {
    const user = userEvent.setup();
    render(<CameraMoodPage />);
    
    // First capture an image to get to step 2
    const captureButton = screen.getByText(/mock capture image/i);
    await user.click(captureButton);
    
    // Click "Try Again" to reset
    const tryAgainButton = screen.getByRole('button', { name: /try again/i });
    await user.click(tryAgainButton);
    
    // Should go back to step 1
    expect(screen.getByText(/step 1: capture your mood/i)).toBeInTheDocument();
  });
  
  it('handles saving a mood', async () => {
    // Mock alert and console.log
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    
    const user = userEvent.setup();
    const mockRouter = { push: vi.fn() };
    
    // Fix: Use the vi.fn() from the import mock, not vi.mocked
    (useRouter as any).mockReturnValue(mockRouter);
    
    render(<CameraMoodPage />);
    
    // Go through all steps
    // Step 1: Capture image 
    const captureButton = screen.getByRole('button', { name: /mock capture image/i });
    if (!captureButton) {
      // Debug what's available
      screen.debug();
      throw new Error('Capture button not found');
    }
    await user.click(captureButton);
    
    // Continue to step 3
    const continueButton = screen.getByRole('button', { name: /continue/i });
    await user.click(continueButton);
    
    // Step 3: Save the mood
    const saveButton = screen.getByRole('button', { name: /save mood/i });
    await user.click(saveButton);
    
    // Verify router was called to navigate to dashboard
    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
  });
}); 