import React from 'react';

interface GradientPreviewProps {
  gradientColors: string[];
  selectedEmoji: string;
}

/**
 * Component for displaying and customizing gradients
 */
const GradientPreview: React.FC<GradientPreviewProps> = ({ 
  gradientColors, 
  selectedEmoji 
}) => {
  // Generate the gradient background style
  const gradientStyle = {
    background: `linear-gradient(135deg, ${gradientColors[0]} 0%, ${gradientColors[1]} 100%)`,
  };
  
  if (selectedEmoji === '😐') {
    return null;
  }

  return (
    <div 
      className="mb-6 h-40 rounded-lg flex items-center justify-center text-6xl"
      style={gradientStyle}
    >
      {selectedEmoji}
    </div>
  );
};

export default GradientPreview; 