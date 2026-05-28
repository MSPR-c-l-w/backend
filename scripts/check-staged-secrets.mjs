#!/usr/bin/env node
/**
 * Scan anti-secrets sur les fichiers passés en argument (lint-staged / pre-commit).
 * Bloque les commits contenant des motifs de secrets réels (hors placeholders documentés).
 */
import { readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';

const ALLOWLIST_SUFFIXES = [
  '.secrets.baseline',
  'package-lock.json',
  'pnpm-lock.yaml',
];

const ALLOWLIST_PATHS = new Set([
  '.env.example',
  '.env.secrets.example',
  'env.template',
  'documentation/secrets-management.md',
]);

const PLACEHOLDER =
  /^(change-me|example|your-|dummy|test_|localhost|rootpassword|no-reply@|kg_|xxxxxxxx|<.*>|\*+)$/i;

const SENSITIVE_KEYS =
  /^(JWT_SECRET|CSRF_SECRET|SMTP_PASS|KAGGLE_KEY|WORKOUT_SERVICE_API_KEY|DATABASE_URL|MYSQL_.*PASSWORD|PMA_PASSWORD|API_KEY|SECRET|TOKEN|PASSWORD)\s*=/i;

const PATTERNS = [
  { name: 'clé privée PEM', regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: 'clé AWS', regex: /AKIA[0-9A-Z]{16}/ },
  { name: 'token GitHub', regex: /ghp_[a-zA-Z0-9]{36}/ },
  { name: 'token GitLab', regex: /glpat-[a-zA-Z0-9_-]{20,}/ },
];

function isAllowlisted(filePath) {
  const rel = relative(process.cwd(), filePath).replace(/\\/g, '/');
  if (ALLOWLIST_PATHS.has(rel)) return true;
  return ALLOWLIST_SUFFIXES.some((suffix) => rel.endsWith(suffix));
}

function isPlaceholderValue(value) {
  const trimmed = value.replace(/^['"]|['"]$/g, '').trim();
  if (!trimmed || trimmed.length < 8) return true;
  return PLACEHOLDER.test(trimmed);
}

function scanLine(line, filePath, lineNo, findings) {
  for (const { name, regex } of PATTERNS) {
    if (regex.test(line)) {
      findings.push({ filePath, lineNo, reason: `Motif détecté : ${name}` });
      return;
    }
  }

  const keyMatch = line.match(SENSITIVE_KEYS);
  if (!keyMatch) return;

  const valuePart = line.slice(keyMatch[0].length).split('#')[0]?.trim() ?? '';
  if (!valuePart || isPlaceholderValue(valuePart)) return;

  findings.push({
    filePath,
    lineNo,
    reason: `Valeur sensible probable pour ${keyMatch[0].replace('=', '').trim()}`,
  });
}

function main() {
  const files = process.argv.slice(2).filter((f) => f && !f.startsWith('--'));
  if (files.length === 0) {
    process.exit(0);
  }

  const findings = [];

  for (const file of files) {
    const abs = resolve(file);
    if (isAllowlisted(abs)) continue;

    let content;
    try {
      content = readFileSync(abs, 'utf8');
    } catch {
      continue;
    }

    const lines = content.split(/\r?\n/);
    lines.forEach((line, index) => {
      scanLine(line, abs, index + 1, findings);
    });
  }

  if (findings.length > 0) {
    console.error('\n❌ Secret(s) potentiel(s) détecté(s) — commit bloqué :\n');
    for (const f of findings) {
      const rel = relative(process.cwd(), f.filePath).replace(/\\/g, '/');
      console.error(`  ${rel}:${f.lineNo} — ${f.reason}`);
    }
    console.error(
      '\nSi c’est un faux positif, utilisez un placeholder documenté (.env.example) ou mettez à jour .secrets.baseline (detect-secrets).\n',
    );
    process.exit(1);
  }

  process.exit(0);
}

main();
