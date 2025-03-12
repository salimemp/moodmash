import {
  PrismaClient as OriginalPrismaClient,
  Prisma as PrismaNamespace
} from '@prisma/client';

// Define the shape of Encryption Key record
interface EncryptionKey {
  id: string;
  userId: string;
  publicKey: string;
  salt: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define selection types for Encryption Key
type EncryptionKeySelect = {
  id?: boolean;
  userId?: boolean;
  publicKey?: boolean;
  salt?: boolean;
  createdAt?: boolean;
  updatedAt?: boolean;
};

// Define the shape of Encrypted Preferences record
interface EncryptedPreferences {
  id: string;
  userId: string;
  ciphertext: string;
  nonce: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define selection types for Encrypted Preferences
type EncryptedPreferencesSelect = {
  id?: boolean;
  userId?: boolean;
  ciphertext?: boolean;
  nonce?: boolean;
  createdAt?: boolean;
  updatedAt?: boolean;
};

// Define the shape of Encrypted Message record
interface EncryptedMessage {
  id: string;
  senderId: string;
  recipientId: string;
  ciphertext: string;
  nonce: string;
  senderPublicKey: string;
  timestamp: Date;
  metadata?: string | null;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
  sender?: {
    id: string;
    name?: string | null;
    image?: string | null;
  };
  recipient?: {
    id: string;
    name?: string | null;
    image?: string | null;
  };
}

// Define selection types for Encrypted Message
type EncryptedMessageSelect = {
  id?: boolean;
  senderId?: boolean;
  recipientId?: boolean;
  ciphertext?: boolean;
  nonce?: boolean;
  senderPublicKey?: boolean;
  timestamp?: boolean;
  metadata?: boolean;
  read?: boolean;
  createdAt?: boolean;
  updatedAt?: boolean;
};

// Define the shape of the Encryption Key model
interface EncryptionKeyModel {
  findUnique: (args: {
    where: {
      id?: string;
      userId?: string;
    };
    select?: EncryptionKeySelect;
  }) => Promise<EncryptionKey | null>;

  findFirst: (args: {
    where: {
      userId?: string;
    };
    select?: EncryptionKeySelect;
  }) => Promise<EncryptionKey | null>;

  update: (args: {
    where: {
      id?: string;
      userId?: string;
    };
    data: {
      publicKey?: string;
      salt?: string;
      updatedAt?: Date;
    };
    select?: EncryptionKeySelect;
  }) => Promise<EncryptionKey>;

  create: (args: {
    data: {
      userId: string;
      publicKey: string;
      salt: string;
      user?: { connect: { id: string } };
    };
    select?: EncryptionKeySelect;
  }) => Promise<EncryptionKey>;
}

// Define the shape of the Encrypted Preferences model
interface EncryptedPreferencesModel {
  findUnique: (args: {
    where: {
      id?: string;
      userId?: string;
    };
    select?: EncryptedPreferencesSelect;
  }) => Promise<EncryptedPreferences | null>;

  update: (args: {
    where: {
      id?: string;
      userId?: string;
    };
    data: {
      ciphertext: string;
      nonce: string;
      updatedAt?: Date;
    };
    select?: EncryptedPreferencesSelect;
  }) => Promise<EncryptedPreferences>;

  create: (args: {
    data: {
      userId: string;
      ciphertext: string;
      nonce: string;
      user?: { connect: { id: string } };
    };
    select?: EncryptedPreferencesSelect;
  }) => Promise<EncryptedPreferences>;
}

// Define the shape of the Encrypted Message model
interface EncryptedMessageModel {
  findMany: (args: {
    where: {
      id?: string;
      senderId?: string;
      recipientId?: string;
      read?: boolean;
    };
    include?: {
      sender?: {
        select?: {
          id?: boolean;
          name?: boolean;
          image?: boolean;
        };
      };
      recipient?: {
        select?: {
          id?: boolean;
          name?: boolean;
          image?: boolean;
        };
      };
    };
    orderBy?: {
      timestamp?: 'asc' | 'desc';
      createdAt?: 'asc' | 'desc';
    };
    take?: number;
    skip?: number;
  }) => Promise<EncryptedMessage[]>;

  count: (args: {
    where: {
      id?: string;
      senderId?: string;
      recipientId?: string;
      read?: boolean;
    };
  }) => Promise<number>;

  create: (args: {
    data: {
      sender: { connect: { id: string } };
      recipient: { connect: { id: string } };
      ciphertext: string;
      nonce: string;
      senderPublicKey: string;
      timestamp?: Date;
      metadata?: string | null;
      read?: boolean;
    };
    select?: EncryptedMessageSelect;
  }) => Promise<EncryptedMessage>;
}

// Define a type for generic Prisma promises instead of using any
type PrismaPromise<T> = PrismaNamespace.PrismaPromise<T>;

// Extend the transaction context for Prisma
interface ExtendedTransactionClient
  extends Omit<PrismaNamespace.TransactionClient, keyof PrismaNamespace.TransactionClient> {
  encryptionKey: EncryptionKeyModel;
  encryptedPreferences: EncryptedPreferencesModel;
  encryptedMessage: EncryptedMessageModel;
}

// Extend the PrismaClient with our custom models
declare module '@prisma/client' {
  export interface PrismaClient extends OriginalPrismaClient {
    encryptionKey: EncryptionKeyModel;
    encryptedPreferences: EncryptedPreferencesModel;
    encryptedMessage: EncryptedMessageModel;

    // Extend the $transaction method to use our extended transaction client
    $transaction<P extends PrismaPromise<unknown>[]>(
      arg: [...P],
      options?: {
        maxWait?: number;
        timeout?: number;
        isolationLevel?: PrismaNamespace.TransactionIsolationLevel;
      }
    ): Promise<PrismaNamespace.UnwrapTuple<P>>;

    $transaction<R>(
      fn: (prisma: ExtendedTransactionClient) => Promise<R>,
      options?: {
        maxWait?: number;
        timeout?: number;
        isolationLevel?: PrismaNamespace.TransactionIsolationLevel;
      }
    ): Promise<R>;
  }
}
