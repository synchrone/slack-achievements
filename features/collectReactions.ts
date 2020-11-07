import {Botkit, BotkitMessage, BotWorker} from 'botkit'
import { orm } from '../mikro-orm.config';
import {Reaction} from "../models/reaction";

interface ReactionEvent extends BotkitMessage {
    team: string
    item_user: string
    reaction: string
    event_ts: string // <ts>.<msec> // this event's timestamp
    item: {
        ts: string  // <ts>.<msec> // the chat message this reaction refers to
    }
}

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
