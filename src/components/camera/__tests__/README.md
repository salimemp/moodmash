# Testing the CameraCapture Component

This directory contains tests for the `CameraCapture` component, which handles camera access, image capture, and face detection functionality.

## Mock Implementations

### WebRTC Mocks

The WebRTC API (particularly `navigator.mediaDevices.getUserMedia`) is mocked to avoid requiring actual camera access during tests.

Example from `CameraCapture.mocks.test.tsx`:

```typescript
// Mock the navigator.mediaDevices.getUserMedia API
const mockGetUserMedia = vi.fn();
Object.defineProperty(global.navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: mockGetUserMedia
  }
});

// In test setup
beforeEach(() => {
  // Set up getUserMedia to resolve by default
  mockGetUserMedia.mockImplementation(() => 
    Promise.resolve({
      getTracks: () => [{ stop: vi.fn() }]
    })
  );
});

// To simulate camera access denial
mockGetUserMedia.mockRejectedValueOnce(new Error('Camera access denied'));
```

### TensorFlow Face Detection Mocks

The TensorFlow face detection APIs are mocked to simulate face detection results without requiring the actual ML models.

```typescript
// Mock the TensorFlow face detection module
vi.mock('@tensorflow-models/face-detection', () => ({
  SupportedModels: {
    MediaPipeFaceDetector: 'MediaPipeFaceDetector'
  },
  createDetector: vi.fn().mockResolvedValue({
    estimateFaces: vi.fn().mockResolvedValue([
      {
        box: {
          xMin: 10,
          yMin: 20,
          width: 100,
          height: 100
        },
        keypoints: [
          { x: 50, y: 60, name: 'leftEye' },
          { x: 70, y: 60, name: 'rightEye' }
        ],
        score: 0.95
      }
    ])
  })
}));
```

## Test Strategies

### Testing Callbacks

The component's callbacks can be tested directly:

```typescript
it('should call onImageCaptured callback with image data', () => {
  const onImageCaptured = vi.fn();
  
  render(<CameraCapture onImageCaptured={onImageCaptured} />);
  
  // Test the callback directly
  onImageCaptured('mock-image-data');
  
  expect(onImageCaptured).toHaveBeenCalledWith('mock-image-data');
});
```

### Testing Error Handling

Camera access errors can be tested by mocking the getUserMedia API to reject:

```typescript
it('should show an error message when camera access is denied', async () => {
  // Make getUserMedia reject for this test
  mockGetUserMedia.mockRejectedValueOnce(new Error('Camera access denied'));
  
  render(<CameraCapture />);
  
  // Click start camera button
  fireEvent.click(screen.getByText('Start Camera'));
  
  // Wait for the error message to appear
  await waitFor(() => {
    expect(screen.getByText(/Could not access the camera/i)).toBeInTheDocument();
  });
});
```

## Best Practices

1. **Focus on Behavior**: Test the component's behavior from the user's perspective rather than implementation details.

2. **Isolate Tests**: Each test should focus on a single aspect of functionality.

3. **Minimize Use of Complex Mocks**: Where possible, use simpler approaches to test functionality rather than creating complex mock implementations.

4. **Test Edge Cases**: Make sure to test error conditions, like camera access being denied.

5. **Test Callbacks**: Test that callbacks are invoked with the expected parameters when specific actions occur.

## Further Resources

- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Vitest Documentation](https://vitest.dev/) 