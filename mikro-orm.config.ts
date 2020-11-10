import { Options } from '@mikro-orm/core';
import {MikroORM} from "@mikro-orm/core/MikroORM";
import {Configuration} from "@mikro-orm/core/utils/Configuration";
import {AbstractSqlDriver} from "@mikro-orm/sqlite";
import {Reaction} from "./models/reaction";
import {Installation} from "./models/installation";
import {Settings} from "./models/settings";

const config: Options = {
    type: (process.env.DB_TYPE ?? 'sqlite') as keyof typeof Configuration.PLATFORMS, // one of `mongo` | `mysql` | `mariadb` | `postgresql` | `sqlite`
    dbName: process.env.DB_NAME ?? 'bot.sqlite',
    clientUrl: process.env.DB_URL,
    debug: process.env.NODE_ENV !== 'production',
    entities: [Installation, Reaction, Settings],
};

export let orm: MikroORM<AbstractSqlDriver>
export async function startORM(){
    if(!orm){
        orm = await MikroORM.init()
    }
    return orm
}

export default config;