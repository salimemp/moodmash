// Add a type declaration for tensorflow/tfjs to avoid TypeScript errors
declare module '@tensorflow/tfjs' {
  export interface LayersModel {
    predict(inputs: Tensor): Tensor;
    compile(config: ModelCompileConfig): void;
    dispose(): void;
  }

  export interface Tensor {
    dataSync(): Float32Array;
    dispose(): void;
  }

  export interface ModelCompileConfig {
    optimizer: string;
    loss: string;
    metrics: string[];
  }

  export function sequential(): LayersModel & {
    add: (layer: Layer) => void;
  };

  export interface Layer {
    // Basic properties for a layer
    name?: string;
    trainable?: boolean;
  }

  // Use a module augmentation pattern instead of namespace
  export function embedding(config: EmbeddingConfig): Layer;
  export function globalAveragePooling1d(config: PoolingConfig): Layer;
  export function dense(config: DenseConfig): Layer;

  export interface EmbeddingConfig {
    inputDim: number;
    outputDim: number;
    inputLength?: number;
  }

  export interface PoolingConfig {
    // Pooling config properties
    strides?: number;
    padding?: string;
  }

  export interface DenseConfig {
    units: number;
    activation?: string;
  }
}

import * as tf from '@tensorflow/tfjs';

// Import types from the tensorflow module
import type { LayersModel } from '@tensorflow/tfjs';

// For TypeScript compatibility, extend LayersModel with the sequential methods
interface SequentialModel extends LayersModel {
  add: (layer: unknown) => void;
}

// Types for sentiment analysis
export interface SentimentResult {
  score: number; // -1 to 1, negative to positive
  confidence: number; // 0 to 1
  mood: MoodCategory;
  dominantEmotions: Emotion[];
}

export type MoodCategory = 
  | 'very_negative' 
  | 'negative' 
  | 'neutral' 
  | 'positive' 
  | 'very_positive';

export interface Emotion {
  type: EmotionType;
  score: number; // 0 to 1
}

export type EmotionType = 
  | 'joy' 
  | 'sadness' 
  | 'anger' 
  | 'fear' 
  | 'surprise' 
  | 'disgust' 
  | 'trust' 
  | 'anticipation';

// Mapping sentiment scores to mood categories
const sentimentToMood = (score: number): MoodCategory => {
  if (score < -0.6) return 'very_negative';
  if (score < -0.2) return 'negative';
  if (score < 0.2) return 'neutral';
  if (score < 0.6) return 'positive';
  return 'very_positive';
};

/**
 * Maps emotion scores to gradient colors for visualization
 */
export const emotionToGradient = (emotions: Emotion[]): string[] => {
  const colorMap: Record<EmotionType, string> = {
    joy: '#FFD700', // Gold
    sadness: '#6495ED', // Cornflower Blue
    anger: '#FF4500', // Orange Red
    fear: '#800080', // Purple
    surprise: '#00FFFF', // Cyan
    disgust: '#32CD32', // Lime Green
    trust: '#FFA500', // Orange
    anticipation: '#FF69B4', // Hot Pink
  };

  // If we have dominant emotions, use their colors for the gradient
  if (emotions.length >= 2) {
    return emotions.slice(0, 2).map(e => colorMap[e.type]);
  }
  
  // Fallback to a default gradient
  return ['#3498db', '#8e44ad'];
};

// Singleton class to load and manage the model
class SentimentAnalyzer {
  private model: SequentialModel | null = null;
  private tokenizer: Map<string, number> | null = null;
  private loading: Promise<void> | null = null;
  private readonly vocabSize = 10000;
  private readonly maxLength = 100;

  /**
   * Loads the sentiment analysis model
   */
  async loadModel(): Promise<void> {
    if (this.model) {
      return; // Model already loaded
    }
    
    if (this.loading) {
      return this.loading;
    }
    
    this.loading = (async () => {
      try {
        // In a production app, we would load a pretrained model
        // For demo purposes, we'll create a simple model
        
        console.log('Creating sentiment analysis model...');
        
        // Create a simple sequential model
        this.model = tf.sequential() as SequentialModel;
        
        // Add layers to the model
        this.model.add(tf.layers.embedding({
          inputDim: this.vocabSize,
          outputDim: 16,
          inputLength: this.maxLength
        }));
        this.model.add(tf.layers.globalAveragePooling1d({}));
        this.model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
        this.model.add(tf.layers.dense({ units: 1, activation: 'tanh' }));
        
        this.model.compile({
          optimizer: 'adam',
          loss: 'meanSquaredError',
          metrics: ['accuracy']
        });
        
        // In reality, we would load a pre-trained tokenizer
        this.tokenizer = new Map<string, number>();
        
        console.log('Model loading complete');
      } catch (error) {
        console.error('Failed to load sentiment model:', error);
        this.model = null;
        this.tokenizer = null;
        throw error;
      }
    })();
    
    return this.loading;
  }

  /**
   * Analyzes text for sentiment and emotions
   */
  async analyzeText(text: string): Promise<SentimentResult> {
    await this.loadModel();
    
    if (!this.model || !this.tokenizer) {
      throw new Error('Model not loaded');
    }
    
    try {
      // In a real implementation, we would tokenize and pad the text
      // For demo purposes, we'll return simulated results
      
      // Simple sentiment detection based on keywords
      const positiveWords = ['happy', 'joy', 'great', 'excellent', 'wonderful', 'love', 'like'];
      const negativeWords = ['sad', 'angry', 'hate', 'terrible', 'awful', 'bad', 'dislike'];
      
      // Normalize text for simple keyword matching
      const normalizedText = text.toLowerCase();
      
      // Count positive and negative keywords
      const positiveCount = positiveWords.filter(word => normalizedText.includes(word)).length;
      const negativeCount = negativeWords.filter(word => normalizedText.includes(word)).length;
      
      // Calculate a simple sentiment score based on keyword counts
      const baseScore = (positiveCount - negativeCount) / Math.max(1, positiveCount + negativeCount);
      
      // Add some randomness to make it more interesting
      const randomFactor = Math.random() * 0.4 - 0.2; // -0.2 to 0.2
      const score = Math.max(-1, Math.min(1, baseScore + randomFactor));
      
      const confidence = 0.7 + Math.random() * 0.3;
      
      // Generate simulated emotions
      const emotionScores: Emotion[] = [
        { type: 'joy', score: Math.random() },
        { type: 'sadness', score: Math.random() },
        { type: 'anger', score: Math.random() },
        { type: 'fear', score: Math.random() },
        { type: 'surprise', score: Math.random() },
        { type: 'disgust', score: Math.random() },
        { type: 'trust', score: Math.random() },
        { type: 'anticipation', score: Math.random() }
      ];
      
      // Sort by score and take top 3
      const dominantEmotions = emotionScores
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
      
      return {
        score,
        confidence,
        mood: sentimentToMood(score),
        dominantEmotions
      };
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      throw error;
    }
  }
  
  /**
   * Frees up resources when the analyzer is no longer needed
   */
  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.tokenizer = null;
  }
}

// Export a singleton instance
export const sentimentAnalyzer = new SentimentAnalyzer(); 