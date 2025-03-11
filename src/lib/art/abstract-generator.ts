import { type Emotion } from '../ml/sentiment-analyzer';

export interface ArtGenerationOptions {
  emotions: Emotion[];
  complexity: number; // 1-10
  baseColors?: string[];
  size?: { width: number; height: number };
  seed?: number;
}

export interface GeneratedArt {
  svgContent: string;
  colors: string[];
  dominantEmotions: string[];
}

/**
 * Generates abstract art SVG based on emotions and parameters
 */
export class AbstractArtGenerator {
  // Default canvas size
  private readonly defaultSize = { width: 400, height: 300 };
  
  // Map emotions to shapes and patterns
  private readonly emotionShapes: Record<string, string[]> = {
    joy: ['circle', 'star', 'wave'],
    sadness: ['droplet', 'blur', 'curve'],
    anger: ['triangle', 'zigzag', 'spike'],
    fear: ['spiral', 'sharp', 'scattered'],
    surprise: ['burst', 'splash', 'pop'],
    disgust: ['jagged', 'rough', 'irregular'],
    trust: ['square', 'rounded', 'solid'],
    anticipation: ['arrow', 'expanding', 'growing'],
  };
  
  /**
   * Generate an abstract art SVG based on emotions
   */
  generateArt(options: ArtGenerationOptions): GeneratedArt {
    const {
      emotions,
      complexity,
      baseColors = ['#3498db', '#8e44ad'],
      size = this.defaultSize,
      seed = Math.floor(Math.random() * 10000),
    } = options;
    
    // Use the seed for deterministic randomness
    const random = this.seededRandom(seed);
    
    // Sort emotions by score
    const sortedEmotions = [...emotions].sort((a, b) => b.score - a.score);
    const dominantEmotions = sortedEmotions.slice(0, 2).map(e => e.type);
    
    // Generate colors from emotions and base colors
    const colorPalette = this.generateColorPalette(sortedEmotions, baseColors, 5, random);
    
    // Generate the SVG elements
    const svgElements = this.generateSvgElements(
      sortedEmotions,
      colorPalette,
      complexity,
      size,
      random
    );
    
    // Assemble the complete SVG
    const svgContent = `
      <svg 
        width="${size.width}" 
        height="${size.height}" 
        viewBox="0 0 ${size.width} ${size.height}" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${baseColors[0]}" />
            <stop offset="100%" stop-color="${baseColors[1]}" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#bg-gradient)" />
        ${svgElements.join('\n')}
      </svg>
    `;
    
    return {
      svgContent: svgContent.trim(),
      colors: colorPalette,
      dominantEmotions,
    };
  }
  
  /**
   * Generate a color palette based on emotions
   */
  private generateColorPalette(
    emotions: Emotion[],
    baseColors: string[],
    count: number,
    random: () => number
  ): string[] {
    const palette = [...baseColors];
    
    // Generate additional colors derived from the base colors
    while (palette.length < count) {
      const baseColor = palette[Math.floor(random() * palette.length)];
      
      // Use emotions to influence the color adjustments
      const emotionFactor = emotions.length > 0 
        ? emotions[0].score * 10 // Use the dominant emotion's score
        : 0;
        
      const newColor = this.adjustColor(baseColor, {
        hue: (random() * 30 + emotionFactor) - 15,
        saturation: (random() * 20 + emotionFactor) - 10,
        lightness: (random() * 20) - 10,
      });
      palette.push(newColor);
    }
    
    return palette;
  }
  
  /**
   * Generate SVG elements for the abstract art
   */
  private generateSvgElements(
    emotions: Emotion[],
    colors: string[],
    complexity: number,
    size: { width: number; height: number },
    random: () => number
  ): string[] {
    const elements: string[] = [];
    const elementsCount = 5 + Math.floor(complexity * 3); // 5-35 elements based on complexity
    
    for (let i = 0; i < elementsCount; i++) {
      // Decide which emotion to represent in this element
      const emotion = emotions[Math.floor(random() * Math.min(emotions.length, 3))];
      const shapes = this.emotionShapes[emotion.type] || ['circle'];
      const shape = shapes[Math.floor(random() * shapes.length)];
      const color = colors[Math.floor(random() * colors.length)];
      
      // Generate element based on the shape
      const element = this.createShapeElement(
        shape,
        color,
        size,
        random,
        emotion.score
      );
      
      elements.push(element);
    }
    
    return elements;
  }
  
