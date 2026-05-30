import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Charge `.env` (config non sensible) puis `.env.secrets` (secrets).
 * En Docker, les variables peuvent aussi être injectées via `env_file` sans fichier local.
 */
export function loadEnvFiles(): void {
  const root = process.cwd();
  const envPath = resolve(root, '.env');
  const secretsPath = resolve(root, '.env.secrets');

  if (existsSync(envPath)) {
    config({ path: envPath });
  }
  if (existsSync(secretsPath)) {
    config({ path: secretsPath, override: true });
  }
}

loadEnvFiles();
