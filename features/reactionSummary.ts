import {Botkit, BotkitMessage} from "botkit";
import {orm} from "../bot";
import {Reaction} from "../models/reaction";

function messagePlainText(message: BotkitMessage){
    if(message.text){ return message.text}

    if(message.blocks){
        return message.blocks.map(b => blockToPlain(b)).join(' ')
    }
}

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

export default (controller: Botkit) => {
    controller.on('app_mention', async (bot, message) => {
        const plainMessage = messagePlainText(message)
        if (plainMessage.indexOf('?') > -1) {
            const reactionsQuery = orm.em.createQueryBuilder(Reaction)
                .select('count(0) as count')
                .addSelect('to_user')
                .addSelect('reaction')
                .where('created_at > ?', [(+new Date()) - 7 * 24 * 60 * 60 * 1000])
                .andWhere({channel: message.channel})
                .groupBy(['to_user', 'reaction'])
                .having('count > 1')

            const reactions = await reactionsQuery.execute()

            if(reactions.length < 1){
                await bot.reply(message, `I'm just gonna observe for a little longer`)
                return
            }

            const users = {} as { [user: string]: { [reaction: string]: number } }
            for (const entry of reactions) {
                users[entry.toUser] = users[entry.toUser] || {}
                users[entry.toUser][entry.reaction] = entry.count
            }

            const leaderboard = Object.entries(users).map(([user, reactions]) =>
                `<@${user}>: ${Object.entries(reactions).map(([reaction, count]) => 
                        `x${count} :${reaction}:`)
                    .join(', ')}`
            ).join('\n')

            await bot.reply(message, {
                "blocks": [
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": `*This Week's MVPs*\n\n` + leaderboard
                        }
                    }
                ]
            })
        }
    })
}
