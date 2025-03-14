import { sentimentAnalyzer, type SentimentResult } from '@/lib/ml/sentiment-analyzer';
import { debounce } from '@/lib/utils';
import { useCallback, useState } from 'react';

export interface UseSentimentAnalysisProps {
  debounceDuration?: number;
}

export interface UseSentimentAnalysisResult {
  text: string;
  setText: (text: string) => void;
  sentiment: SentimentResult | null;
  analyzing: boolean;
  showSuggestions: boolean;
  analyzeSentiment: (text: string) => void;
}

/**
 * Custom hook for handling sentiment analysis logic
 */
export function useSentimentAnalysis(
  { debounceDuration = 500 }: UseSentimentAnalysisProps = {}
): UseSentimentAnalysisResult {
  const [text, setText] = useState<string>('');
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [sentiment, setSentiment] = useState<SentimentResult | null>(null);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  // Debounced analysis function to avoid too many API calls
  const analyzeSentiment = useCallback(
    // Use a typed debounce function to avoid type errors
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
    }) as (...args: unknown[]) => unknown, debounceDuration),
    [debounceDuration]
  );

  // Handle text change
  const handleTextChange = useCallback((newText: string) => {
    setText(newText);
    analyzeSentiment(newText);
  }, [analyzeSentiment]);

  return {
    text,
    setText: handleTextChange,
    sentiment,
    analyzing,
    showSuggestions,
    analyzeSentiment,
  };
} 