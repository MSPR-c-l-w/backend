import * as bcrypt from 'bcrypt';

const DEFAULT_BCRYPT_SALT_ROUNDS = 12;

export async function hashPassword(
  password: string,
  saltRounds = DEFAULT_BCRYPT_SALT_ROUNDS,
): Promise<string> {
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

