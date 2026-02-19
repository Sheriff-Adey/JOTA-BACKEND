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
  
  private isMailgunEnabled: boolean = false;
  private isSendgridEnabled: boolean = false;

  constructor() {
    this.mailgunConfig = config.get('mailgun');
    this.sendgridConfig = config.get('sendgrid');
    
    // Validate Mailgun credentials
    if (this.mailgunConfig.apiKey && this.mailgunConfig.apiKey.length > 0 &&
        this.mailgunConfig.domain && this.mailgunConfig.domain.length > 0) {
      this.isMailgunEnabled = true;
      console.log('Mailgun email service initialized successfully');
    } else {
      console.warn('Mailgun credentials are invalid or missing. Mailgun email service is disabled.');
      this.isMailgunEnabled = false;
    }
    
    // Validate SendGrid credentials - API key must start with "SG."
    if (this.sendgridConfig.apiKey && this.sendgridConfig.apiKey.startsWith('SG.')) {
      try {
        sgMail.setApiKey(this.sendgridConfig.apiKey);
        this.isSendgridEnabled = true;
        console.log('SendGrid email service initialized successfully');
      } catch (error) {
        console.warn('Failed to initialize SendGrid email service:', error.message);
        this.isSendgridEnabled = false;
      }
    } else {
      console.warn('SendGrid API key is invalid or missing. SendGrid email service is disabled. API key must start with "SG."');
      this.isSendgridEnabled = false;
    }
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
    if (!this.isMailgunEnabled) {
      console.warn('Mailgun email service is disabled. Email not sent.');
      return null;
    }
  
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
    if (!this.isSendgridEnabled) {
      console.warn('SendGrid email service is disabled. Email not sent.');
      return null;
    }
    
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
