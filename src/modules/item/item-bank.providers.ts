
import { ItemFolder } from './item-folder.entity';

export const itemBankProviders = [
  {
    provide: 'ITEMBANKS_REPOSITORY',
    useValue: ItemFolder,
  },
];