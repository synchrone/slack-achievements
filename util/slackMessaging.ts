import {Botkit, BotkitMessage} from "botkit";

export interface SlackDirectMessage extends BotkitMessage {
    team: string
}

export interface SlackPostedMessage {
    id: string // <ts>.<msec>
    activityId: string // same
    conversation: {
        id: string
    }
}

export function messagePlainText(message: BotkitMessage) {
    if (typeof message.text === 'string') {
        return message.text
    }

    if (message.blocks) {
        return message.blocks.map(b => blockToPlain(b)).join(' ')
    }
}

function blockToPlain(block: any): string {
    if (block.elements) {
        return block.elements.map(e => blockToPlain(e).trim()).join(' ')
    }
    if (block.type == 'user') {
        return `<@${block.user_id}>`
    }
    if (block.type == 'text') {
        return block.text
    }
    return `{${block.type}}`
}

export function slackMarkdownResponse(markdown: string) {
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
