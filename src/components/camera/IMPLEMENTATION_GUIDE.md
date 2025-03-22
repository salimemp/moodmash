# CameraCapture Implementation Guide

This guide provides detailed instructions for developers who want to use, customize, or extend the `CameraCapture` component in their applications.

## Table of Contents

1. [Basic Integration](#basic-integration)
2. [Component Props](#component-props)
3. [Callback Handling](#callback-handling)
4. [Customization Options](#customization-options)
5. [Advanced Usage](#advanced-usage)
6. [Extending the Component](#extending-the-component)

## Basic Integration

### Installation

First, ensure that the necessary dependencies are installed:

```bash
npm install @tensorflow-models/face-detection @tensorflow/tfjs-core @tensorflow/tfjs-backend-webgl
```

### Basic Implementation

Import and use the component in your React application:

```tsx
import React from 'react';
import CameraCapture from '../components/camera/CameraCapture';

function MyComponent() {
  const handleImageCaptured = (imageData: string) => {
    // Handle the captured image data
    console.log('Image captured');
  };

  const handleEmotionDetected = (emotions: Array<{ emotion: string, score: number }>) => {
    // Handle the detected emotions
    console.log('Emotions detected:', emotions);
  };

  return (
    <div className="my-camera-container">
      <h2>Camera Feed</h2>
      <CameraCapture 
        onImageCaptured={handleImageCaptured}
        onEmotionDetected={handleEmotionDetected}
      />
    </div>
  );
}

export default MyComponent;
```

## Component Props

The `CameraCapture` component accepts the following props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onImageCaptured` | `(imageData: string) => void` | `undefined` | Callback function triggered when an image is captured |
| `onEmotionDetected` | `(emotions: FaceEmotion[]) => void` | `undefined` | Callback function triggered when emotions are detected |
| `width` | `number` | `640` | Width of the camera viewport in pixels |
| `height` | `number` | `480` | Height of the camera viewport in pixels |
| `buttonText` | `string` | `'Start Camera'` | Text for the camera toggle button |
| `captureButtonText` | `string` | `'Capture'` | Text for the image capture button |

### FaceEmotion Interface

```typescript
interface FaceEmotion {
  emotion: string;  // The type of emotion (e.g., "joy", "sadness")
  score: number;    // Confidence score between 0 and 1
}
```

## Callback Handling

### Image Capture Callback

The `onImageCaptured` callback receives a base64-encoded data URL of the captured image. Here's how to use it:

```tsx
const handleImageCaptured = (imageData: string) => {
  // Display the image
  setPreviewImage(imageData);
  
  // Save the image to state
  setSavedImages(prev => [...prev, imageData]);
  
  // Upload to server
  uploadImageToServer(imageData);
};
```

### Emotion Detection Callback

The `onEmotionDetected` callback receives an array of emotions with confidence scores:

```tsx
const handleEmotionDetected = (emotions: Array<{ emotion: string, score: number }>) => {
  // Get the dominant emotion (highest score)
  const dominantEmotion = emotions.reduce(
    (prev, current) => (prev.score > current.score ? prev : current),
    { emotion: '', score: 0 }
  );
  
  // Update UI
  setCurrentMood(dominantEmotion.emotion);
  
  // Log emotions for analytics
  logEmotionData(emotions);
};
```

## Customization Options

### Styling

The component uses CSS classes that can be targeted for styling:

```css
/* Target the container */
.camera-container {
  border: 2px solid #3498db;
  border-radius: 8px;
  background-color: #f0f0f0;
}

/* Style the buttons */
.camera-start-button {
  background-color: #2ecc71;
}

.camera-capture-button {
  background-color: #e74c3c;
}
```

### Custom Button Text

You can customize button text using props:

```tsx
<CameraCapture
  buttonText="Enable Webcam"
  captureButtonText="Take Photo"
  onImageCaptured={handleCapture}
/>
```

## Advanced Usage

### Custom Face Visualization

To implement custom visualization, you'll need to extend the component:

1. Create a wrapper component that receives the canvas reference
2. Implement custom drawing logic using the canvas API
3. Pass data from CameraCapture to your custom visualization

Example:

```tsx
function CustomFaceVisualization({ canvasRef, faceData }) {
  useEffect(() => {
    if (canvasRef.current && faceData) {
      const ctx = canvasRef.current.getContext('2d');
      // Custom drawing logic here
    }
  }, [canvasRef, faceData]);
  
  return null; // This is just a logic component
}
```

### Integrating with State Management

Example with React Context:

```tsx
function CameraWithContext() {
  const { dispatch } = useAppContext();
  
  const handleCapture = (imageData) => {
    dispatch({ type: 'SET_USER_IMAGE', payload: imageData });
  };
  
  const handleEmotions = (emotions) => {
    dispatch({ type: 'SET_USER_EMOTIONS', payload: emotions });
  };
  
  return (
    <CameraCapture
      onImageCaptured={handleCapture}
      onEmotionDetected={handleEmotions}
    />
  );
}
```

## Extending the Component

### Creating a Custom Version

To create a custom version of the component:

1. Create a new component file that imports CameraCapture
2. Add your additional functionality
3. Return the CameraCapture with appropriate props

Example:

```tsx
import React, { useState } from 'react';
import CameraCapture from './CameraCapture';
import ImageGallery from './ImageGallery';

function EnhancedCamera() {
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  
  const handleCapture = (imageData: string) => {
    setCapturedImages(prev => [...prev, imageData]);
  };
  
  return (
    <div className="enhanced-camera">
      <CameraCapture onImageCaptured={handleCapture} />
      <ImageGallery images={capturedImages} />
      <button onClick={() => setCapturedImages([])}>Clear Gallery</button>
    </div>
  );
}

export default EnhancedCamera;
```

### Adding Real Emotion Detection

The current component uses mock emotions. To implement real emotion detection:

1. Import a facial expression analysis library 
2. Modify the `detectFace` function to use real emotion detection
3. Process the detected face image with the emotion detection model

Example pseudocode:

```tsx
import * as faceapi from 'face-api.js';

// In your component:
const detectEmotions = async (faceImage) => {
  // Load models if not already loaded
  if (!modelsLoaded) {
    await faceapi.nets.faceExpressionNet.loadFromUri('/models');
    setModelsLoaded(true);
  }
  
  // Detect expressions
  const detections = await faceapi.detectSingleFace(faceImage)
    .withFaceExpressions();
    
  if (detections) {
    const emotions = Object.entries(detections.expressions)
      .map(([emotion, score]) => ({ emotion, score }))
      .sort((a, b) => b.score - a.score);
      
    return emotions;
  }
  
  return [];
};
```

### Performance Optimizations

For improved performance:

1. Use the `useCallback` hook for handler functions
2. Implement proper memoization with `useMemo`
3. Consider using a Web Worker for face detection processing

Example:

```tsx
// Memoize handlers
const handleCapture = useCallback((imageData: string) => {
  // Handle capture
}, [dependencies]);

// Memoize expensive computations
const processedData = useMemo(() => {
  return expensiveComputation(rawData);
}, [rawData]);
```

## Troubleshooting

Common issues and their solutions:

1. **Camera access denied**: Ensure your app is served over HTTPS and the user has granted permission
2. **Face detection not working**: Check console for TensorFlow errors; ensure models are loaded properly
3. **Poor performance**: Reduce video dimensions, implement throttling for face detection

## Further Resources

- [TensorFlow.js Face Detection Documentation](https://github.com/tensorflow/tfjs-models/tree/master/face-detection)
- [WebRTC Camera Access Guide](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [Canvas Drawing API Reference](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D) 