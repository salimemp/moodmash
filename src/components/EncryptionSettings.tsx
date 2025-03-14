/**
 * Refactored EncryptionSettings component
 * 
 * This component now uses smaller, focused components:
 * - EncryptionIntro for the introduction step
 * - PasswordCreation for the password creation step
 * - PasswordConfirmation for the password confirmation step
 * - EncryptionComplete for the completion status
 * - ErrorDisplay for error display
 * 
 * It also uses the useEncryptionSetup hook for encryption logic
 */

import { Button } from '@/components/ui/button/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card/card';
import { useEncryptionSetup } from '@/lib/hooks/useEncryptionSetup';
import { Loader2, Lock } from 'lucide-react';

// Import the step components
import EncryptionComplete from './encryption/EncryptionComplete';
import EncryptionIntro from './encryption/EncryptionIntro';
import ErrorDisplay from './encryption/ErrorDisplay';
import PasswordConfirmation from './encryption/PasswordConfirmation';
import PasswordCreation from './encryption/PasswordCreation';

interface EncryptionSettingsProps {
  onComplete?: () => void;
}

const EncryptionSettings: React.FC<EncryptionSettingsProps> = ({ onComplete }) => {
  const {
    setupStep,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    isLoading,
    error,
    handleNextStep,
    handlePrevStep
  } = useEncryptionSetup({ onComplete });

  // Render the appropriate step component based on the current setup step
  const renderStepContent = () => {
    switch (setupStep) {
      case 'intro':
        return <EncryptionIntro />;
      case 'password':
        return <PasswordCreation password={password} setPassword={setPassword} />;
      case 'confirm':
        return (
          <PasswordConfirmation
            password={password}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
          />
        );
      case 'complete':
        return <EncryptionComplete />;
      default:
        return null;
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary" />
          End-to-End Encryption
        </CardTitle>
        <CardDescription>
          {setupStep === 'complete'
            ? 'Your data is protected with end-to-end encryption'
            : 'Set up end-to-end encryption to protect your data'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {renderStepContent()}
        <ErrorDisplay error={error} />
      </CardContent>

      <CardFooter className="flex justify-between">
        {setupStep !== 'complete' && setupStep !== 'intro' && (
          <Button type="button" variant="outline" onClick={handlePrevStep} disabled={isLoading}>
            Back
          </Button>
        )}

        {setupStep !== 'complete' ? (
          <Button
            type="button"
            onClick={handleNextStep}
            disabled={isLoading || (setupStep === 'password' && (!password || password.length < 8))}
            className={setupStep === 'intro' || setupStep === 'password' ? 'ml-auto' : ''}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : setupStep === 'confirm' ? (
              'Set Up Encryption'
            ) : (
              'Next'
            )}
          </Button>
        ) : (
          <Button type="button" variant="outline" onClick={onComplete} className="ml-auto">
            Done
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default EncryptionSettings;
