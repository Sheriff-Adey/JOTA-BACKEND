// twilio.service.ts
import { Injectable } from '@nestjs/common';
import * as Twilio from 'twilio';
import * as config from 'config';

@Injectable()
export class TwilioService {
  private client: Twilio.Twilio;
  private twilioConfig: {
    accountSid: string;
    authToken: string;
    phoneNo: string
  };
  private isEnabled: boolean = false;

  constructor() {
    this.twilioConfig = config.get("twilio");
    
    // Validate credentials before initializing - accountSid must start with "AC"
    if (this.twilioConfig.accountSid && this.twilioConfig.accountSid.startsWith('AC') &&
        this.twilioConfig.authToken && this.twilioConfig.authToken.length > 0) {
      try {
        this.client = Twilio(this.twilioConfig.accountSid, this.twilioConfig.authToken);
        this.isEnabled = true;
        console.log('Twilio SMS service initialized successfully');
      } catch (error) {
        console.warn('Failed to initialize Twilio SMS service:', error.message);
        this.isEnabled = false;
      }
    } else {
      console.warn('Twilio credentials are invalid or missing. SMS service is disabled. AccountSid must start with "AC".');
      this.isEnabled = false;
    }
  }

  async sendMessage(to: string, from: string, body: string) {
    if (!this.isEnabled) {
      console.warn('Twilio SMS service is disabled. Message not sent.');
      return null;
    }
    
    return await this.client.messages.create({
      to,
      from,
      body,
    });
  }
}
