import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

type MailConfig = {
  host: string;
  port: number;
  user?: string;
  pass?: string;
  from: string;
};

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  private getConfig(): MailConfig | null {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM;

    if (!host || !from) return null;

    return { host, port, user, pass, from };
  }

  private buildVerifyUrl(token: string) {
    const base = process.env.APP_URL ?? process.env.FRONTEND_URL ?? 'http://localhost:3000';
    return `${base.replace(/\/$/, '')}/verify-account?token=${encodeURIComponent(token)}`;
  }

  private buildResetUrl(token: string) {
    const base = process.env.APP_URL ?? process.env.FRONTEND_URL ?? 'http://localhost:3000';
    return `${base.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;
  }

  private async sendMail(to: string, subject: string, text: string) {
    const cfg = this.getConfig();
    if (!cfg) {
      this.logger.warn(
        `SMTP non configuré (SMTP_HOST/SMTP_FROM). Email non envoyé à ${to}.`,
      );
      return;
    }

    const transport = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.port === 465,
      auth: cfg.user && cfg.pass ? { user: cfg.user, pass: cfg.pass } : undefined,
    });

    await transport.sendMail({
      from: cfg.from,
      to,
      subject,
      text,
    });
  }

  async sendAccountVerificationEmail(to: string, token: string) {
    const url = this.buildVerifyUrl(token);
    const subject = 'Validez votre compte';
    const text = `Bonjour,\n\nPour valider votre compte, cliquez sur ce lien:\n${url}\n\nSi vous n’êtes pas à l’origine de cette demande, ignorez ce message.\n`;
    await this.sendMail(to, subject, text);
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const url = this.buildResetUrl(token);
    const subject = 'Réinitialisation de votre mot de passe';
    const text = `Bonjour,\n\nPour réinitialiser votre mot de passe, cliquez sur ce lien:\n${url}\n\nSi vous n’êtes pas à l’origine de cette demande, ignorez ce message.\n`;
    await this.sendMail(to, subject, text);
  }
}

