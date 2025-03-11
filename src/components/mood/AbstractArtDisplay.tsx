import { abstractArtGenerator, type ArtGenerationOptions, type GeneratedArt } from '@/lib/art/abstract-generator';
import { type Emotion } from '@/lib/ml/sentiment-analyzer';
import React, { useEffect, useState } from 'react';

interface AbstractArtDisplayProps {
  emotions: Emotion[];
  complexity?: number;
  baseColors?: string[];
  width?: number;
  height?: number;
  className?: string;
  onArtGenerated?: (art: GeneratedArt) => void;
}

/**
 * Component that displays generated abstract art based on emotions
 */
const AbstractArtDisplay: React.FC<AbstractArtDisplayProps> = ({
  emotions,
  complexity = 5,
  baseColors,
  width = 400,
  height = 300,
  className = '',
  onArtGenerated,
}) => {
  const [svgContent, setSvgContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [seed, setSeed] = useState(Math.floor(Math.random() * 10000));
  
  useEffect(() => {
    if (emotions.length === 0) return;
    
    setIsLoading(true);
    
    try {
      const options: ArtGenerationOptions = {
        emotions,
        complexity,
        baseColors,
        size: { width, height },
        seed,
      };
      
      const art = abstractArtGenerator.generateArt(options);
      setSvgContent(art.svgContent);
      
      if (onArtGenerated) {
        onArtGenerated(art);
      }
    } catch (error) {
      console.error('Error generating abstract art:', error);
    } finally {
      setIsLoading(false);
    }
  }, [emotions, complexity, baseColors, width, height, seed, onArtGenerated]);
  
  const regenerateArt = () => {
    setSeed(Math.floor(Math.random() * 10000));
  };
  
  return (
    <div className={`relative ${className}`}>
      {isLoading ? (
        <div 
          className="flex items-center justify-center bg-muted animate-pulse"
          style={{ width, height }}
        >
          <span>Generating art...</span>
        </div>
      ) : (
        <>
          <div 
            className="rounded-lg overflow-hidden"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
          <button
            onClick={regenerateArt}
            className="absolute bottom-3 right-3 bg-background/70 text-foreground px-2 py-1 rounded-md text-xs hover:bg-background/90 transition-colors"
            title="Generate new art with different patterns"
          >
            Regenerate
          </button>
        </>
      )}
    </div>
  );
};

export default AbstractArtDisplay; 