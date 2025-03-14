interface PasswordCreationProps {
  password: string;
  setPassword: (password: string) => void;
}

const PasswordCreation: React.FC<PasswordCreationProps> = ({
  password,
  setPassword,
}) => {
  return (
    <div className="space-y-4">
      <p className="text-sm">
        Create a strong password to protect your encryption keys. This password will be used
        to encrypt and decrypt your data.
      </p>

      <div>
        <label htmlFor="password" className="text-sm font-medium block mb-1">
          Encryption Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="Enter a strong password"
          autoComplete="new-password"
        />
        {password && password.length < 8 && (
          <p className="text-xs text-red-500 mt-1">Password must be at least 8 characters</p>
        )}
      </div>
    </div>
  );
};

export default PasswordCreation; 