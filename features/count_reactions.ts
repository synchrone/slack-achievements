import {Entity, PrimaryKey, Property} from '@mikro-orm/core'
import { MikroORM } from '@mikro-orm/core/MikroORM'
import { AbstractSqlDriver } from '@mikro-orm/sqlite'
import {Botkit, BotkitMessage, BotWorker} from 'botkit'

interface ReactionEvent extends BotkitMessage {
    team: string
    item_user: string
    reaction: string
    event_ts: string // <ts>.<msec> // this event's timestamp
    item: {
        ts: string  // <ts>.<msec> // the chat message this reaction refers to
    }
}

@Entity()
export class Reaction {
    @PrimaryKey()
    id!: number

    @Property()
    public user!: string

    @Property()
    public toUser!: string

    @Property()
    public reaction!: string

    @Property()
    public channel!: string

    @Property({ onUpdate: () => new Date() })
    public createdAt!: Date

    public constructor(props: Partial<Reaction>) {
        Object.assign(this, props)
    }
}

export let orm: MikroORM<AbstractSqlDriver>
MikroORM.init().then(o => orm = o as any)


export default (controller: Botkit) => {
    async function handleReaction(bot: BotWorker, message: BotkitMessage){
        const event = message as ReactionEvent
        if(!event.item_user){
            // reaction to a bot or system message
            return
        }

        console.log(JSON.stringify(event))

        const reaction: Partial<Reaction> = {
            channel: event.channel,
            user: event.user,
            toUser: event.item_user,
            reaction: event.reaction,
            createdAt: new Date(parseFloat(event.item.ts)*1000)
        }

        if(message.type === 'reaction_added'){
            await orm.em.persistAndFlush(new Reaction(reaction))
        }else if(message.type === 'reaction_removed'){
            await orm.em.transactional(em => em.nativeDelete(Reaction, reaction))
        }
    }

    controller.on('reaction_removed', handleReaction)
    controller.on('reaction_added', handleReaction)
}
