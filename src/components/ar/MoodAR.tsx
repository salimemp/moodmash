import { type Emotion } from '@/lib/ml/sentiment-analyzer';
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import LoadingSpinner from '../common/LoadingSpinner';

interface MoodARProps {
  emotions?: Emotion[];
  capturedImage?: string;
  width?: number;
  height?: number;
}

const MoodAR: React.FC<MoodARProps> = ({
  emotions = [],
  capturedImage,
  width = 400,
  height = 300,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Setup Three.js scene
  useEffect(() => {
    if (!containerRef.current) return () => {};
    
    setIsLoading(true);
    setError(null);
    
    // For cleaning up event listeners in case of error
    let cleanup = () => {};
    
    try {
      // Create scene, camera, and renderer
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(width, height);
      renderer.setClearColor(0x000000, 0);
      
      // Clear container and add renderer
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(renderer.domElement);
      
      // Setup camera
      camera.position.z = 5;
      
      // Create backdrop if image is provided
      if (capturedImage) {
        // Create a plane for the captured image
        const texture = new THREE.TextureLoader().load(capturedImage);
        const geometry = new THREE.PlaneGeometry(5, 3.75); // 4:3 aspect ratio
        const material = new THREE.MeshBasicMaterial({ 
          map: texture, 
          transparent: true,
          opacity: 0.7,
        });
        const backdrop = new THREE.Mesh(geometry, material);
        backdrop.position.z = -3;
        scene.add(backdrop);
      }
      
      // Create 3D visualizations based on emotions
      const emotionObjects: THREE.Mesh[] = [];
      
      emotions.forEach((emotion, index) => {
        // Color based on emotion
        const color = getEmotionColor(emotion.type);
        
        // Size based on score
        const size = 0.5 + (emotion.score * 1.5);
        
        // Position based on index
        const position = {
          x: Math.sin(index * (Math.PI / 2)) * 2,
          y: Math.cos(index * (Math.PI / 2)) * 2,
          z: 0
        };
        
        // Create geometry based on emotion
        let geometry;
        switch (emotion.type) {
          case 'joy':
            geometry = new THREE.SphereGeometry(size, 32, 32);
            break;
          case 'sadness':
            geometry = new THREE.ConeGeometry(size, size * 2, 32);
            break;
          case 'anger':
            geometry = new THREE.TetrahedronGeometry(size);
            break;
          case 'fear':
            geometry = new THREE.BoxGeometry(size, size, size);
            break;
          case 'surprise':
            geometry = new THREE.IcosahedronGeometry(size);
            break;
          case 'disgust':
            geometry = new THREE.OctahedronGeometry(size);
            break;
          default:
            geometry = new THREE.TorusGeometry(size, size * 0.3, 16, 100);
        }
        
        // Create material with emotion color
        const material = new THREE.MeshPhongMaterial({
          color: color,
          transparent: true,
          opacity: 0.8,
          shininess: 100
        });
        
        // Create mesh and add to scene
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, position.y, position.z);
        scene.add(mesh);
        
        // Add to array for animation
        emotionObjects.push(mesh);
      });
      
      // Add lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(5, 5, 5);
      scene.add(directionalLight);
      
      // Animation loop
      const animate = () => {
        requestAnimationFrame(animate);
        
        // Rotate emotion objects
        emotionObjects.forEach((obj, index) => {
          obj.rotation.x += 0.01 * (index % 2 === 0 ? 1 : -1);
          obj.rotation.y += 0.01 * (index % 3 === 0 ? 1 : -1);
        });
        
        renderer.render(scene, camera);
      };
      
      animate();
      
      // Handle resize
      const handleResize = () => {
        if (!containerRef.current) return;
        
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      };
      
      window.addEventListener('resize', handleResize);
      
      // Define cleanup function
      cleanup = () => {
        window.removeEventListener('resize', handleResize);
        
        // Dispose resources
        emotionObjects.forEach(obj => {
          obj.geometry.dispose();
          (obj.material as THREE.Material).dispose();
        });
        
        renderer.dispose();
      };
      
      // Return cleanup function
      return cleanup;
    } catch (err) {
      console.error('Error setting up AR scene:', err);
      setError('Failed to initialize AR visualization. Please try again.');
      // Return empty cleanup function in case of error
      return cleanup;
    } finally {
      setIsLoading(false);
    }
  }, [emotions, capturedImage, width, height]);
  
  return (
    <div className="w-full">
      <div 
        ref={containerRef}
        className="relative w-full rounded-lg overflow-hidden"
        style={{ height: `${height}px` }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <LoadingSpinner size="lg" />
            <span className="ml-2">Loading AR visualization...</span>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted p-4 text-center text-destructive">
            {error}
          </div>
        )}
      </div>
      
      <div className="mt-2 text-sm text-muted-foreground text-center">
        {emotions.length > 0 ? (
          <p>
            Visualizing {emotions.length} emotions in AR: 
            {emotions.map(e => e.type).join(', ')}
          </p>
        ) : (
          <p>Capture an image with your camera to see your mood in AR</p>
        )}
      </div>
    </div>
  );
};

// Helper function to map emotions to colors
const getEmotionColor = (emotion: string): number => {
  const colorMap: Record<string, number> = {
    joy: 0xFFD700, // Gold
    sadness: 0x6495ED, // Cornflower Blue
    anger: 0xFF4500, // Orange Red
    fear: 0x800080, // Purple
    surprise: 0x00FFFF, // Cyan
    disgust: 0x32CD32, // Lime Green
    trust: 0xFFA500, // Orange
    anticipation: 0xFF69B4, // Hot Pink
  };
  
  return colorMap[emotion] || 0xCCCCCC; // Default grey
};

export default MoodAR; 