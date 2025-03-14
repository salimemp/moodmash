import { CheckCircle2 } from 'lucide-react';

const EncryptionComplete: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle2 className="h-5 w-5" />
        <span className="font-medium">Encryption is active</span>
      </div>

      <p className="text-sm">
        Your data is now protected with end-to-end encryption. When you sign in
        on a new device, you&apos;ll need to enter your encryption password.
      </p>

      <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3 border border-blue-200 dark:border-blue-800">
        <h4 className="font-medium text-blue-800 dark:text-blue-400">Encrypted Data</h4>
        <ul className="mt-2 text-sm space-y-1 text-blue-700 dark:text-blue-300">
          <li>• User preferences</li>
          <li>• Private messages</li>
          <li>• Security settings</li>
        </ul>
      </div>
    </div>
  );
};

export default EncryptionComplete; 