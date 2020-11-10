import {EntityManager} from "@mikro-orm/core";
import {orm} from "../mikro-orm.config";
import {Settings} from "../models/settings";

export async function modifySettings(teamId: string, cb: (s: Settings) => any) {
    return orm.em.transactional(async em => {
        const settings = await getSettings(teamId, em)
        await cb(settings)
        await em.persistAndFlush(settings.prepare())
    })
}

export async function getSettings(teamId: string, em?: EntityManager){
    return (await (em || orm.em).findOne(Settings, {teamId})) || new Settings(teamId)
}
