import {Botkit} from "botkit";
import { orm } from "../mikro-orm.config";
import {Reaction} from "../models/reaction";
import {messagePlainText, SlackDirectMessage, reply} from "../util/slackMessaging";

export default (controller: Botkit) => {
    controller.on('app_mention', async (bot, message) => {
        const event = message as SlackDirectMessage
        const command = messagePlainText(message)

        if(command.indexOf('karma') >-1  && command.indexOf('?') >-1 ){
            const mentionedReactions = [...command.matchAll(/:([+-_a-z0-9]+?):/g)].map(m => m[1])
            const mentionedUsers = [...command.matchAll(/<@(.+?)>/g)].map(m => m[1])

            const scores = await orm.em.createQueryBuilder(Reaction)
                .select('count(0) as count')
                .addSelect('to_user')
                .addSelect('reaction')
                .groupBy(['to_user'])
                .where({ reaction: {$in: mentionedReactions }})
                .andWhere({ toUser: {$in: mentionedUsers }})
                .orderBy({[`count(0)`]: 'DESC'})
                .execute()

            if(scores.length === 0){
                await bot.reply(message, 'not enough of these reactions for these users')
                return
            }

            let replyMsg = '*Users by Karma*\n\n'
            for(const userScore of scores){
                replyMsg += `<@${userScore.toUser}>: ${userScore.count}\n`
            }

            await reply(bot, message, replyMsg)
        }
    })
}
