import * as faceDetection from '@tensorflow-models/face-detection';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-core';
import React, { useEffect, useRef, useState } from 'react';
import LoadingSpinner from '../common/LoadingSpinner';
import { Button } from '../ui/button/button';

export interface FaceEmotion {
  emotion: string;
  score: number;
}

// Extended Face interface with confidence score
interface ExtendedFace extends faceDetection.Face {
  score?: number;
}

interface CameraCaptureProps {
  onEmotionDetected?: (emotions: FaceEmotion[]) => void;
  onImageCaptured?: (imageData: string) => void;
  width?: number;
  height?: number;
  buttonText?: string;
  captureButtonText?: string;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({
  onEmotionDetected,
  onImageCaptured,
  width = 640,
  height = 480,
  buttonText = 'Start Camera',
  captureButtonText = 'Capture',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [detector, setDetector] = useState<faceDetection.FaceDetector | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Load face detection model
  useEffect(() => {
    const loadModel = async () => {
      try {
        setIsModelLoading(true);
        
        // Load model
        const model = faceDetection.SupportedModels.MediaPipeFaceDetector;
        const detectionConfig = {
          runtime: 'mediapipe',
          solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_detection',
        } as any; // Using any type to avoid type issues
        
        const faceDetector = await faceDetection.createDetector(model, detectionConfig);
        setDetector(faceDetector);
      } catch (error) {
        console.error('Failed to load face detection model:', error);
      } finally {
        setIsModelLoading(false);
      }
    };

    loadModel();

    // Clean up
    return () => {
      // No specific cleanup needed for the model
    };
  }, []);

  // Set up camera
  const setupCamera = async () => {
    if (!videoRef.current) return;
    
    try {
      setCameraError(null);
      setIsLoading(true);
      
      const constraints = {
        video: {
          facingMode: 'user',
          width: { ideal: width },
          height: { ideal: height }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoRef.current.srcObject = stream;
      
      // Wait for video to be ready
      await new Promise<void>((resolve) => {
        if (!videoRef.current) return;
        videoRef.current.onloadedmetadata = () => {
          resolve();
        };
      });
      
      videoRef.current.play();
      setIsCameraActive(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraError('Could not access the camera. Please check permissions and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };

  // Toggle camera
  const toggleCamera = async () => {
    if (isCameraActive) {
      stopCamera();
    } else {
      await setupCamera();
    }
  };

  // Capture image
  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Draw the current frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get image data as URL
    const imageData = canvas.toDataURL('image/jpeg');
    
    // Send to parent component
    if (onImageCaptured) {
      onImageCaptured(imageData);
    }
    
    // Detect faces and emotions
    detectFace();
  };

  // Detect faces
  const detectFace = async () => {
    if (!detector || !videoRef.current || !canvasRef.current) return;
    
    try {
      const video = videoRef.current;
      
      // Detect faces
      const faces = await detector.estimateFaces(video) as ExtendedFace[];
      
      if (faces.length > 0) {
        // Filter out very low confidence detections (threshold can be adjusted)
        const confidenceFaces = faces.filter(face => !face.score || face.score > 0.2);
        
        // In a real app, we would analyze facial features for actual emotion detection
        // For demo purposes, we'll generate random emotions
        const mockEmotions: FaceEmotion[] = [
          { emotion: 'joy', score: Math.random() },
          { emotion: 'sadness', score: Math.random() * 0.7 },
          { emotion: 'anger', score: Math.random() * 0.4 },
          { emotion: 'surprise', score: Math.random() * 0.5 }
        ];
        
        // Sort by score
        mockEmotions.sort((a, b) => b.score - a.score);
        
        // Notify parent
        if (onEmotionDetected) {
          onEmotionDetected(mockEmotions);
        }
        
        // Draw face detection visualization
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Clear canvas
          ctx.fillStyle = 'rgba(0, 0, 0, 0)';
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Draw faces with different colors for different confidence levels
          confidenceFaces.forEach(face => {
            // Determine color based on confidence
            const confidence = face.score || 1.0;
            let strokeColor = '#00FF00'; // High confidence (green)
            if (confidence < 0.5) {
              strokeColor = '#FF0000'; // Low confidence (red)
            } else if (confidence < 0.7) {
              strokeColor = '#FFFF00'; // Medium confidence (yellow)
            }
            
            const box = face.box;
            
            // Draw bounding box
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(box.xMin, box.yMin, box.width, box.height);
            
            // Draw confidence score if available
            if (face.score !== undefined) {
              ctx.fillStyle = strokeColor;
              ctx.font = '12px Arial';
              ctx.fillText(`${Math.round(face.score * 100)}%`, box.xMin, box.yMin - 5);
            }
            
            // Draw keypoints if available
            if (face.keypoints) {
              face.keypoints.forEach(keypoint => {
                // Only draw keypoints that are visible (within frame)
                if (keypoint.x >= 0 && keypoint.y >= 0 && 
                    keypoint.x <= canvas.width && keypoint.y <= canvas.height) {
                  ctx.fillStyle = '#FF0000';
                  ctx.beginPath();
                  ctx.arc(keypoint.x, keypoint.y, 3, 0, 2 * Math.PI);
                  ctx.fill();
                }
              });
            }
          });
        }
      } else {
        // No faces detected case - clear any previous drawings
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Show "No face detected" message
          ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
          ctx.font = '20px Arial';
          ctx.fillText('No face detected', canvas.width / 2 - 80, canvas.height / 2);
        }
      }
    } catch (error) {
      console.error('Error detecting faces:', error);
      
      // Display error message on canvas
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Show error message
          ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
          ctx.font = '16px Arial';
          ctx.fillText('Face detection error', canvas.width / 2 - 80, canvas.height / 2 - 10);
          ctx.fillText('Please try again', canvas.width / 2 - 60, canvas.height / 2 + 20);
        }
      }
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      <div 
        className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden mb-4"
        data-testid="camera-container"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        {isLoading || isModelLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <LoadingSpinner size="lg" />
            <span className="ml-2 text-sm">
              {isModelLoading ? 'Loading face detection model...' : 'Setting up camera...'}
            </span>
          </div>
        ) : cameraError ? (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-destructive">
            {cameraError}
          </div>
        ) : null}
        
        <video 
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
        
        <canvas 
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
        />
      </div>
      
      <div className="flex gap-2 w-full mb-4">
        <Button
          onClick={toggleCamera}
          className="flex-1"
          variant={isCameraActive ? "destructive" : "default"}
        >
          {buttonText}
        </Button>
        
        {isCameraActive && (
          <Button
            onClick={captureImage}
            className="flex-1"
            variant="default"
            disabled={isLoading || isModelLoading}
          >
            {captureButtonText}
          </Button>
        )}
      </div>
    </div>
  );
};

export default CameraCapture; 