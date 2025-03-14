import { ShieldAlert } from 'lucide-react';

interface ErrorDisplayProps {
  error: string | null;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error }) => {
  if (!error) return null;
  
  return (
    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm flex items-start gap-2">
      <ShieldAlert className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <span>{error}</span>
    </div>
  );
};

export default ErrorDisplay; 