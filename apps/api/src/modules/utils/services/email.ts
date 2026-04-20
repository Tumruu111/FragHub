import * as nodemailer from 'nodemailer';
import path from 'node:path';
import fs from 'node:fs';
import Handlebars from 'handlebars';

export class EmailService {
  static generateTemplate(html: string, data: any) {
    const template = Handlebars.compile(
      fs.readFileSync(path.join(__dirname, `/assets/${html}.html`), 'utf8')
    );

    return template(data);
  }

  static async sendEmail(to: string, subject: string, html: string, data: any) {
    const testAccount = await nodemailer.createTestAccount();

    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const result = await transporter.sendMail({
      to,
      subject,
      html: this.generateTemplate(html, data),
    });

    const url = nodemailer.getTestMessageUrl(result);

    return url;
  }
}
