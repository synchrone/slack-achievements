import {Botkit} from "botkit";
import _ from 'lodash'
import {orm} from "../mikro-orm.config";
import {Reaction} from "../models/reaction";
import {messagePlainText, reply} from "../util/slackMessaging";

const DAY = 24 * 60 * 60 * 1000;
const WEEK = 7 * DAY;
const MONTH = 4 * WEEK;

export type ReactionSummaryItem = Pick<Reaction, 'toUser' | 'reaction'> & {count:number}
async function getReactionSummary(timeframe: number, minReactions: number, channel?: string): Promise<ReactionSummaryItem[]> {
    let reactionsQuery = orm.em.createQueryBuilder(Reaction)
        .select('count(0) as count')
        .addSelect('to_user')
        .addSelect('reaction')
        .where('created_at > ?', [(+new Date()) - timeframe])
        .groupBy(['to_user', 'reaction'])
        .having('count > ?', [minReactions])

    if(channel){
        reactionsQuery = reactionsQuery.andWhere({channel});
    }

    const reactions = await reactionsQuery.execute()
    return reactions
}
export function reactionLeaders(reactions: ReactionSummaryItem[]){
    const userReactions = _.groupBy(reactions, r => r.toUser)
    const orderedUserReactions = _.mapValues(userReactions, ra => _.reverse(_.sortBy(ra, r => r.count)))
    const leaders = _.reverse(_.sortBy(_.toPairs(orderedUserReactions), ([user, ra]) => _.sumBy(ra, r => r.count)))
    return leaders
}

export function renderLeaderboard(leaders: Array<[string, ReactionSummaryItem[]]>, limit: number = 2900) {
    let leaderboard = ''
    for(const [user, reactions] of leaders){
        let chunk = `\n<@${user}>: ${reactions.map(r => `:${r.reaction}: (${r.count})`).join(', ')}`;

        if(leaderboard.length + chunk.length > limit){
            break;
        }
        leaderboard += chunk
    }

    return leaderboard
}

export default (controller: Botkit) => {
    controller.on('app_mention', async (bot, message) => {
        const plainMessage = messagePlainText(message)

        const reqMonthly = plainMessage.indexOf('monthly') > -1;
        const reqWeekly = plainMessage.indexOf('weekly') > -1;
        if (!(reqMonthly || reqWeekly)) { // not calling this report
            return
        }

        if (plainMessage.indexOf('?') < 0 || plainMessage.indexOf('help') > -1) {
            await bot.reply(message, `Usage: @achievements [global] <monthly|weekly> [minCount=number,1-100] *?*`)
            return
        }

        const channel = plainMessage.indexOf('global') > -1 ? undefined : message.channel
        const timeframe = reqMonthly ? MONTH : WEEK

        let minCount = timeframe == MONTH ? 16 : 4
        try{
            minCount = Math.min(Math.max(parseInt(plainMessage.match(/minCount=(\d+)/i)[1]), 1), 100)
        }catch (e){}

        const header = `*This ${timeframe === MONTH ? 'Month' : 'Week'}'s MVPs ${channel ? `in <#${channel}>` : ''}*\n\n`

        const reactions = await getReactionSummary(timeframe, minCount, channel)
        if (reactions.length < 1) {
            await bot.reply(message, `I'm just gonna observe for a little longer`)
            return
        }

        const leaders = reactionLeaders(reactions)
        const leaderboard = renderLeaderboard(leaders)
        let response = header + leaderboard;
        await reply(bot, message, response);
    })
}
