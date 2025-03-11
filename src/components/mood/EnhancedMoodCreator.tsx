import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type GeneratedArt } from '@/lib/art/abstract-generator';
import { emotionToGradient, sentimentAnalyzer, type SentimentResult } from '@/lib/ml/sentiment-analyzer';
import { debounce } from '@/lib/utils';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import LoadingSpinner from '../common/LoadingSpinner';
import AbstractArtDisplay from './AbstractArtDisplay';

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
  const [text, setText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [sentiment, setSentiment] = useState<SentimentResult | null>(null);
  const [selectedEmoji, setSelectedEmoji] = useState('');
  const [gradientColors, setGradientColors] = useState<string[]>(['#3498db', '#8e44ad']);
  const [abstractArt, setAbstractArt] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('emoji');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Emoji mapping for different mood categories - wrapped in useMemo
  const moodEmojis = useMemo(() => ({
    very_negative: ['😢', '😭', '😞', '😔', '💔'],
    negative: ['😒', '😕', '😟', '🙁', '😣'],
    neutral: ['😐', '😶', '🤔', '😌', '😑'],
    positive: ['🙂', '😊', '😀', '👍', '😄'],
    very_positive: ['😁', '🎉', '🥳', '💯', '⭐'],
  }), []);

  // Update the emoji suggestion when sentiment changes
  useEffect(() => {
    if (sentiment) {
      // Choose a random emoji from the mood category
      const emojiArray = moodEmojis[sentiment.mood];
      const randomSelection = Math.floor(Math.random() * emojiArray.length);
      setSelectedEmoji(emojiArray[randomSelection]);
      setGradientColors(emotionToGradient(sentiment.dominantEmotions));
    }
  }, [sentiment, moodEmojis]);

  // Debounced analysis function to avoid too many API calls
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const analyzeSentiment = useCallback(
    // Use a more direct type cast to work with the specific parameter
    debounce(((text: string) => {
      if (!text.trim()) {
        setSentiment(null);
        setShowSuggestions(false);
        return;
      }
      
      setAnalyzing(true);
      
      // Analyze the sentiment
      sentimentAnalyzer
        .analyzeText(text)
        .then((result) => {
          setSentiment(result);
          setShowSuggestions(true);
        })
        .catch((error) => {
          console.error('Failed to analyze sentiment:', error);
          setSentiment(null);
        })
        .finally(() => {
          setAnalyzing(false);
        });
    }) as (...args: unknown[]) => unknown, 500),
    []
  );

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    analyzeSentiment(newText);
  };

  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmoji(emoji);
  };

  const handleArtGenerated = (art: GeneratedArt) => {
    setAbstractArt(art.svgContent);
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
        setText('');
        setSentiment(null);
        setShowSuggestions(false);
        setActiveTab('emoji');
      } catch (error) {
        console.error('Failed to create mood:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Generate the gradient background style
  const gradientStyle = {
    background: `linear-gradient(135deg, ${gradientColors[0]} 0%, ${gradientColors[1]} 100%)`,
  };

  return (
    <div className="w-full max-w-xl mx-auto p-6 bg-card rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Create a New Mood</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label htmlFor="mood-text" className="block text-sm font-medium mb-1">
            How are you feeling today?
          </label>
          <textarea
            id="mood-text"
            value={text}
            onChange={handleTextChange}
            className="w-full p-4 border rounded-md resize-none h-32 focus:ring focus:ring-primary/20"
            placeholder="Describe your mood or feelings..."
          />
        </div>
        
        {analyzing && (
          <div className="flex justify-center my-4">
            <LoadingSpinner size="sm" />
            <span className="ml-2">Analyzing your mood...</span>
          </div>
        )}
        
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
                <div className="flex flex-wrap gap-3 mb-6">
                  {Object.entries(moodEmojis).map(([mood, emojiList]) => (
                    mood === sentiment.mood ? (
                      <React.Fragment key={mood}>
                        {emojiList.map((emoji) => (
                          <button
                            type="button"
                            key={emoji}
                            onClick={() => handleEmojiSelect(emoji)}
                            className={`text-3xl p-3 rounded-full transition-colors ${
                              selectedEmoji === emoji 
                                ? 'bg-primary/20 ring-2 ring-primary' 
                                : 'hover:bg-muted'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </React.Fragment>
                    ) : null
                  ))}
                </div>
                
                {selectedEmoji !== '😐' && (
                  <div 
                    className="mb-6 h-40 rounded-lg flex items-center justify-center text-6xl"
                    style={gradientStyle}
                  >
                    {selectedEmoji}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="art" className="mt-0">
                {sentiment && (
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
                )}
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