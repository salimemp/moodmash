export interface Mood {
  id: string;
  userId: string;
  gradientColors: string[];
  emoji?: string;
  text?: string;
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MoodWithStats extends Mood {
  likes: number;
  comments: number;
  isLiked?: boolean; // For the current user
}

export interface MoodComment {
  id: string;
  moodId: string;
  userId: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MoodLike {
  id: string;
  moodId: string;
  userId: string;
  createdAt: Date;
}

export interface MoodMash {
  id: string;
  moodIds: string[];
  resultGradientColors: string[];
  resultEmoji?: string;
  resultText?: string;
  userId: string;
  createdAt: Date;
} 