import { type SentimentResult } from '@/lib/ml/sentiment-analyzer';
import React, { useEffect, useMemo } from 'react';

interface EmojiSelectorProps {
  sentiment: SentimentResult | null;
  selectedEmoji: string;
  onEmojiSelect: (emoji: string) => void;
}

/**
 * Component for emoji selection based on sentiment analysis
 */
const EmojiSelector: React.FC<EmojiSelectorProps> = ({
  sentiment,
  selectedEmoji,
  onEmojiSelect,
}) => {
  // Emoji mapping for different mood categories
  const moodEmojis = useMemo(() => ({
    very_negative: ['😢', '😭', '😞', '😔', '💔'],
    negative: ['😒', '😕', '😟', '🙁', '😣'],
    neutral: ['😐', '😶', '🤔', '😌', '😑'],
    positive: ['🙂', '😊', '😀', '👍', '😄'],
    very_positive: ['😁', '🎉', '🥳', '💯', '⭐'],
  }), []);

  // Set an initial emoji when sentiment changes
  useEffect(() => {
    if (sentiment && !selectedEmoji) {
      // Choose a random emoji from the mood category
      const emojiArray = moodEmojis[sentiment.mood];
      const randomSelection = Math.floor(Math.random() * emojiArray.length);
      onEmojiSelect(emojiArray[randomSelection]);
    }
  }, [sentiment, selectedEmoji, moodEmojis, onEmojiSelect]);

  if (!sentiment) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      {Object.entries(moodEmojis).map(([mood, emojiList]) => (
        mood === sentiment.mood ? (
          <React.Fragment key={mood}>
            {emojiList.map((emoji) => (
              <button
                type="button"
                key={emoji}
                onClick={() => onEmojiSelect(emoji)}
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
  );
};

export default EmojiSelector; 