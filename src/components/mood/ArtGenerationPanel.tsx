import { type SentimentResult } from '@/lib/ml/sentiment-analyzer';
import React from 'react';
import AbstractArtDisplay from './AbstractArtDisplay';
import { type UseArtGenerationResult } from './hooks/useArtGeneration';

interface ArtGenerationPanelProps {
  sentiment: SentimentResult | null;
  artGeneration: UseArtGenerationResult;
}

/**
 * Component for art generation options and display
 */
const ArtGenerationPanel: React.FC<ArtGenerationPanelProps> = ({ 
  sentiment,
  artGeneration,
}) => {
  const { gradientColors, handleArtGenerated } = artGeneration;

  if (!sentiment) {
    return null;
  }

  return (
    <div className="mb-6">
      <AbstractArtDisplay
        emotions={sentiment.dominantEmotions}
        complexity={7}
        baseColors={gradientColors}
        width={520}
        height={300}
        className="rounded-lg shadow-md"
        onArtGenerated={handleArtGenerated}
      />
    </div>
  );
};

export default ArtGenerationPanel; 