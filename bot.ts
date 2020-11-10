import {SlackAdapter, SlackEventMiddleware, SlackMessageTypeMiddleware} from 'botbuilder-adapter-slack'
import {Botkit} from "botkit"
import {BotkitCMSHelper} from 'botkit-plugin-cms'
import {startORM} from "./mikro-orm.config";
import {getInstallation, setupMultiTeam} from "./multiTeamSupport";

// Load process.env values from .env file
require('dotenv').config();

const adapter = new SlackAdapter({
    // parameters used to secure webhook endpoint
    verificationToken: process.env.VERIFICATION_TOKEN,

    // credentials used to set up oauth for multi-team apps
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    clientSigningSecret: process.env.CLIENT_SIGNING_SECRET,
    scopes: ['app_mentions:read','reactions:read','chat:write'],
    redirectUri: process.env.REDIRECT_URI,
    oauthVersion: 'v2',

    // functions required for retrieving team-specific info
    // for use in multi-team apps
    getTokenForTeam: async teamId => (await getInstallation(teamId)).botAccessToken,
    getBotUserByTeam: async teamId => (await getInstallation(teamId)).botUserId,
});

// Use SlackEventMiddleware to emit events that match their original Slack event types.
adapter.use(new SlackEventMiddleware());

// Use SlackMessageType middleware to further classify messages as direct_message, direct_mention, or mention
adapter.use(new SlackMessageTypeMiddleware());

const controller = new Botkit({
    webhook_uri: '/api/messages',
    adapter: adapter
});

if (process.env.CMS_URI) {
    controller.usePlugin(new BotkitCMSHelper({
        uri: process.env.CMS_URI,
        token: process.env.CMS_TOKEN ?? '',
    }));
}

setupMultiTeam(controller);

// Once the bot has booted up its internal services, you can use them to do stuff.
controller.ready(async () => {
    await startORM();

    // load traditional developer-created local custom feature modules
    controller.loadModules(__dirname + '/features');

    /* catch-all that uses the CMS to trigger dialogs */
    if (controller.plugins.cms) {
        controller.on('message,direct_message', async (bot, message) => {
            let results = false;
            results = await controller.plugins.cms.testTrigger(bot, message);

            if (results !== false) {
                // do not continue middleware!
                return false;
            }
        });
    }
});
