import { Sequelize } from 'sequelize-typescript';
import { ConfigService } from '../config/config.service';
import { User } from '../modules/user/user.entity';
import { Role } from 'src/modules/role/role.entity';
import { Token } from 'src/modules/user/token.entity';
import { ItemFolder } from 'src/modules/item/item-folder.entity';
import { Item } from 'src/modules/item/item.entity';
import { ItemTag } from 'src/modules/item/item-tag.entity';
import { Tag } from 'src/modules/tag/tag.entity';
import { Question } from 'src/modules/question/question.entity';
import { Notification } from 'src/modules/notification/notification.entity';
import { Permission } from 'src/modules/role/permission.entity';
import { RolePermission } from 'src/modules/role/role-permission.entity';
import { Exam } from 'src/modules/exam/exam.entity';
import { Section } from 'src/modules/section/section.entity';
import { SectionItem } from 'src/modules/section/section-item.entity';
import { ExamItem } from 'src/modules/exam/exam-items.entity';
import { ExamCenter } from 'src/modules/exam/exam-center.entity';
import { Center } from 'src/modules/exam/center.entity';
import { Candidate } from 'src/modules/candidate/candidate.entity';
import { CandidateExam } from 'src/modules/candidate-exam/candidate-exam.entity';
import { CandidateResponse } from 'src/modules/exam/response.entity';
import { CandidateProgress } from 'src/modules/candidate/candidate-progress.entity';
import { Grade } from 'src/modules/exam/grade.entity';
import { AuditLog } from 'src/modules/audit/audit-log.entity';
import { Faq } from 'src/modules/faq/faq.entity';
import { Setting } from 'src/modules/settings/setting.entity';
import { CandidateSection } from 'src/modules/candidate/candidate-section.entity';
import { Reminder } from 'src/modules/notification/reminder.entity';
import { ExamHistory } from 'src/modules/audit/history.entity';
import { Violation } from 'src/modules/violation/violation.entity';

export const databaseProviders = [
  {
    provide: 'SEQUELIZE',
    useFactory: async (configService: ConfigService) => {


        const sequelize = new Sequelize({
          dialect: 'mysql',
          host: configService.dbHost,
          port: configService.dbPort,
          username: configService.dbUser,
          password: configService.dbPassword,
          database: configService.dbName,
        });
        sequelize.addModels([User,Role,Token,Item,ItemTag,ItemFolder,Tag,Question,Notification,Permission,RolePermission,Exam,Section,SectionItem,ExamItem,Center,ExamCenter,CandidateExam,Candidate,CandidateResponse,CandidateProgress,Grade,AuditLog,Faq,Setting,CandidateSection,Reminder,ExamHistory,Violation]);
       if (configService.sync === true) {
         await sequelize.sync();
        }
        return sequelize;

    },
    inject: [ConfigService], // Inject the ConfigService
  },
];
