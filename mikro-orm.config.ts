import { Options } from '@mikro-orm/core';
import {Reaction} from "./features/count_reactions";

const config: Options = {
    type: 'sqlite', // one of `mongo` | `mysql` | `mariadb` | `postgresql` | `sqlite`
    dbName: 'reactions.sqlite',
    entities: [Reaction],
};

export default config;