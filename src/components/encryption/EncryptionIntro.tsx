import { AlertTriangle } from 'lucide-react';

const EncryptionIntro: React.FC = () => {
  return (
    <div className="space-y-4">
      <p>
        End-to-end encryption ensures that your sensitive data can only be read by you. Even
        we cannot access your encrypted data.
      </p>

      <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3 border border-amber-200 dark:border-amber-800">
        <h4 className="font-medium flex items-center gap-2 text-amber-800 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4" />
          Important
        </h4>
        <ul className="mt-2 text-sm space-y-1 text-amber-700 dark:text-amber-300">
          <li>• Your password is used to generate encryption keys</li>
          <li>• We cannot recover your data if you forget your password</li>
          <li>• You&apos;ll need to enter your password on new devices</li>
        </ul>
      </div>
    </div>
  );
};

export default EncryptionIntro; 