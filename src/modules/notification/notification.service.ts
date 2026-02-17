import { Injectable, Inject } from '@nestjs/common';
import { hash } from 'bcryptjs';
import { ApiResponse } from 'src/app.interface';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { Notification } from './notification.entity';
import * as moment from 'moment';
import { SetNotificationPrefDto, SetTwoFactorDto } from './dto/set-notification-pref.dto';
import { Setting } from '../settings/setting.entity';

@Injectable()
export class NotificationService {
  constructor(
    @Inject('NOTIFICATIONS_REPOSITORY')
    private  notificationRepository: typeof Notification,
  
  ) {}
  
    
  async createNotification(createNotificationDto: CreateNotificationDto): Promise<Notification>{
    try{
        
        return await this.notificationRepository.create<Notification>({
            subject: createNotificationDto.subject,
            message: createNotificationDto.message,
            userId: createNotificationDto.userId,
            isScheduled: createNotificationDto.isScheduled,
             sentOn: createNotificationDto.sentOn
         });
       
    }
    catch(err){
      throw err;
    }
  }

 

  async getNotificationsByuserId(userId:string,page: number = 1,limit: number = 10): Promise<ApiResponse> {
    const offset = (page - 1) * limit;

    try {

      const { rows, count } = await this.notificationRepository.findAndCountAll<Notification>({
        where:{userId:userId},
        limit:Number(limit),
        offset,
      });

      return {
        status: 200,
        message: 'notifications retrieved successfully',
        data: rows,
        pageInfo: {
          totalItems: count,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
        },
        error: false,
      };
    } catch (err) {
      return {
        status: 500,
        message: err.message,
        error: true,
      };
    }
  }


  async  getNotificationHistory() {
    try {
      const twentyFourHoursAgo = moment().subtract(24, 'hours');
  
      // Fetch notifications from the database
      const notifications = await this.notificationRepository.findAll();
     
      // Filter notifications sent within the last 24 hours
      const filteredNotifications = notifications.filter((notification) => {
        const sentOn = moment(notification.sentOn);
        return sentOn.isAfter(twentyFourHoursAgo);
      });
      
      console.log(filteredNotifications);
  
      // Sort notifications by time difference in ascending order
      filteredNotifications.sort((a, b) => {
        const sentOnA = moment(a.sentOn);
        const sentOnB = moment(b.sentOn);
        const timeDifferenceA = moment.duration(moment().diff(sentOnA)).asSeconds();
        const timeDifferenceB = moment.duration(moment().diff(sentOnB)).asSeconds();
        return timeDifferenceA - timeDifferenceB;
      });
  
      return {
        status: 200,
        message: 'Notifications retrieved and sorted successfully',
        data: filteredNotifications,
        error: false,
      };
    } catch (err) {
      console.log(err)
      return {
        status: 500,
        message: err.message,
        error: true,
      };
    }
  }
  
  async setNotificationPreference(setDto: SetNotificationPrefDto){
    try{
       const settings = await Setting.findAll();
       console.log(settings)
       if(!settings[0]){
          await Setting.create({
            twoFactorSettings:{
              emailAuth: true,
              mobileAuth:true
            },
            notificationPreferences:{
              ...setDto
            }
          })
       }
       else{
         await Setting.update({
          notificationPreferences:setDto
         },{where:{id:settings[0].id}});
       }

       return {
        status: 200,
        message: "Notification Preferences updated successfully",
        error: false
      }
    }
    catch(e){
        return {
           status: 500,
           message: e.message,
           error: true
        }
    }
  }

  async updateTwoFactorSettings(setDto: SetTwoFactorDto){
    try{
       const settings = await Setting.findAll();
       console.log(settings)
       if(!settings[0]){
         await Setting.create({
            twoFactorSettings:{
              ...setDto
            },
            notificationPreferences:{
              allowAll:true,
              onInviteAcceptance: true,
              anHourToExam:true,
              onPushItem: true,
              atEODTrigger: true,
              forOnlineExamReg:true
            }
          })
       }
       else{
         await Setting.update({
          twoFactorSettings:setDto
         },{where:{id:settings[0].id}});
       }

       return {
        status: 200,
        message: "Two-Factor Auth settings updated successfully",
        error: false
      }
    }
    catch(e){
        return {
           status: 500,
           message: e.message,
           error: true
        }
    }
  }

  async getTwoFactorSettings(){
    try{
       const settings = await Setting.findAll();
       console.log(settings[0])
     

       return {
        status: 200,
        message: "Two-factor settings retrieved successfully",
        data:settings[0].twoFactorSettings,
        error: false
      }
    }
    catch(e){
        return {
           status: 500,
           message: e.message,
           error: true
        }
    }
  }
  async getNotificationPreference(){
    try{
       const settings = await Setting.findAll();
      
       return {
        status: 200,
        message: "Notification Preferences retrieved successfully",
        data:settings[0].notificationPreferences,
        error: false
      }
    }
    catch(e){
        return {
           status: 500,
           message: e.message,
           error: true
        }
    }
  }
  async clearAllNotificationHistory() {
    try {
     
      const result = await Notification.destroy({
        truncate: true,
      });
  
      return {
        status: 200,
        message: `Cleared notification(s) from history`,
        error: false,
      };
    } catch (err) {
      return {
        status: 500,
        message: err.message,
        error: true,
      };
    }
  }
  

  async getNotificationById(id:string): Promise<ApiResponse> {
    try {

      const notification  = await this.notificationRepository.findByPk<Notification>(id);

      return {
        status: 200,
        message: 'notification retrieved successfully',
        data: notification,
        error: false,
      };
    } catch (err) {
      return {
        status: 500,
        message: err.message,
        error: true,
      };
    }
  }







}


