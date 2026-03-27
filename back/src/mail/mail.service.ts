import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MaileService {
  constructor(private readonly mailerService: MailerService) {}

  async sendEmail(mess: string, to: string, link: string, subject: string) {
    try {
      await this.mailerService.sendMail({
        from: 'codexiumit@gmail.com',
        to,
        subject: subject,
        html: ` <div>
                    <h1>${mess}</h1>
                      <a href="${process.env.API_URL}/${link}">${link}</a>
            </div>`,
      });
    } catch (e) {
      console.log(e.message);
    }
    return true;
  }

  async sendMessageEmail(mess: string, to: string, subject: string) {
    try {
      await this.mailerService.sendMail({
        from: 'codexiumit@gmail.com',
        to: 'info@ralleions.com',
        subject: subject,
        html: ` <div>
                    <div>${mess}</div>

                      
            </div>`,
      });
    } catch (e) {
      console.log(e.message);
    }
    return true;
  }
}
