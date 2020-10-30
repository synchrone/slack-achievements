import {MikroORM} from "@mikro-orm/core/MikroORM";
import {AbstractSqlDriver} from "@mikro-orm/sqlite";
import {SlackAdapter, SlackEventMiddleware, SlackMessageTypeMiddleware} from 'botbuilder-adapter-slack'
import {Botkit} from "botkit"
import {BotkitCMSHelper} from 'botkit-plugin-cms'
import {Installation} from "./models/installation";

// Load process.env values from .env file
require('dotenv').config();

export let orm: MikroORM<AbstractSqlDriver>
MikroORM.init().then(o => orm = o as any)

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

// Once the bot has booted up its internal services, you can use them to do stuff.
controller.ready(() => {
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

controller.webserver.get('/', (req, res) => {
    res.send(`
    This app is running Botkit ${ controller.version }.
    <br />
    <a href="/install">
    <img alt="Add to Slack" height="40" width="139" 
        src="https://platform.slack-edge.com/img/add_to_slack.png" 
        srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" 
    /></a>
    `);
});

controller.webserver.get('/install', (req, res) => {
    // getInstallLink points to slack's oauth endpoint and includes clientId and scopes
    res.redirect(controller.adapter.getInstallLink());
});

controller.webserver.get('/install/auth', async (req, res) => {
    try {
        const results = await controller.adapter.validateOauthCode(req.query.code);
        await orm.em.transactional(async em => {
            await em.nativeDelete(Installation, {teamId:results.team.id})
            await em.persist(new Installation({teamId:results.team.id,
                botAccessToken: results.access_token, botUserId: results.bot_user_id}));
        })

        res.send('Success! Bot installed.');
    } catch (err) {
        console.error('OAUTH ERROR:', err);
        res.status(401);
        res.send(err.message);
    }
});

const teamCache = new Map<string, {botAccessToken:string, botUserId: string}>()
async function getInstallation(teamId: string) {
    let installation = teamCache.get(teamId)
    if (!installation) {
        installation = await orm.em.findOneOrFail(Installation, {teamId: teamId})
        teamCache.set(teamId, installation)
    }
    return installation;
}
