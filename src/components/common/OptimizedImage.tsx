import { cn } from '@/lib/utils';
import Image from 'next/image';
import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  onLoad?: () => void;
}

/**
 * An optimized image component that supports lazy loading, blur-up effect,
 * and proper loading indicators.
 */
const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  quality = 85,
  objectFit = 'cover',
  onLoad
}) => {
  const [isLoading, setIsLoading] = useState(!priority);
  const [error, setError] = useState(false);

  const handleImageLoad = () => {
    setIsLoading(false);
    if (onLoad) onLoad();
  };

  const handleImageError = () => {
    setIsLoading(false);
    setError(true);
  };

  const objectFitClass = {
    contain: 'object-contain',
    cover: 'object-cover',
    fill: 'object-fill',
    none: 'object-none',
    'scale-down': 'object-scale-down',
  }[objectFit];

  // Fallback image for errors
  if (error) {
    return (
      <div 
        className={cn(
          'bg-muted flex items-center justify-center text-muted-foreground',
          className
        )}
        style={{ width, height }}
      >
        <span>Image not available</span>
      </div>
    );
  }

  return (
    <div className="relative" style={{ width, height }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
          <LoadingSpinner size="sm" />
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        quality={quality}
        className={cn(
          objectFitClass, 
          isLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300',
          className
        )}
        loading={priority ? 'eager' : 'lazy'}
        priority={priority}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    </div>
  );
};

export default OptimizedImage; 