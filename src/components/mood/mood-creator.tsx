'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card/card';
import { Button } from '@/components/ui/button/button';

// Predefined gradient colors
const gradientOptions = [
  ['#FF9843', '#FC5678'], // Happy/Excited
  ['#4299E1', '#3182CE'], // Calm/Relaxed
  ['#805AD5', '#6B46C1'], // Thoughtful
  ['#48BB78', '#38A169'], // Growth
  ['#F6AD55', '#DD6B20'], // Energetic
  ['#FC8181', '#E53E3E'], // Angry
  ['#9F7AEA', '#667EEA'], // Dreamy
  ['#CBD5E0', '#718096'], // Neutral
];

// Popular emojis for moods
const emojiOptions = ['😊', '😌', '🤔', '😢', '😡', '🥰', '😴', '🙄', '😂', '😎', '🥺', '😐'];

export function MoodCreator() {
  const [selectedGradient, setSelectedGradient] = useState(0);
  const [selectedEmoji, setSelectedEmoji] = useState('');
  const [text, setText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);

  // Preview gradient style
  const gradientStyle = {
    background: `linear-gradient(135deg, ${gradientOptions[selectedGradient].join(', ')})`,
  };

  const handleCreateMood = () => {
    const newMood = {
      gradientColors: gradientOptions[selectedGradient],
      emoji: selectedEmoji,
      text: text.trim() || undefined,
      isAnonymous,
    };

    console.log('Creating new mood:', newMood);
    // In a real app, this would call an API endpoint to save the mood
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create a Mood</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Gradient Preview */}
        <div 
          className="h-32 rounded-md flex items-center justify-center mb-4"
          style={gradientStyle}
        >
          {selectedEmoji && (
            <span className="text-5xl">{selectedEmoji}</span>
          )}
        </div>

        {/* Gradient Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Mood Color</label>
          <div className="grid grid-cols-4 gap-2">
            {gradientOptions.map((gradient, index) => (
              <button
                key={index}
                type="button"
                className={`h-10 rounded-md ${selectedGradient === index ? 'ring-2 ring-primary' : ''}`}
                style={{ background: `linear-gradient(135deg, ${gradient.join(', ')})` }}
                onClick={() => setSelectedGradient(index)}
              />
            ))}
          </div>
        </div>

        {/* Emoji Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Mood Emoji</label>
          <div className="grid grid-cols-6 gap-2">
            {emojiOptions.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className={`h-10 flex items-center justify-center rounded-md ${selectedEmoji === emoji ? 'bg-accent' : 'bg-muted'}`}
                onClick={() => setSelectedEmoji(emoji === selectedEmoji ? '' : emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Text Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Message (optional)</label>
          <textarea
            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="How are you feeling?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={100}
          />
          <div className="text-xs text-muted-foreground text-right">
            {text.length}/100
          </div>
        </div>

        {/* Anonymous Toggle */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="anonymous"
            checked={isAnonymous}
            onChange={() => setIsAnonymous(!isAnonymous)}
            className="rounded border-input"
          />
          <label htmlFor="anonymous" className="text-sm">Post anonymously</label>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleCreateMood} className="w-full">
          Share Mood
        </Button>
      </CardFooter>
    </Card>
  );
} 