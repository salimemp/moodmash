'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card/card';
import { Button } from '@/components/ui/button/button';
import { Heart, MessageCircle, Share2 } from 'lucide-react';

interface MoodCardProps {
  id: string;
  gradientColors: string[];
  emoji?: string;
  text?: string;
  createdAt: Date;
  likes: number;
  comments: number;
}

export function MoodCard({
  gradientColors,
  emoji,
  text,
  createdAt,
  likes,
  comments,
}: MoodCardProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  
  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
    // In a real app, you would call an API to update the like status
  };

  const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + 'y';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + 'mo';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + 'd';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + 'h';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + 'm';
    
    return Math.floor(seconds) + 's';
  };

  // Create a linear gradient based on the provided colors
  const gradientStyle = {
    background: `linear-gradient(135deg, ${gradientColors.join(', ')})`,
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-0">
        <div
          className="h-48 flex items-center justify-center"
          style={gradientStyle}
        >
          {emoji && (
            <span className="text-6xl">{emoji}</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {text && <p className="text-sm">{text}</p>}
        <p className="text-xs text-muted-foreground mt-2">
          {timeAgo(createdAt)} ago
        </p>
      </CardContent>
      <CardFooter className="flex justify-between pt-0">
        <Button
          variant="ghost"
          size="sm"
          className={liked ? 'text-red-500' : ''}
          onClick={handleLike}
        >
          <Heart className="mr-1 h-4 w-4" fill={liked ? 'currentColor' : 'none'} />
          {likeCount}
        </Button>
        <Button variant="ghost" size="sm">
          <MessageCircle className="mr-1 h-4 w-4" />
          {comments}
        </Button>
        <Button variant="ghost" size="sm">
          <Share2 className="mr-1 h-4 w-4" />
          Share
        </Button>
      </CardFooter>
    </Card>
  );
} 