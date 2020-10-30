import { Options } from '@mikro-orm/core';
import {Reaction} from "./models/reaction";
import {Installation} from "./models/installation";

const config: Options = {
    type: 'sqlite', // one of `mongo` | `mysql` | `mariadb` | `postgresql` | `sqlite`
    dbName: process.env.DB_NAME ?? 'reactions.sqlite',
    clientUrl: process.env.DB_URL,
    debug: process.env.NODE_ENV !== 'production',
    entities: [Installation, Reaction],
};

export default config;