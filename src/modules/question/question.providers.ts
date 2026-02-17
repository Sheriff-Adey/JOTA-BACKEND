import { Question } from "./question.entity";


export const questionProviders = [
  {
    provide: 'QUESTIONS_REPOSITORY',
    useValue: Question,
  },
];