import {Botkit} from "botkit";
import {getInstallation} from "../multiTeamSupport";
import {modifySettings} from "../util/settings";
import {messagePlainText, SlackDirectMessage} from "../util/slackMessaging";

export default (controller: Botkit) => {
    controller.on('direct_message', async (bot, message) => {
        const event = message as SlackDirectMessage
        if((await getInstallation(event.team))?.authedUserId == event.user) {
            const command = messagePlainText(message)

            if(command.indexOf('set-output-channel')>-1){
                const channel = command.match(/<#(.+)\|/)[1]
                if(!channel){
                    await bot.reply(message, `cannot parse channel name`)
                    return;
                }

                await modifySettings(event.team,
                        s => s.set('outputChannel', channel))

                await bot.reply(message, `output channel set to <!#${channel}>`)
                return;
            }

            await bot.reply(message, 'unknown command')
        }
    })
}