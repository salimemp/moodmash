import { emotionToGradient, sentimentAnalyzer, type SentimentResult } from '@/lib/ml/sentiment-analyzer';
import { debounce } from '@/lib/utils';
import React, { useCallback, useEffect, useState } from 'react';
import LoadingSpinner from '../common/LoadingSpinner';

// Emoji mapping for different mood categories
const moodEmojis = {
  very_negative: ['😢', '😭', '😰', '😱', '😠'],
  negative: ['😕', '😟', '😒', '😔', '😞'],
  neutral: ['😐', '😶', '🙂', '😌', '😑'],
  positive: ['😊', '😀', '😃', '😄', '😁'],
  very_positive: ['😍', '🤩', '😘', '🥰', '😋'],
};

// Random selection of an emoji from the appropriate category
const getRandomEmoji = (category: keyof typeof moodEmojis): string => {
  const options = moodEmojis[category];
  return options[Math.floor(Math.random() * options.length)];
};

const MoodCreator: React.FC = () => {
  const [text, setText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [sentiment, setSentiment] = useState<SentimentResult | null>(null);
  const [selectedEmoji, setSelectedEmoji] = useState('');
  const [gradientColors, setGradientColors] = useState<string[]>(['#3498db', '#8e44ad']);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Update the emoji suggestion when sentiment changes
  useEffect(() => {
    if (sentiment) {
      setSelectedEmoji(getRandomEmoji(sentiment.mood));
      setGradientColors(emotionToGradient(sentiment.dominantEmotions));
    }
  }, [sentiment]);

  // Debounced analysis function to avoid too many API calls
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const analyzeSentiment = useCallback(
    debounce(((async (text: string) => {
      if (!text.trim()) {
        setSentiment(null);
        setShowSuggestions(false);
        return;
      }
      
      setAnalyzing(true);
      try {
        const result = await sentimentAnalyzer.analyzeText(text);
        setSentiment(result);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Failed to analyze sentiment:', error);
        setSentiment(null);
      } finally {
        setAnalyzing(false);
      }
    }) as (...args: unknown[]) => unknown), 500),
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!text.trim() || !selectedEmoji) return;
    
    // In a real app, this would save the mood to the database
    console.log('Creating mood:', {
      text,
      emoji: selectedEmoji,
      gradientColors,
      sentimentScore: sentiment?.score,
      emotions: sentiment?.dominantEmotions,
    });
    
    // Reset the form
    setText('');
    setSentiment(null);
    setShowSuggestions(false);
  };

  // Generate the gradient background style
  const gradientStyle = {
    background: `linear-gradient(135deg, ${gradientColors[0]} 0%, ${gradientColors[1]} 100%)`,
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 bg-card rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Create a New Mood</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="mood-text" className="block text-sm font-medium mb-1">
            How are you feeling today?
          </label>
          <textarea
            id="mood-text"
            value={text}
            onChange={handleTextChange}
            className="w-full p-3 border rounded-md resize-none h-24 focus:ring focus:ring-primary/20"
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
          <div className="mb-4">
            <p className="text-sm mb-2">Based on your description, you seem to be feeling:</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {sentiment.dominantEmotions.map((emotion) => (
                <span 
                  key={emotion.type} 
                  className="px-2 py-1 text-xs rounded-full bg-primary/10"
                >
                  {emotion.type} ({(emotion.score * 100).toFixed(0)}%)
                </span>
              ))}
            </div>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {Object.entries(moodEmojis).map(([mood, emojiList]) => (
                mood === sentiment.mood ? (
                  emojiList.map((emoji) => (
                    <button
                      type="button"
                      key={emoji}
                      onClick={() => handleEmojiSelect(emoji)}
                      className={`text-2xl p-2 rounded-full ${
                        selectedEmoji === emoji ? 'bg-primary/20' : 'hover:bg-muted'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))
                ) : null
              ))}
            </div>
          </div>
        )}
        
        <div 
          className="mb-4 h-32 rounded-lg flex items-center justify-center text-4xl"
          style={gradientStyle}
        >
          {selectedEmoji || '🙂'}
        </div>
        
        <button
          type="submit"
          disabled={!text.trim() || !selectedEmoji}
          className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Post Mood
        </button>
      </form>
    </div>
  );
};

export default MoodCreator; 