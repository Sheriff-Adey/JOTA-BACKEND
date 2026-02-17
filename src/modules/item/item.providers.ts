
import { Item } from './item.entity';

export const itemProviders = [
  {
    provide: 'ITEMS_REPOSITORY',
    useValue: Item,
  },
];