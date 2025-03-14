import { vi } from 'vitest';

export const generateRegistrationOptions = vi.fn().mockReturnValue({
  challenge: 'challenge',
  rp: { id: 'example.com', name: 'MoodMash' },
  user: { id: 'user123', name: 'user@example.com', displayName: 'Test User' },
  pubKeyCredParams: [],
  timeout: 60000,
  excludeCredentials: [],
  authenticatorSelection: {},
  extensions: {}
});

export const verifyRegistrationResponse = vi.fn().mockResolvedValue({
  verified: true,
  registrationInfo: {
    credentialID: Buffer.from('credential-id'),
    credentialPublicKey: Buffer.from('public-key'),
    counter: 0,
    credentialDeviceType: 'singleDevice',
    credentialBackedUp: false,
    fmt: 'none',
    aaguid: Buffer.from('aaguid'),
    credentialType: 'public-key',
    origin: 'https://example.com',
  },
});

export const generateAuthenticationOptions = vi.fn().mockReturnValue({
  challenge: 'challenge',
  rpId: 'example.com',
  timeout: 60000,
  allowCredentials: undefined,
  userVerification: 'preferred',
});

export const verifyAuthenticationResponse = vi.fn().mockResolvedValue({
  verified: true,
  authenticationInfo: {
    credentialID: Buffer.from('credential-id'),
    newCounter: 6,
  },
}); 