import * as config from 'config';
import { Injectable } from '@nestjs/common';
import * as mailgun from 'mailgun-js';
 import * as sgMail from '@sendgrid/mail';

@Injectable()
export class EmailService {
  private mailgunConfig: {
    apiKey: string;
    domain: string;
    sender: string;
  };
  private sendgridConfig: {
    apiKey: string;
    sender: string;
  };

  constructor() {
    this.mailgunConfig = config.get('mailgun');
    this.sendgridConfig = config.get('sendgrid');
    sgMail.setApiKey(this.sendgridConfig.apiKey);
  }

  // async sendEmail(template, receiver, subject, dataObj?): Promise<any> {
  //   const mg = mailgun({ apiKey: this.mailgunConfig.apiKey, domain: this.mailgunConfig.domain });
  //   const data = {
  //     'from': this.mailgunConfig.sender,
  //     'to': receiver,
  //     'subject': subject,
  //     'template': template,
  //     'h:X-Mailgun-Variables': dataObj ? JSON.stringify(dataObj) : '{}',
  //   };
  //   console.log(data)
  //   console.log("mail-gun", mg)
  //   return mg.messages().send(data);
  // }

  async sendEmail(
    receiver: string,
    subject: string,
    body: string,
    isHtml: boolean = false,
  ): Promise<any> {
    const mg = mailgun({ apiKey: this.mailgunConfig.apiKey, domain: this.mailgunConfig.domain });
  
    const data = {
      from: this.mailgunConfig.sender,
      to: receiver,
      subject: subject,
      [isHtml ? 'html' : 'text']: body,  
    };
  
    console.log('Sending email with data:', data);
    return mg.messages().send(data);
  }

  async sendEmailSendgrid(template, receiver, subject, dataObj?): Promise<any> {
    const msg = {
      to: receiver,
      from: this.sendgridConfig.sender,
      subject,
      html: template
     
    };
    //html: template,
    return sgMail.send(msg);

  }

}
