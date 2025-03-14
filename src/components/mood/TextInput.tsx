import React from 'react';
import LoadingSpinner from '../common/LoadingSpinner';
import { type UseSentimentAnalysisResult } from './hooks/useSentimentAnalysis';

interface TextInputProps {
  sentimentAnalysis: UseSentimentAnalysisResult;
}

/**
 * Component for text input and sentiment analysis
 */
const TextInput: React.FC<TextInputProps> = ({ sentimentAnalysis }) => {
  const { text, setText, analyzing } = sentimentAnalysis;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  return (
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
      
      {analyzing && (
        <div className="flex justify-center my-4">
          <LoadingSpinner size="sm" />
          <span className="ml-2">Analyzing your mood...</span>
        </div>
      )}
    </div>
  );
};

export default TextInput; 