import {QueryOrder} from "@mikro-orm/core";
import {SlackAdapter, SlackBotWorker} from "botbuilder-adapter-slack";
import {WebClient as SlackApi} from '@slack/web-api'
import {Botkit, BotkitMessage} from "botkit";
import _ from 'lodash'
import {Reaction} from "../models/reaction";
import { orm } from "../mikro-orm.config";

const DAY = 24 * 60 * 60 * 1000;
const WEEK = 7 * DAY;
const MONTH = 4 * WEEK;

function messagePlainText(message: BotkitMessage){
    if(message.text){ return message.text }

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

export function renderLeaderboard(reactions: ReactionSummaryItem[]) {
    const userReactions = _.groupBy(reactions, r => r.toUser)
    const orderedUserReactions = _.mapValues(userReactions, ra => _.reverse(_.sortBy(ra, r => r.count)))
    const leaders = _.reverse(_.sortBy(_.toPairs(orderedUserReactions), ([user, ra]) => _.sumBy(ra, r => r.count)))

    const leaderboard = leaders.map(([user, reactions]) =>
        `<@${user}>: ${reactions.map(r => `:${r.reaction}: (${r.count})`).join(', ')}`
    ).join('\n')

    return leaderboard
}

function slackMarkdownResponse(markdown: string) {
    return {
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": markdown
                }
            }
        ]
    };
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
        const header = `*This ${timeframe === MONTH ? 'Month' : 'Week'}'s MVPs*\n\n`;

        const reactions = await getReactionSummary(timeframe, channel);
        if (reactions.length < 1) {
            await bot.reply(message, `I'm just gonna observe for a little longer`)
            return
        }
        const leaderboard = renderLeaderboard(reactions);

        if (bot instanceof SlackBotWorker) {
            // the trick is to update the message with @-mentions, that will turn IDs into human names
            // but not cause a notification for everyone involved
            const sent = await bot.reply(message, slackMarkdownResponse(header))

            //await bot.updateMessage({...sent, text: slackMarkdownResponse(header+leaderboard)})
            // NOTE: this is a workaround because of an internal slack-adapter await fiasco
            await (bot.api as SlackApi).chat.update({
                ...(bot.getConfig('adapter') as SlackAdapter).activityToSlack(sent),
                ...slackMarkdownResponse(header+leaderboard)
            })
        } else {
            await bot.reply(message, header+leaderboard);
        }
    })
}
