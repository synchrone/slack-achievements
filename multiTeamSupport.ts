import {Botkit} from "botkit";
import {orm} from "./mikro-orm.config";
import {Installation} from "./models/installation";

const teamCache = new Map<string, Installation>()

export async function getInstallation(teamId: string) {
    let installation = teamCache.get(teamId)
    if (!installation) {
        installation = await orm.em.findOneOrFail(Installation, {teamId: teamId})
        teamCache.set(teamId, installation)
    }
    return installation
}

interface SlackValidationResponse {
    "ok": boolean,
    "access_token": string,
    "token_type": "bot",
    "scope": "commands,incoming-webhook",
    "bot_user_id": string, // "U0KRQLJ9H",
    "app_id": string, //"A0KRD7HC3",
    "team": {
        "name": string, //"Slack Softball Team",
        "id": string //"T9TK3CUKW"
    },
    "enterprise"?: {
        "name": string, //"slack-sports",
        "id": string //"E12345678"
    },
    "authed_user": {
        "id": string, //"U1234",
        "scope"?: string //"chat:write",
        "access_token"?: string // "xoxp-1234",
        "token_type"?: string  // "user"
    }
}

export function setupMultiTeam(controller: Botkit) {
    controller.webserver.get('/', (req, res) => {
        res.send(`
        This app is running Botkit ${controller.version}.
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
            const results = await controller.adapter.validateOauthCode(req.query.code) as SlackValidationResponse
            await orm.em.transactional(async em => {
                await em.nativeDelete(Installation, {teamId: results.team.id})
                let newInstallation = new Installation({
                    teamId: results.team.id,
                    botAccessToken: results.access_token,
                    botUserId: results.bot_user_id,
                    authedUserId: results.authed_user.id
                });

                await em.persist(newInstallation);
                teamCache[newInstallation.teamId] = newInstallation;
            })

            res.send('Success! Bot installed.');
        } catch (err) {
            console.error('OAUTH ERROR:', err);
            res.status(401);
            res.send(err.message);
        }
    });
}
