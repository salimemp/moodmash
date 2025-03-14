interface PasswordConfirmationProps {
  password: string;
  confirmPassword: string;
  setConfirmPassword: (confirmPassword: string) => void;
}

const PasswordConfirmation: React.FC<PasswordConfirmationProps> = ({
  password,
  confirmPassword,
  setConfirmPassword,
}) => {
  return (
    <div className="space-y-4">
      <p className="text-sm">Confirm your encryption password to proceed.</p>

      <div>
        <label htmlFor="confirm-password" className="text-sm font-medium block mb-1">
          Confirm Password
        </label>
        <input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="Confirm your password"
          autoComplete="new-password"
        />
        {confirmPassword && password !== confirmPassword && (
          <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
        )}
      </div>
    </div>
  );
};

export default PasswordConfirmation; 