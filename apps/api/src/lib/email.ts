import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import Handlebars from 'handlebars';
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config';
import { logger } from './logger';

let transporter: Transporter | null = null;

const getTransporter = async (): Promise<Transporter> => {
  if (transporter) return transporter;

  if (config.isDev && !config.email.user) {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    logger.info('Using Ethereal test email account');
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: { user: config.email.user, pass: config.email.pass },
  });

  return transporter;
};

const renderTemplate = (
  templateName: string,
  data: Record<string, any>
): string => {
  // Bundled build: dist/main.js next to dist/assets. Source layout: src/lib next to src/assets.
  const candidates = [
    path.join(__dirname, 'assets', `${templateName}.html`),
    path.join(__dirname, '..', 'assets', `${templateName}.html`),
  ];
  const templatePath = candidates.find(fs.existsSync);
  if (!templatePath) throw new Error(`Email template not found: ${templateName}`);
  const source = fs.readFileSync(templatePath, 'utf8');
  return Handlebars.compile(source)(data);
};

export const sendEmail = async (opts: {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}): Promise<void> => {
  try {
    const t = await getTransporter();
    const html = renderTemplate(opts.template, opts.data);
    const result = await t.sendMail({
      from: config.email.from,
      to: opts.to,
      subject: opts.subject,
      html,
    });

    if (config.isDev) {
      const previewUrl = nodemailer.getTestMessageUrl(result);
      if (previewUrl) logger.info(`Email preview: ${previewUrl}`);
    }

    logger.info('Email sent', { to: opts.to, subject: opts.subject });
  } catch (err) {
    logger.error('Failed to send email', err);
  }
};
