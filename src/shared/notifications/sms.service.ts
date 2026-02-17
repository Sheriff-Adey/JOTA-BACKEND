// twilio.service.ts
import { Injectable } from '@nestjs/common';
import * as Twilio from 'twilio';
import * as config from 'config';

@Injectable()
export class TwilioService {
  private client:  Twilio.Twilio;
  private twilioConfig: {
    accountSid: string;
    authToken: string;
    phoneNo:string
  };
  constructor() {
    
   this.twilioConfig = config.get("twilio")
    this.client = Twilio(this.twilioConfig.accountSid, this.twilioConfig.authToken);
  }

  async sendMessage(to: string, from: string, body: string) {
    return await this.client.messages.create({
      to,
      from,
      body,
    });
  }
}
