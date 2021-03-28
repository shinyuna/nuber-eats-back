import got from 'got';
import * as FormData from 'form-data';
import { Inject, Injectable } from '@nestjs/common';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { EmailVar, MailModuleOptions } from './mail.interfaces';

@Injectable()
export class MailService {
  constructor(@Inject(CONFIG_OPTIONS) private readonly options: MailModuleOptions) {}

  async sendEmail(to: string, subject: string, template: string, emailVars: EmailVar[]): Promise<boolean> {
    const form = new FormData();
    form.append('from', `muk._.yoong from Nuber Eats <mailgun@${this.options.domain}>`);
    form.append('to', `${this.options.domain}`);
    form.append('to', `${to}`);
    form.append('subject', subject);
    form.append('template', template);
    emailVars.forEach(eVar => form.append(`v:${eVar.key}`, eVar.value));
    try {
      await got.post(`https://api.mailgun.net/v3/${this.options.domain}/messages`, {
        headers: {
          Authorization: `Basic ${Buffer.from(`api:${this.options.apiKey}`).toString('base64')}`,
        },
        body: form,
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  sendVerificationEmail(email: string, code: string) {
    const username = email.slice(0, email.indexOf('@'));
    this.sendEmail(email, 'Verify Your Email', 'email_confirm_template', [
      { key: 'username', value: username },
      { key: 'code', value: code },
    ]);
  }
}
