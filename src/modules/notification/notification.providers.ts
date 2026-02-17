import { Notification } from './notification.entity';

export const notificationProviders = [
  {
    provide: 'NOTIFICATIONS_REPOSITORY',
    useValue: Notification,
  },
];