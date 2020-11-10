import {SlackBotWorker} from "botbuilder-adapter-slack";
import {Botkit} from "botkit";
import _ from 'lodash'
import {orm} from "../mikro-orm.config";
import {Reaction} from "../models/reaction";
import {getSettings} from "../util/settings";
import {messagePlainText, slackMarkdownResponse, SlackPostedMessage} from "../util/slackMessaging";

const DAY = 24 * 60 * 60 * 1000;
const WEEK = 7 * DAY;
const MONTH = 4 * WEEK;

type ReactionSummaryItem = Pick<Reaction, 'toUser' | 'reaction'> & {count:number}
async function getReactionSummary(timeframe: number, channel?: string): Promise<ReactionSummaryItem[]> {
    let reactionsQuery = orm.em.createQueryBuilder(Reaction)
        .select('count(0) as count')
        .addSelect('to_user')
        .addSelect('reaction')
        .where('created_at > ?', [(+new Date()) - timeframe])
        .groupBy(['to_user', 'reaction'])
        .having('count > 1')

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

export function renderLeaderboard(leaders: Array<[string, ReactionSummaryItem[]]>, limit?: number) {
    const leaderboard = leaders.map(([user, reactions]) =>
        `<@${user}>: ${reactions.map(r => `:${r.reaction}: (${r.count})`).join(', ')}`
    ).join('\n')

    return leaderboard
}

export default (controller: Botkit) => {
    controller.on('app_mention', async (bot, message) => {
        const plainMessage = messagePlainText(message)
        if (plainMessage.indexOf('?') < 0 || plainMessage.indexOf('help') > -1) {
            await bot.reply(message, `Usage: @achievements [global] <monthly|weekly> *?*`)
            return
        }

        const channel = plainMessage.indexOf('global') > -1 ? undefined : message.channel;
        const timeframe = plainMessage.indexOf('monthly') > -1 ? MONTH : WEEK;
        const header = `*This ${timeframe === MONTH ? 'Month' : 'Week'}'s MVPs ${channel ? `in <#${channel}>` : ''}*\n\n`;

        const reactions = await getReactionSummary(timeframe, channel);
        if (reactions.length < 1) {
            await bot.reply(message, `I'm just gonna observe for a little longer`)
            return
        }

        const leaders = reactionLeaders(reactions)
        const leaderboard = renderLeaderboard(leaders)
        let response = header + leaderboard;

        if (bot instanceof SlackBotWorker) {
            const outputChannel = (await getSettings(message.team)).get('outputChannel');
            if (outputChannel && outputChannel !== message.channel) {
                const posted = await bot.say({channel: outputChannel, ...slackMarkdownResponse(response)}) as SlackPostedMessage
                await bot.replyInThread(message, `<https://app.slack.com/client/${message.team}/${outputChannel}/${posted.id}|Replied> in <#${outputChannel}>`)
            } else {
                await bot.replyInThread(message, response)
            }
        } else {
            await bot.reply(message, response);
        }
    })
}
