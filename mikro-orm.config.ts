import { Options } from '@mikro-orm/core';
import {Reaction} from "./features/count_reactions";

const config: Options = {
    type: 'sqlite', // one of `mongo` | `mysql` | `mariadb` | `postgresql` | `sqlite`
    dbName: 'reactions.sqlite',
    debug: process.env.NODE_ENV !== 'production',
    entities: [Reaction],
};

export default config;