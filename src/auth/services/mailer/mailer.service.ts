import { Injectable, Logger } from '@nestjs/common';
import * as React from 'react';
import { render } from '@react-email/render';
import { Resend } from 'resend';
import { PasswordResetEmail } from 'src/auth/emails/PasswordResetEmail';
import { AccountVerificationEmail } from 'src/auth/emails/AccountVerificationEmail';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  private buildVerifyUrl(token: string) {
    const base =
      process.env.APP_URL ??
      process.env.FRONTEND_URL ??
      'http://localhost:3000';
    return `${base.replace(/\/$/, '')}/verify-account?token=${encodeURIComponent(token)}`;
  }

  private buildResetUrl(token: string) {
    const base =
      process.env.APP_URL ??
      process.env.FRONTEND_URL ??
      'http://localhost:3000';
    return `${base.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;
  }

  private async sendMail(
    to: string,
    subject: string,
    html: string,
    text: string,
  ) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM ?? 'no-reply@example.com';

    if (!apiKey) {
      this.logger.warn(
        `RESEND_API_KEY non configuré. Email non envoyé à ${to}.`,
      );
      return;
    }

    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      this.logger.error(`Echec envoi email à ${to}: ${error.message}`);
      throw new Error(error.message);
    }
  }

  async sendAccountVerificationEmail(to: string, token: string) {
    const url = this.buildVerifyUrl(token);
    const subject = 'Validez votre compte HealthAI';
    const html = await render(
      React.createElement(AccountVerificationEmail, { verifyUrl: url }),
    );
    const text = `Bonjour,\n\nPour valider votre compte, cliquez sur ce lien:\n${url}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez ce message.\n`;
    await this.sendMail(to, subject, html, text);
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const url = this.buildResetUrl(token);
    const subject = 'Réinitialisation de votre mot de passe HealthAI';
    const html = await render(
      React.createElement(PasswordResetEmail, { resetUrl: url }),
    );
    const text = `Bonjour,\n\nPour réinitialiser votre mot de passe, cliquez sur ce lien:\n${url}\n\nCe lien est valable 30 minutes.\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez ce message.\n`;
    await this.sendMail(to, subject, html, text);
  }
}
