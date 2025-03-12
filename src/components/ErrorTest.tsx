import React, { useState } from 'react';
import * as Sentry from '@sentry/nextjs';

/**
 * A component that can be used to test error handling
 */
const ErrorTest: React.FC = () => {
  const [count, setCount] = useState(0);

  const triggerRenderError = () => {
    // This will cause a render error
    setCount(() => {
      throw new Error('Test render error');
    });
  };

  const triggerPromiseError = () => {
    // This will cause a promise rejection
    Promise.reject(new Error('Test promise rejection')).catch(error => {
      Sentry.captureException(error);
      console.error('Promise error:', error);
    });
  };

  const triggerSentryError = () => {
    // This will send an error to Sentry
    Sentry.captureException(new Error('Test Sentry error'));
    Sentry.captureMessage('Test Sentry message', 'error');
  };

  const triggerApiError = async () => {
    try {
      // This will cause a 404 error
      const response = await fetch('/api/non-existent-endpoint');
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
    } catch (error) {
      Sentry.captureException(error);
      console.error('API error:', error);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Error Testing Component</h2>
      <p className="mb-4">Use these buttons to test error handling and Sentry integration.</p>

      <div className="space-y-3">
        <button
          onClick={triggerRenderError}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors w-full"
        >
          Trigger Render Error (Will Crash Component)
        </button>

        <button
          onClick={triggerPromiseError}
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors w-full"
        >
          Trigger Promise Error (Check Console)
        </button>

        <button
          onClick={triggerSentryError}
          className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors w-full"
        >
          Send Error to Sentry
        </button>

        <button
          onClick={triggerApiError}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors w-full"
        >
          Trigger API Error
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-500">Current count: {count}</div>
    </div>
  );
};

export default ErrorTest;
