# Camera Component Documentation

This document provides a comprehensive guide to the `CameraCapture` component, which handles webcam access, image capture, and face detection functionality in the MoodMash application.

## Table of Contents

1. [Component Overview](#component-overview)
2. [Camera Access](#camera-access)
3. [Image Capture](#image-capture)
4. [Face Detection](#face-detection)
5. [Error Handling](#error-handling)
6. [Edge Cases](#edge-cases)
7. [Testing](#testing)

## Component Overview

The `CameraCapture` component provides a user interface for accessing the device camera, capturing images, and performing face detection. It uses the WebRTC API for camera access and TensorFlow.js for face detection.

### Key Features

- Camera access management with user permission handling
- Image capture functionality
- Real-time face detection
- Visual indicators for detected faces
- Comprehensive error handling

### Basic Usage

```tsx
import CameraCapture from './components/camera/CameraCapture';

function App() {
  const handleImageCaptured = (imageData: string) => {
    // Process the captured image data
    console.log('Image captured:', imageData.substring(0, 50) + '...');
  };

  const handleEmotionDetected = (emotions: Array<{ emotion: string, score: number }>) => {
    // Process the detected emotions
    console.log('Detected emotions:', emotions);
  };

  return (
    <CameraCapture
      onImageCaptured={handleImageCaptured}
      onEmotionDetected={handleEmotionDetected}
      width={640}
      height={480}
    />
  );
}
```

## Camera Access

The component uses the WebRTC API's `getUserMedia` method to access the device camera.

### Camera Initialization

The camera is initialized when the user clicks the "Start Camera" button. This triggers the `setupCamera` function which:

1. Requests camera access with the specified constraints
2. Sets up the video element with the camera stream
3. Activates the camera UI state

### Camera Shutdown

When the component is unmounted or when the user stops the camera, the `stopCamera` function:

1. Gets all tracks from the media stream
2. Calls `stop()` on each track
3. Sets the video source to null
4. Deactivates the camera UI state

## Image Capture

Once the camera is active, the user can capture images using the "Capture" button.

### Capture Process

1. The current video frame is drawn onto a canvas element
2. The canvas content is converted to a data URL (`image/jpeg` format)
3. The image data is passed to the `onImageCaptured` callback prop
4. Face detection is triggered on the captured frame

### Image Data Format

The captured image is provided as a base64-encoded data URL string in JPEG format:

```
data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgID...
```

## Face Detection

The component uses TensorFlow.js's face detection API to detect faces in captured images.

### Detection Process

1. The TensorFlow face detection model is loaded when the component mounts
2. When an image is captured, the `detectFace` function is called
3. The function processes the video frame to detect faces
4. Detected faces are filtered based on confidence scores
5. Visualizations are drawn on the canvas to highlight detected faces
6. Mock emotion data is generated for demo purposes (in a real app, this would use an emotion detection model)

### Face Visualization

For each detected face, the component:

1. Draws a bounding box around the face
2. Colors the box based on confidence level (green: high, yellow: medium, red: low)
3. Displays the confidence percentage if available
4. Draws keypoints for facial features when available

## Error Handling

The component implements robust error handling for various scenarios:

### Camera Access Errors

When camera access is denied or unavailable:

1. The error is caught and logged
2. A user-friendly error message is displayed on the UI
3. The `setCameraError` state is updated with the error message

### Model Loading Errors

If the face detection model fails to load:

1. The error is caught and logged
2. The component continues to function for image capture without face detection
3. The `isModelLoading` state is set to false to avoid infinite loading

### Face Detection Errors

When face detection fails:

1. The error is caught and logged
2. A visual error message is displayed on the canvas
3. The component remains usable for further capture attempts

## Edge Cases

The component handles several edge cases:

### No Faces Detected

If no faces are detected in the image:
- The canvas is cleared of previous visualizations
- A "No face detected" message is displayed on the canvas

### Multiple Faces Detected

When multiple faces are detected:
- Each face is drawn with its own bounding box and confidence level
- All faces are processed for emotion detection

### Low Confidence Detections

For faces with low confidence scores:
- A filtering mechanism removes faces with confidence below 0.2 (configurable)
- Remaining faces are color-coded to indicate confidence level

### Partial Faces / Faces at Edge of Frame

The component handles partially visible faces:
- Only keypoints that are within the frame boundaries are displayed
- Bounding boxes are still drawn for partially visible faces

## Testing

The component is thoroughly tested using several test files:

### Unit Tests

- `CameraCapture.test.tsx`: Basic component rendering and functionality tests
- `CameraCapture.errors.test.tsx`: Tests for error handling scenarios
- `CameraCapture.errors.simple.test.tsx`: Simplified error handling tests
- `CameraCapture.edgecases.test.tsx`: Tests for edge case scenarios
- `CameraCapture.mocks.test.tsx`: Tests using WebRTC and Canvas mocks

### Mocks

The component uses specialized mocks for testing:

- `webrtc-mock.ts`: Mocks the MediaDevices API for camera testing
- `canvas-mock.ts`: Mocks Canvas API for drawing and visualization testing

Refer to `src/components/camera/__tests__/README.md` for more details on testing methodology.

## Further Resources

- [MDN: MediaDevices.getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [TensorFlow.js Face Detection](https://github.com/tensorflow/tfjs-models/tree/master/face-detection)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) 