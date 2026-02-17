import { Module, forwardRef } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { Violation } from './violation.entity';
import { ViolationService } from './violation.service';
import { ExamModule } from '../exam/exam.module';
import { CandidateModule } from '../candidate/candidate.module';

@Module({
  imports: [
    DatabaseModule,
    forwardRef(() => ExamModule),
    forwardRef(() => CandidateModule),
  ],
  providers: [
    ViolationService,
    {
      provide: 'VIOLATIONS_REPOSITORY',
      useValue: Violation,
    },
  ],
  exports: [ViolationService],
})
export class ViolationModule {}

