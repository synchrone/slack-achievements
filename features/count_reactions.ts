import {Entity, PrimaryKey, Property} from '@mikro-orm/core'
import { MikroORM } from '@mikro-orm/core/MikroORM'
import { AbstractSqlDriver } from '@mikro-orm/sqlite'
import {Botkit, BotkitMessage} from 'botkit'

interface ReactionEvent extends BotkitMessage {
    team: string
    item_user: string
    reaction: string
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

    public constructor(
        user: string,
        toUser: string,
        reaction: string,
        channel: string,
        createdAt?: Date
    ) {
        this.user = user
        this.toUser = toUser
        this.reaction = reaction
        this.channel = channel

        if(createdAt) {
            this.createdAt = createdAt
        }
    }
}

export let orm: MikroORM<AbstractSqlDriver>
MikroORM.init().then(o => orm = o as any)

export default (controller: Botkit) => {
    controller.on('reaction_removed', async (bot, message) => {
        const reaction = message as ReactionEvent
    })

    controller.on('reaction_added', async (bot, message) => {
        const reaction = message as ReactionEvent
        if(!reaction.item_user){
            // reaction to a bot or system message
            return
        }

        await orm.em.persistAndFlush(new Reaction(reaction.user, reaction.item_user, reaction.reaction, reaction.channel, reaction.incoming_message.timestamp));
    })
}
