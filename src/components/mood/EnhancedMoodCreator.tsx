/**
 * Refactored component that uses smaller, focused components:
 * 
 * 1. TextInput.tsx - Component for text input and sentiment analysis
 * 2. EmojiSelector.tsx - Component for emoji selection based on sentiment
 * 3. GradientPreview.tsx - Component for displaying and customizing gradients
 * 4. ArtGenerationPanel.tsx - Component for art generation options and display
 * 5. useSentimentAnalysis.ts - Custom hook for sentiment analysis logic
 * 6. useArtGeneration.ts - Custom hook for art generation logic
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import React, { useEffect, useState } from 'react';
import LoadingSpinner from '../common/LoadingSpinner';
import ArtGenerationPanel from './ArtGenerationPanel';
import EmojiSelector from './EmojiSelector';
import GradientPreview from './GradientPreview';
import TextInput from './TextInput';
import { useArtGeneration } from './hooks/useArtGeneration';
import { useSentimentAnalysis } from './hooks/useSentimentAnalysis';

interface EnhancedMoodCreatorProps {
  onCreateMood?: (moodData: {
    text: string;
    emoji: string;
    gradientColors: string[];
    abstractArt: string;
    sentiment: number;
  }) => Promise<void>;
}

const EnhancedMoodCreator: React.FC<EnhancedMoodCreatorProps> = ({ onCreateMood }) => {
  // State
  const [selectedEmoji, setSelectedEmoji] = useState('');
  const [activeTab, setActiveTab] = useState<string>('emoji');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Custom hooks
  const sentimentAnalysis = useSentimentAnalysis();
  const artGeneration = useArtGeneration();
  
  const { text, sentiment, showSuggestions } = sentimentAnalysis;
  const { gradientColors, abstractArt } = artGeneration;
  
  // Update gradient colors when sentiment changes
  useEffect(() => {
    if (sentiment) {
      artGeneration.updateGradientFromEmotions(sentiment.dominantEmotions);
    }
  }, [sentiment, artGeneration]);

  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmoji(emoji);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!text.trim() || (activeTab === 'emoji' && selectedEmoji === '😐')) return;
    
    if (onCreateMood) {
      setIsSubmitting(true);
      try {
        await onCreateMood({
          text,
          emoji: selectedEmoji,
          gradientColors,
          abstractArt,
          sentiment: sentiment?.score || 0,
        });
        
        // Reset the form
        sentimentAnalysis.setText('');
        setSelectedEmoji('');
        setActiveTab('emoji');
      } catch (error) {
        console.error('Failed to create mood:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto p-6 bg-card rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Create a New Mood</h2>
      
      <form onSubmit={handleSubmit}>
        {/* Text input component */}
        <TextInput sentimentAnalysis={sentimentAnalysis} />
        
        {showSuggestions && sentiment && (
          <div className="mb-6">
            <p className="text-sm mb-2">Based on your description, you seem to be feeling:</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {sentiment.dominantEmotions.map((emotion) => (
                <span 
                  key={emotion.type} 
                  className="px-3 py-1 text-xs rounded-full bg-primary/10 font-medium"
                >
                  {emotion.type}
                </span>
              ))}
            </div>
            
            <Tabs 
              defaultValue="emoji" 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="mt-6"
            >
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="emoji">Use Emoji</TabsTrigger>
                <TabsTrigger value="art">Abstract Art</TabsTrigger>
              </TabsList>
              
              <TabsContent value="emoji" className="mt-0">
                {/* Emoji selector component */}
                <EmojiSelector 
                  sentiment={sentiment}
                  selectedEmoji={selectedEmoji}
                  onEmojiSelect={handleEmojiSelect}
                />
                
                {/* Gradient preview component */}
                <GradientPreview 
                  gradientColors={gradientColors}
                  selectedEmoji={selectedEmoji}
                />
              </TabsContent>
              
              <TabsContent value="art" className="mt-0">
                {/* Art generation panel component */}
                <ArtGenerationPanel 
                  sentiment={sentiment}
                  artGeneration={artGeneration}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
        
        <button
          type="submit"
          disabled={!text.trim() || isSubmitting || (activeTab === 'emoji' && selectedEmoji === '😐')}
          className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-base font-medium transition-colors"
        >
          {isSubmitting ? 
            <span className="flex items-center justify-center">
              <LoadingSpinner size="sm" />
              <span className="ml-2">Posting...</span>
            </span> : 
            'Post Mood'
          }
        </button>
      </form>
    </div>
  );
};

export default EnhancedMoodCreator; 