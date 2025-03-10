import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';

/**
 * Array of languages that use Right-to-Left (RTL) script
 * 
 * @constant
 * @type {string[]}
 */
const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

/**
 * Text direction type
 * 
 * @typedef {'ltr' | 'rtl'} Direction
 */
type Direction = 'ltr' | 'rtl';

/**
 * Context for managing text direction throughout the application
 * 
 * @interface DirectionContextType
 * @typedef {Object} DirectionContextType
 * @property {Direction} direction - Current text direction ('ltr' or 'rtl')
 * @property {boolean} isRTL - Whether the current direction is RTL
 * @property {() => void} toggleDirection - Function to toggle between LTR and RTL
 */
interface DirectionContextType {
  direction: Direction;
  isRTL: boolean;
  toggleDirection: () => void;
}

/**
 * Context for managing document direction based on locale
 * 
 * @type {React.Context<DirectionContextType | undefined>}
 */
const DirectionContext = createContext<DirectionContextType | undefined>(undefined);

/**
 * Provider component for managing text direction throughout the application
 * 
 * This component detects the current locale, determines if it's an RTL language,
 * and sets the appropriate direction on the HTML document element.
 * 
 * @component
 * @example
 * ```tsx
 * <DirectionProvider>
 *   <App />
 * </DirectionProvider>
 * ```
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Provider component with context
 */
export const DirectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const { locale } = router;
  
  // Determine initial direction based on locale
  const isRTLLanguage = locale ? RTL_LANGUAGES.includes(locale) : false;
  const [direction, setDirection] = useState<Direction>(isRTLLanguage ? 'rtl' : 'ltr');

  /**
   * Effect to update direction when locale changes
   * 
   * Updates both the context state and the HTML document's direction
   * attribute to ensure proper text rendering and layout.
   */
  useEffect(() => {
    if (locale) {
      const newDirection = RTL_LANGUAGES.includes(locale) ? 'rtl' : 'ltr';
      setDirection(newDirection);
      
      // Update html element direction
      document.documentElement.dir = newDirection;
      document.documentElement.lang = locale;
    }
  }, [locale]);

  /**
   * Function to manually toggle text direction
   * 
   * Primarily used for testing or demonstration purposes.
   * Toggles between 'ltr' and 'rtl' directions.
   * 
   * @function toggleDirection
   * @returns {void}
   */
  const toggleDirection = () => {
    const newDirection = direction === 'ltr' ? 'rtl' : 'ltr';
    setDirection(newDirection);
    document.documentElement.dir = newDirection;
  };

  return (
    <DirectionContext.Provider 
      value={{ 
        direction, 
        isRTL: direction === 'rtl',
        toggleDirection
      }}
    >
      {children}
    </DirectionContext.Provider>
  );
};

/**
 * Hook to access the current text direction context
 * 
 * Provides access to the current text direction and related utilities
 * to any component within the DirectionProvider.
 * 
 * @hook
 * @example
 * ```tsx
 * const { direction, isRTL } = useDirection();
 * 
 * return (
 *   <div style={{ direction }}>
 *     {isRTL ? 'Right-to-left content' : 'Left-to-right content'}
 *   </div>
 * );
 * ```
 * 
 * @returns {DirectionContextType} The direction context
 * @throws {Error} If used outside of a DirectionProvider
 */
export const useDirection = (): DirectionContextType => {
  const context = useContext(DirectionContext);
  if (context === undefined) {
    throw new Error('useDirection must be used within a DirectionProvider');
  }
  return context;
}; 