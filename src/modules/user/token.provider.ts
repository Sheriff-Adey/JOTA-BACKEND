
import { Token } from './token.entity';
 

export const tokensProviders = [
  {
    provide: 'TOKENS_REPOSITORY',
    useValue: Token,
  },
];