import { compare, hash } from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function comparePasswords(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return compare(plainPassword, hashedPassword);
} 