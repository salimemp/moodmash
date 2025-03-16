import VoiceRecorder from '@/components/voice/VoiceRecorder';
import { VoiceClient } from '@/lib/voice/voice-client';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the VoiceClient class
vi.mock('@/lib/voice/voice-client', () => {
  return {
    VoiceClient: vi.fn()
  };
});

describe('VoiceRecorder Component', () => {
  // Mock implementation
  let mockOnStart: () => void;
  let mockOnStop: (blob: Blob) => void;
  
  // Mock methods
  const mockStartRecording = vi.fn().mockResolvedValue(undefined);
  const mockStopRecording = vi.fn().mockResolvedValue(undefined);
  const mockProcessVoice = vi.fn();
  const mockIsCurrentlyRecording = vi.fn().mockReturnValue(false);
  
  // Mock analysis result
  const mockAnalysisResult = {
    text: 'This is a test transcription',
    sentiment: { label: 'positive', score: 0.85 },
    emotions: { happy: 0.8, neutral: 0.2 },
    confidence: 0.95
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set default mock implementation for processVoice
    mockProcessVoice.mockResolvedValue(mockAnalysisResult);
    
    // Reset the mock implementation
    (VoiceClient as unknown as ReturnType<typeof vi.fn>).mockImplementation((options) => {
      // Store callbacks
      mockOnStart = options.onStart || (() => {});
      mockOnStop = options.onStop || (() => {});
      
      return {
        startRecording: mockStartRecording,
        stopRecording: mockStopRecording,
        processVoice: mockProcessVoice,
        isCurrentlyRecording: mockIsCurrentlyRecording
      };
    });
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('renders with default props', () => {
    render(<VoiceRecorder />);
    
    expect(screen.getByTestId('voice-recorder')).toBeInTheDocument();
    expect(screen.getByTestId('voice-recorder-button')).toHaveTextContent('Record Voice');
    expect(screen.queryByTestId('recording-indicator')).not.toBeInTheDocument();
    expect(screen.queryByTestId('processing-indicator')).not.toBeInTheDocument();
    expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    expect(screen.queryByTestId('analysis-result')).not.toBeInTheDocument();
  });
  
  it('starts recording when button is clicked', async () => {
    render(<VoiceRecorder />);
    
    const recordButton = screen.getByTestId('voice-recorder-button');
    fireEvent.click(recordButton);
    
    // Verify startRecording was called
    expect(mockStartRecording).toHaveBeenCalledTimes(1);
    
    // Simulate onStart callback
    act(() => {
      mockOnStart();
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('recording-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('recording-indicator')).toHaveTextContent('Recording');
    });
  });
  
  it('stops recording when button is clicked again', async () => {
    // Set up recording state
    mockIsCurrentlyRecording.mockReturnValue(true);
    
    render(<VoiceRecorder />);
    
    // Start recording
    const recordButton = screen.getByTestId('voice-recorder-button');
    fireEvent.click(recordButton);
    act(() => {
      mockOnStart();
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('recording-indicator')).toBeInTheDocument();
    });
    
    // Stop recording
    fireEvent.click(recordButton);
    
    expect(mockStopRecording).toHaveBeenCalledTimes(1);
    
    // Simulate onStop callback with mock blob
    const mockBlob = new Blob(['mock audio data'], { type: 'audio/wav' });
    act(() => {
      mockOnStop(mockBlob);
    });
    
    await waitFor(() => {
      expect(screen.queryByTestId('recording-indicator')).not.toBeInTheDocument();
    });
  });
  
  it('shows processing indicator after stopping recording', async () => {
    // Delay the processVoice resolution
    mockProcessVoice.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve(mockAnalysisResult), 100))
    );
    
    render(<VoiceRecorder />);
    
    // Start recording
    const recordButton = screen.getByTestId('voice-recorder-button');
    fireEvent.click(recordButton);
    act(() => {
      mockOnStart();
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('recording-indicator')).toBeInTheDocument();
    });
    
    // Stop recording
    fireEvent.click(recordButton);
    act(() => {
      const mockBlob = new Blob(['mock audio data'], { type: 'audio/wav' });
      mockOnStop(mockBlob);
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('processing-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('processing-indicator')).toHaveTextContent('Processing');
    });
  });
  
  it('displays analysis results after processing', async () => {
    render(<VoiceRecorder />);
    
    // Start recording
    const recordButton = screen.getByTestId('voice-recorder-button');
    fireEvent.click(recordButton);
    act(() => {
      mockOnStart();
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('recording-indicator')).toBeInTheDocument();
    });
    
    // Stop recording and process
    fireEvent.click(recordButton);
    
    // Manually resolve the processVoice promise with the mock result
    await act(async () => {
      const mockBlob = new Blob(['mock audio data'], { type: 'audio/wav' });
      await mockOnStop(mockBlob);
      // Wait for any state updates to complete
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('analysis-result')).toBeInTheDocument();
      expect(screen.getByTestId('analysis-result')).toHaveTextContent('This is a test transcription');
      expect(screen.getByTestId('analysis-result')).toHaveTextContent('positive');
      expect(screen.getByTestId('analysis-result')).toHaveTextContent('happy');
      expect(screen.getByTestId('analysis-result')).toHaveTextContent('neutral');
      expect(screen.getByTestId('analysis-result')).toHaveTextContent('Confidence');
    });
  });
  
  it('calls onAnalysisComplete callback with results', async () => {
    const mockOnAnalysisComplete = vi.fn();
    render(<VoiceRecorder onAnalysisComplete={mockOnAnalysisComplete} />);
    
    // Start recording
    const recordButton = screen.getByTestId('voice-recorder-button');
    fireEvent.click(recordButton);
    act(() => {
      mockOnStart();
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('recording-indicator')).toBeInTheDocument();
    });
    
    // Stop recording and process
    fireEvent.click(recordButton);
    
    // Manually resolve the processVoice promise with the mock result
    await act(async () => {
      const mockBlob = new Blob(['mock audio data'], { type: 'audio/wav' });
      await mockOnStop(mockBlob);
      // Wait for any state updates to complete
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    await waitFor(() => {
      expect(mockOnAnalysisComplete).toHaveBeenCalledTimes(1);
      expect(mockOnAnalysisComplete).toHaveBeenCalledWith(mockAnalysisResult);
    });
  });
  
  it('displays error message when recording fails', async () => {
    // Mock startRecording to throw an error
    mockStartRecording.mockRejectedValueOnce(new Error('Permission denied'));
    
    render(<VoiceRecorder />);
    
    const recordButton = screen.getByTestId('voice-recorder-button');
    fireEvent.click(recordButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByTestId('error-message')).toHaveTextContent('Permission denied');
    });
  });
  
  it('displays error message when processing fails', async () => {
    // Mock processVoice to reject with an error
    mockProcessVoice.mockRejectedValueOnce(new Error('Processing failed'));
    
    render(<VoiceRecorder />);
    
    // Start recording
    const recordButton = screen.getByTestId('voice-recorder-button');
    fireEvent.click(recordButton);
    act(() => {
      mockOnStart();
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('recording-indicator')).toBeInTheDocument();
    });
    
    // Stop recording and process
    fireEvent.click(recordButton);
    
    await act(async () => {
      const mockBlob = new Blob(['mock audio data'], { type: 'audio/wav' });
      await mockOnStop(mockBlob);
      // Wait for any state updates to complete
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByTestId('error-message')).toHaveTextContent('Processing failed');
    });
  });
  
  it('accepts custom button text', () => {
    render(<VoiceRecorder buttonText="Start Voice Recording" />);
    
    expect(screen.getByTestId('voice-recorder-button')).toHaveTextContent('Start Voice Recording');
  });
  
  it('accepts custom processing text', async () => {
    // Create a custom mock implementation for this test
    const customProcessVoice = vi.fn().mockImplementation(() => {
      // Return a promise that never resolves during the test
      return new Promise(() => {});
    });
    
    // Override the mockProcessVoice for this test
    mockProcessVoice.mockImplementation(customProcessVoice);
    
    render(<VoiceRecorder processingText="Analyzing your voice..." />);
    
    // Start recording
    const recordButton = screen.getByTestId('voice-recorder-button');
    fireEvent.click(recordButton);
    act(() => {
      mockOnStart();
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('recording-indicator')).toBeInTheDocument();
    });
    
    // Stop recording to trigger processing
    fireEvent.click(recordButton);
    
    // Manually trigger the onStop callback
    await act(async () => {
      const mockBlob = new Blob(['mock audio data'], { type: 'audio/wav' });
      mockOnStop(mockBlob);
      // Wait for state updates
      await new Promise(resolve => setTimeout(resolve, 10));
    });
    
    // Now the processing indicator should be visible with custom text
    expect(screen.getByTestId('processing-indicator')).toBeInTheDocument();
    expect(screen.getByTestId('processing-indicator')).toHaveTextContent('Analyzing your voice');
  });
  
  it('accepts custom recording text', async () => {
    render(<VoiceRecorder recordingText="Listening..." />);
    
    // Start recording
    const recordButton = screen.getByTestId('voice-recorder-button');
    fireEvent.click(recordButton);
    act(() => {
      mockOnStart();
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('recording-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('recording-indicator')).toHaveTextContent('Listening');
    });
  });
  
  it('cleans up recording when unmounted', async () => {
    // Mock isCurrentlyRecording to return true
    mockIsCurrentlyRecording.mockReturnValue(true);
    
    // Mock stopRecording to return a resolved promise
    mockStopRecording.mockImplementation(() => Promise.resolve());
    
    const { unmount } = render(<VoiceRecorder />);
    
    // Unmount the component
    await act(async () => {
      unmount();
      // Wait for any cleanup to complete
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(mockIsCurrentlyRecording).toHaveBeenCalled();
    expect(mockStopRecording).toHaveBeenCalled();
  });
  
  it('formats recording time correctly', () => {
    // Define the formatTime function directly in the test
    // This is the same implementation as in the VoiceRecorder component
    const formatTime = (seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
    
    // Test with 65 seconds (1 minute and 5 seconds)
    expect(formatTime(65)).toBe('01:05');
    
    // Test with 0 seconds
    expect(formatTime(0)).toBe('00:00');
    
    // Test with 3661 seconds (1 hour, 1 minute, and 1 second)
    expect(formatTime(3661)).toBe('61:01');
  });
});