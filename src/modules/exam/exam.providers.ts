
import { Section } from '../section/section.entity';
import { Exam}  from './exam.entity';

export const examProviders = [
  {
    provide: 'EXAMS_REPOSITORY',
    useValue: Exam,
  },
  {
    provide: 'SECTIONS_REPOSITORY',
    useValue: Section,
  },
 
];