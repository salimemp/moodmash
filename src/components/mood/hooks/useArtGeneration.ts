import { type GeneratedArt } from '@/lib/art/abstract-generator';
import { emotionToGradient, type Emotion } from '@/lib/ml/sentiment-analyzer';
import { useCallback, useState } from 'react';

export interface UseArtGenerationResult {
  abstractArt: string;
  setAbstractArt: (art: string) => void;
  gradientColors: string[];
  setGradientColors: (colors: string[]) => void;
  handleArtGenerated: (art: GeneratedArt) => void;
  updateGradientFromEmotions: (emotions: Emotion[]) => void;
}

/**
 * Custom hook for handling art generation logic and state
 */
export function useArtGeneration(): UseArtGenerationResult {
  const [abstractArt, setAbstractArt] = useState<string>('');
  const [gradientColors, setGradientColors] = useState<string[]>(['#3498db', '#8e44ad']);

  // Handler for when new art is generated
  const handleArtGenerated = useCallback((art: GeneratedArt) => {
    setAbstractArt(art.svgContent);
  }, []);

  // Update gradient colors based on emotions
  const updateGradientFromEmotions = useCallback((emotions: Emotion[]) => {
    const colors = emotionToGradient(emotions);
    setGradientColors(colors);
  }, []);

  return {
    abstractArt,
    setAbstractArt,
    gradientColors,
    setGradientColors,
    handleArtGenerated,
    updateGradientFromEmotions,
  };
} 