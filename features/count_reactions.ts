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

let orm: MikroORM<AbstractSqlDriver>
MikroORM.init().then(o => orm = o as any)

function blockToPlain(block: any): string {
    if(block.elements){
        return block.elements.map(e => blockToPlain(e).trim()).join(' ')
    }
    if(block.type == 'user'){
        return `<@${block.user_id}>`
    }
    if(block.type == 'text'){
        return block.text
    }
    return `{${block.type}}`
}

function messagePlainText(message: BotkitMessage){
    if(message.text){ return message.text}

    if(message.blocks){
        return message.blocks.map(b => blockToPlain(b)).join(' ')
    }
}

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

    controller.on('app_mention', async (bot, message) => {
        const plainMessage = messagePlainText(message)
        if (plainMessage.indexOf('?') || -1 > -1) {
            const reactions = await orm.em.createQueryBuilder(Reaction)
                .select('count(0) as count')
                .addSelect('to_user')
                .addSelect('reaction')
                .where('created_at > ?', [(+new Date()) - 7 * 24 * 60 * 60 * 1000])
                .groupBy(['to_user', 'reaction'])
                .execute()

            const users = {} as {[user: string]: {[reaction: string]: number}}
            for(const entry of reactions){
                users[entry.toUser] = users[entry.toUser] || {}
                users[entry.toUser][entry.reaction] = entry.count
            }

            const leaderboard = Object.entries(users).map(([user, reactions]) =>
                `<@${user}>: ${Object.entries(reactions)
                    
                    .map(([reaction, count]) => `x${count} :${reaction}:`).join(', ')}`
            ).join('\n')

            await bot.reply(message, {
                "blocks": [
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": leaderboard
                        }
                    }
                ]
            })
        }
    })
}
