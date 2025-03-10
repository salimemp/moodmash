import { 
  PrismaClient as OriginalPrismaClient, 
  Prisma as PrismaNamespace,
  User
} from '@prisma/client';

// Define the shape of the Encryption Key model
interface EncryptionKeyModel {
  findUnique: (args: {
    where: {
      id?: string;
      userId?: string;
    };
    select?: any;
  }) => Promise<any>;
  
  findFirst: (args: {
    where: {
      userId?: string;
    };
    select?: any;
  }) => Promise<any>;
  
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
    select?: any;
  }) => Promise<any>;
  
  create: (args: {
    data: {
      userId: string;
      publicKey: string;
      salt: string;
      user?: { connect: { id: string } };
    };
    select?: any;
  }) => Promise<any>;
}

// Define the shape of the Encrypted Preferences model
interface EncryptedPreferencesModel {
  findUnique: (args: {
    where: {
      id?: string;
      userId?: string;
    };
    select?: any;
  }) => Promise<any>;
  
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
    select?: any;
  }) => Promise<any>;
  
  create: (args: {
    data: {
      userId: string;
      ciphertext: string;
      nonce: string;
      user?: { connect: { id: string } };
    };
    select?: any;
  }) => Promise<any>;
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
  }) => Promise<any[]>;
  
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
    select?: any;
  }) => Promise<any>;
}

// Extend the transaction context for Prisma
interface ExtendedTransactionClient extends Omit<PrismaNamespace.TransactionClient, keyof PrismaNamespace.TransactionClient> {
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
    $transaction<P extends PrismaNamespace.PrismaPromise<any>[]>(
      arg: [...P],
      options?: { maxWait?: number; timeout?: number; isolationLevel?: PrismaNamespace.TransactionIsolationLevel }
    ): Promise<PrismaNamespace.UnwrapTuple<P>>;
    
    $transaction<R>(
      fn: (prisma: ExtendedTransactionClient) => Promise<R>,
      options?: { maxWait?: number; timeout?: number; isolationLevel?: PrismaNamespace.TransactionIsolationLevel }
    ): Promise<R>;
  }
} 