  /**
   * Create an SVG element for a specific shape
   */
  private createShapeElement(
    shape: string,
    color: string,
    size: { width: number; height: number },
    random: () => number,
    intensity: number
  ): string {
    const x = random() * size.width;
    const y = random() * size.height;
    const scale = (0.5 + random() * 1.5) * intensity; // Scale based on emotion intensity
    const rotation = random() * 360;
    const opacity = 0.3 + (random() * 0.7); // 0.3-1.0
    
    switch (shape) {
      case 'circle':
        const radius = 10 + (30 * scale);
        return `<circle cx="${x}" cy="${y}" r="${radius}" fill="${color}" opacity="${opacity}" />`;
        
      case 'square':
        const width = 20 + (40 * scale);
        return `
          <rect 
            x="${x - width/2}" 
            y="${y - width/2}" 
            width="${width}" 
            height="${width}" 
            fill="${color}" 
            opacity="${opacity}"
            transform="rotate(${rotation}, ${x}, ${y})"
          />
        `;
        
      case 'triangle':
        const size1 = 30 * scale;
        const points = `
          ${x},${y - size1} 
          ${x + size1 * 0.866},${y + size1 * 0.5} 
          ${x - size1 * 0.866},${y + size1 * 0.5}
        `;
        return `
          <polygon 
            points="${points}" 
            fill="${color}" 
            opacity="${opacity}"
            transform="rotate(${rotation}, ${x}, ${y})"
          />
        `;
        
      case 'star':
        const outerRadius = 20 * scale;
        const innerRadius = 10 * scale;
        let starPoints = '';
        for (let i = 0; i < 10; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = Math.PI * i / 5;
          starPoints += `${x + radius * Math.sin(angle)},${y - radius * Math.cos(angle)} `;
        }
        return `
          <polygon 
            points="${starPoints}" 
            fill="${color}" 
            opacity="${opacity}"
            transform="rotate(${rotation}, ${x}, ${y})"
          />
        `;
        
      case 'wave':
      case 'curve':
        const amplitude = 20 * scale;
        const frequency = 0.05 + (random() * 0.1);
        const width2 = 100 + (50 * scale);
        let pathData = `M ${x} ${y}`;
        for (let i = 0; i <= width2; i += 5) {
          const dx = i;
          const dy = amplitude * Math.sin(frequency * i);
          pathData += ` L ${x + dx} ${y + dy}`;
        }
        return `
          <path 
            d="${pathData}" 
            stroke="${color}" 
            stroke-width="${2 + (3 * scale)}" 
            fill="none" 
            opacity="${opacity}"
            transform="rotate(${rotation}, ${x}, ${y})"
          />
        `;
        
      default:
        // Default to a circle if shape is not recognized
        return `<circle cx="${x}" cy="${y}" r="${15 * scale}" fill="${color}" opacity="${opacity}" />`;
    }
  }
  
  /**
   * Adjust a color's HSL values
   */
  private adjustColor(
    color: string, 
    adjustments: { hue?: number; saturation?: number; lightness?: number }
  ): string {
    // Convert hex to HSL
    const r = parseInt(color.slice(1, 3), 16) / 255;
    const g = parseInt(color.slice(3, 5), 16) / 255;
    const b = parseInt(color.slice(5, 7), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
        default: h = 0;
      }
      h /= 6;
    }
    
    // Apply adjustments
    h = (h * 360 + (adjustments.hue || 0)) % 360;
    if (h < 0) h += 360;
    s = Math.max(0, Math.min(1, s + (adjustments.saturation || 0) / 100));
    l = Math.max(0, Math.min(1, l + (adjustments.lightness || 0) / 100));
    
    // Convert back to hex
    function hue2rgb(p: number, q: number, t: number): number {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    }
    
    let r1, g1, b1;
    if (s === 0) {
      r1 = g1 = b1 = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r1 = hue2rgb(p, q, h / 360 + 1/3);
      g1 = hue2rgb(p, q, h / 360);
      b1 = hue2rgb(p, q, h / 360 - 1/3);
    }
    
    // Convert to hex
    const toHex = (x: number) => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r1)}${toHex(g1)}${toHex(b1)}`;
  }
  
  /**
   * Create a seeded random number generator
   */
  private seededRandom(seed: number): () => number {
    let value = seed;
    return function() {
      value = (value * 9301 + 49297) % 233280;
      return value / 233280;
    };
  }
}

// Export a singleton instance
export const abstractArtGenerator = new AbstractArtGenerator(); 