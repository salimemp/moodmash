import { useServiceWorker } from '@/hooks/useServiceWorker';
import React from 'react';

export const UpdatePrompt: React.FC = () => {
  const { isWaiting, updateServiceWorker } = useServiceWorker();

  if (!isWaiting) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-blue-600 text-white flex justify-between items-center z-50">
      <p className="text-sm sm:text-base">
        A new version of the app is available!
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => updateServiceWorker()}
          className="px-4 py-2 bg-white text-blue-600 rounded-md text-sm font-medium hover:bg-blue-50 transition-colors"
        >
          Update Now
        </button>
      </div>
    </div>
  );
}; 