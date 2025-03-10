import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorFallbackProps {
  error?: Error | null;
  resetErrorBoundary?: () => void;
}

/**
 * A styled fallback component to display when an error occurs
 */
const ErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  resetErrorBoundary 
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex flex-col items-center text-center max-w-md">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-red-700 mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-600 mb-4">
          We&apos;re sorry, but we encountered an unexpected error. Our team has been notified.
        </p>
        
        {error && (
          <details className="mb-4 w-full text-left">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
              Error details
            </summary>
            <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-[200px] text-red-800">
              {error.message}
              {'\n\n'}
              {error.stack}
            </pre>
          </details>
        )}
        
        {resetErrorBoundary && (
          <button
            onClick={resetErrorBoundary}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorFallback; 