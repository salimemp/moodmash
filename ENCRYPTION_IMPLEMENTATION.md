# End-to-End Encryption Implementation

This document outlines the end-to-end encryption (E2EE) features implemented in the MoodMash application to protect user data and secure messaging.

## Overview

End-to-end encryption ensures that data is encrypted on the client side before being transmitted to the server, and can only be decrypted by intended recipients with the proper keys. This means that even the server administrators or potential attackers who gain access to the server cannot access the encrypted content.

## Key Components

### 1. Cryptography Utilities (`src/lib/encryption/crypto.ts`)
- Uses TweetNaCl.js for implementation of NaCl (Networking and Cryptography library)
- Implements both symmetric and asymmetric encryption
- Provides key generation, derivation, and management functions
- Includes functions for encrypting/decrypting user preferences and messages

### 2. Key Management System (`src/lib/encryption/keyManager.ts`)
- Securely stores and manages encryption keys in browser storage
- Handles key generation, storage, and retrieval
- Implements secure key derivation from passwords
- Manages public key sharing for secure messaging

### 3. Encrypted Preferences Hook (`src/lib/hooks/useEncryptedPreferences.ts`)
- React hook for managing encrypted user preferences
- Provides transparent encryption/decryption of user preferences
- Handles key-based authentication for accessing encrypted data
- Supports encryption setup and migration from unencrypted preferences

### 4. Secure Messaging Component (`src/components/SecureMessaging.tsx`)
- Provides an interface for sending and receiving encrypted messages
- Implements end-to-end encrypted messaging between users
- Handles key exchange and message encryption/decryption
- Provides clear feedback on encryption status

### 5. Database Schema Updates
- Added tables for storing encryption keys and encrypted data
- Includes models for:
  - `EncryptionKey`: Stores user public keys and salt
  - `EncryptedPreferences`: Stores encrypted user preferences
  - `EncryptedMessage`: Stores encrypted messages between users

### 6. API Endpoints
- `/api/profile/setup-encryption`: For setting up user encryption
- `/api/profile/encrypted-preferences`: For storing and retrieving encrypted preferences
- `/api/messages/secure`: For sending and receiving encrypted messages
- `/api/users/[id]/public-key`: For fetching users' public keys

## Encryption Process

### Key Generation and Storage
1. When a user sets up encryption, a random salt is generated
2. The user's password and salt are used to derive a secure encryption key
3. A key pair (public/private) is generated from the derived key
4. The public key and salt are stored on the server
5. The private key is derived from the password when needed and never stored persistently

### Data Encryption
1. When saving sensitive data (e.g., preferences), it is encrypted on the client side
2. The encryption uses the derived key to encrypt data with NaCl's secretbox (symmetric encryption)
3. The encrypted data and nonce (initialization vector) are sent to the server
4. The server only stores the encrypted data, without the ability to decrypt it

### Secure Messaging
1. User A retrieves User B's public key from the server
2. User A encrypts a message using their private key and User B's public key
3. The encrypted message is stored on the server
4. When User B retrieves the message, they decrypt it using their private key and User A's public key
5. The server only acts as a relay and cannot read the message contents

## Security Considerations

### Password Management
- User passwords are never stored on the server
- Passwords are used to derive encryption keys through secure key derivation (PBKDF2)
- If a user forgets their password, encrypted data cannot be recovered

### Key Handling
- Private keys are never transmitted to the server
- Private keys are only stored temporarily in memory and session storage
- Public keys can be freely shared and are stored on the server

### Authentication
- Strong authentication is required before accessing encryption features
- Password strength requirements (minimum 8 characters) help protect against brute force attacks
- Multiple authentication factors increase security (when using MFA)

### Forward Secrecy
- Different keys are used for different types of data
- Message encryption uses unique nonce values for each message
- Different encryption contexts use different key derivation paths

## Limitations and Future Improvements

### Current Limitations
- If a user forgets their password, encrypted data is lost
- No key rotation mechanism is currently implemented
- Limited recovery options for encrypted data

### Planned Improvements
- Implement key rotation mechanisms
- Add support for recovery keys
- Improve key management on multiple devices
- Add zero-knowledge proofs for authentication

## Usage

### Setting Up Encryption
Users can set up encryption by:
1. Navigating to security settings
2. Setting up an encryption password
3. Confirming the password
4. Following the setup process

### Sending Encrypted Messages
To send encrypted messages:
1. Navigate to the messaging interface
2. Select a recipient who has encryption enabled
3. Type and send your message
4. Messages are automatically encrypted end-to-end

### Accessing Encrypted Data on New Devices
When a user logs in on a new device:
1. They will be prompted for their encryption password
2. The password is used to derive the necessary encryption keys
3. Once authenticated, encrypted data can be accessed on the new device

## Implementation Details

### Encryption Algorithms
- **Key Derivation**: PBKDF2 with SHA-256
- **Symmetric Encryption**: NaCl secretbox (XSalsa20 + Poly1305)
- **Asymmetric Encryption**: NaCl box (Curve25519 + XSalsa20 + Poly1305)
- **Password Hashing**: Bcrypt (for authentication, separate from encryption)

### Storage Security
- Public keys stored in `EncryptionKey` table in the database
- Encrypted data stored in separate tables with references to users
- Encrypted data includes the ciphertext and nonce, but not the keys

### Client-Side Security
- Keys are derived from passwords using secure key derivation functions
- Local storage is used to store public keys and encrypted private keys
- Session storage is used for temporary storage of derived keys
- Memory is used for active encryption operations

## Testing

### Security Testing
- [ ] Penetration testing of the encryption implementation
- [ ] Audit of key management procedures
- [ ] Review of cryptographic algorithm implementations

### Functional Testing
- [x] Test key generation and storage
- [x] Test encryption and decryption of user preferences
- [x] Test secure messaging between users
- [x] Test authentication and key derivation

## References

- [TweetNaCl.js Documentation](https://github.com/dchest/tweetnacl-js)
- [Secure Remote Password Protocol](https://en.wikipedia.org/wiki/Secure_Remote_Password_protocol)
- [Web Cryptography API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [End-to-End Encryption Best Practices](https://protonmail.com/blog/what-is-end-to-end-encryption/) 