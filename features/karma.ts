import {Botkit} from "botkit";
import { orm } from "../mikro-orm.config";
import {Reaction} from "../models/reaction";
import {messagePlainText, reply} from "../util/slackMessaging";

const topListLength = 50
const defaultGoodKarma = ':thumbsup: :+1: :heavy_plus_sign: :thanks: :heavy_check_mark:'
    .replace(/:/g, '')
    .split(' ')

export default (controller: Botkit) => {
    controller.on('app_mention', async (bot, message) => {
        const command = messagePlainText(message)

        if(command.indexOf('karma') >-1  && command.indexOf('?') >-1 ){
            let reactionsMatch = [...command.matchAll(/:([+-_a-z0-9]+?):/g)];
            let mentionedReactions = reactionsMatch.map(m => m[1])
            const mentionedUsers = [...command.matchAll(/<@(.+?)>/g)].map(m => m[1])

            if(mentionedReactions.length === 0){
                mentionedReactions = defaultGoodKarma
            }

            let scoresQ = await orm.em.createQueryBuilder(Reaction)
                .select('count(0) as count')
                .addSelect('to_user')
                .groupBy(['to_user'])
                .where({ reaction: {$in: mentionedReactions }})
                .orderBy({[`count(0)`]: 'DESC'})

            if(mentionedUsers.length > 1){ // one user is always this bot, because the event is app_mention
                scoresQ = scoresQ.andWhere({ toUser: {$in: mentionedUsers }})
            }else{
                scoresQ = scoresQ.limit(topListLength)
            }

            const scores = await scoresQ.execute()
            if(scores.length === 0){
                await bot.reply(message, 'not enough reactions for users')
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
