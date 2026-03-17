import { Injectable } from '@nestjs/common';
import crypto from 'node:crypto';

type CsrfTokenPayload = {
  sub: number;
  iat: number;
  exp: number;
};

function base64UrlEncode(data: string | Buffer): string {
  return Buffer.from(data)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(data: string): Buffer {
  const padded = data.padEnd(data.length + ((4 - (data.length % 4)) % 4), '=');
  const replaced = padded.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(replaced, 'base64');
}

@Injectable()
export class CsrfService {
  private readonly secret: string;
  private readonly ttlMs: number;

  constructor() {
    const rawSecret =
      process.env.CSRF_SECRET ??
      process.env.JWT_SECRET ??
      (process.env.NODE_ENV === 'production' ? undefined : 'dev-csrf-secret');
    if (!rawSecret) {
      throw new Error('CSRF_SECRET is required in production');
    }
    this.secret = rawSecret;
    // Durée de vie d'un token CSRF (par défaut: 2 heures)
    this.ttlMs =
      process.env.CSRF_TTL_MS != null
        ? Number.parseInt(process.env.CSRF_TTL_MS, 10)
        : 2 * 60 * 60 * 1000;
  }

  issue(sub: number): string {
    const now = Date.now();
    const payload: CsrfTokenPayload = {
      sub,
      iat: Math.floor(now / 1000),
      exp: Math.floor((now + this.ttlMs) / 1000),
    };
    const payloadJson = JSON.stringify(payload);
    const payloadPart = base64UrlEncode(payloadJson);
    const hmac = crypto
      .createHmac('sha256', this.secret)
      .update(payloadPart)
      .digest();
    const signaturePart = base64UrlEncode(hmac);
    return `${payloadPart}.${signaturePart}`;
  }

  verify(token: string, expectedSub?: number): CsrfTokenPayload {
    const parts = token.split('.');
    if (parts.length !== 2) {
      throw new Error('CSRF token mal formé');
    }
    const [payloadPart, signaturePart] = parts;
    const expectedSig = crypto
      .createHmac('sha256', this.secret)
      .update(payloadPart)
      .digest();
    const actualSig = base64UrlDecode(signaturePart);
    if (
      expectedSig.length !== actualSig.length ||
      !crypto.timingSafeEqual(expectedSig, actualSig)
    ) {
      throw new Error('CSRF signature invalide');
    }
    const payloadJson = base64UrlDecode(payloadPart).toString('utf8');
    const payload = JSON.parse(payloadJson) as CsrfTokenPayload;

    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.exp < nowSec) {
      throw new Error('CSRF token expiré');
    }
    if (typeof expectedSub === 'number' && payload.sub !== expectedSub) {
      throw new Error('CSRF token non valide pour cet utilisateur');
    }
    return payload;
  }
}
