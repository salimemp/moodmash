import { compare, hash } from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  try {
    return await hash(password, 12);
  } catch (error: unknown) {
    throw new Error('Error hashing password');
  }
}

export async function comparePasswords(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    return await compare(plainPassword, hashedPassword);
  } catch (error: unknown) {
    throw new Error('Error comparing passwords');
  }
}
