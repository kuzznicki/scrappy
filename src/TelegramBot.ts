import "dotenv/config";

import { Bot, Context } from "grammy";
import { Message } from "@grammyjs/types";
import { escapeChars, getEnvVariable, isValidHttpUrl } from "./utils";
import { priceParsers } from "./parsers";
import { AddTrackedPriceItemPayload, isTrackedPriceItemPayload } from "./types";

type CommandFlowStep = {
    key: string,
    validation?: (input: string) => boolean
    messages?: { info?: string, error?: string } 
};

type MessageHandler = (ctx: Context, msg: string) => void

export default class TelegramBot {
    bot = new Bot(getEnvVariable('BOT_TOKEN'));
    chatId = getEnvVariable('CHAT_ID');
    launched = false;
    onMessageById: { [userId: string]: null | MessageHandler } = {};

    commandListeners: { 
        add: ((payload: AddTrackedPriceItemPayload) => void)[]
        scan: (() => void)[]
    } = { add: [], scan: [] };
    commands = [
        { command: 'help', handler: (ctx: Context) => void this.sendHelpMessage(ctx), description: 'Show help text' },
        { command: 'add', handler: (ctx: Context) => void this.handleAddCommand(ctx), description: 'Add new item to the watch list' },
        { command: 'list', handler: (ctx: Context) => void this.sendListMessage(ctx), description: 'Show watch list items' },
        { command: 'scan', handler: (ctx: Context) => void this.handleScan(ctx), description: 'Performs prices & availability scans (takes few minutes)' },
        { command: 'cancel', handler: (ctx: Context) => void this.cancelOperation(ctx), description: 'Cancels adding item to the watch list' },
    ];

    async launch(): Promise<void> {
        for (const cmd of this.commands) {
            this.bot.command(cmd.command, cmd.handler);
        }

        this.bot.on('message:text', ctx => {
            const userId = this.getUserIdFromContext(ctx);
            const msgHandler = this.onMessageById[userId];

            if (typeof msgHandler === 'function') {
                const message = this.getMessageFromContext(ctx);
                msgHandler(ctx, message);
            } else {
                ctx.reply('Use /help to see available commands');
            }
        });

        this.bot.start();
        await this.bot.api.setMyCommands(this.commands);
        this.launched = true;
    }

    escape(text: string): string {
        return escapeChars(text, [
            '_', '*', '[', ']', '(', ')', '~', '`', '>', 
            '#', '+', '-', '=', '|', '{', '}', '.', '!'
        ]);
    }

    escapeUrl(text: string): string {
        return escapeChars(text, ['\\', ')']);
    }

    async sendMessage(text: string): Promise<Message.TextMessage> {
        const { bot, chatId, launched } = this;

        if (!launched) throw new Error('Can not send a message before launch');

        return bot.api.sendMessage(chatId, text, { 
            parse_mode: "MarkdownV2", 
            disable_web_page_preview: true
        });
    }

    sendHelpMessage(context: Context) {
        const helpText = 'Available commands:\n' 
            + this.commands.map(cmd => ' • /' + cmd.command + ' - ' + cmd.description).join('\n');
        
        context.reply(helpText);
    }

    sendListMessage(context: Context) {
        context.reply('Not implemented yet');
    }

    cancelOperation(context: Context) {
        const userId = this.getUserIdFromContext(context);
        this.onMessageById[userId] = null;
    }

    getMessageFromContext(context: Context): string {
        if (!context.message || (typeof context.message.text === 'undefined')) {
            return '';
        }

        return context.message.text;
    }

    getUserIdFromContext(context: Context) {
        const userId = context.update.message?.from?.id;
        if (!userId) throw new Error('no user id in context');
        return userId;
    } 

    async simpleCommandFlow(context: Context, steps: CommandFlowStep[]): Promise<[Record<string, string>, Context]> {
        const bot = this;

        let payload: Record<string, string> = {};
        let c = context;

        const userId = this.getUserIdFromContext(context);

        for (const step of steps) {
            c = await new Promise(resolve => {
                c.reply(
                    bot.escape(step?.messages?.info || `Enter ${step.key}:`),
                    { parse_mode: 'MarkdownV2', disable_web_page_preview: true }
                );
                
                bot.onMessageById[userId] = (ctx, msg) => {
                    if (step.validation && !step.validation(msg)) {
                        ctx.reply(
                            bot.escape(step?.messages?.error || `Invalid ${step.key} value. Try again:`),
                            { parse_mode: 'MarkdownV2', disable_web_page_preview: true }
                        );
                    } else {
                        payload[step.key] = msg;
                        resolve(ctx);
                    }
                };
            });
        }

        return [payload, c];
    }

    async handleAddCommand(context: Context): Promise<void> {
        const PROVIDE_URL_MESSAGE = 'Please provide URL to the item you want to add to the watch list, or cancel operation with /cancel command.';
        const URL_INVALID_MESSAGE = 'URL seems to be invalid. Please provide valid URL.';
        const PROVIDE_ITEM_NAME_MESSAGE = 'Please provide item name:';
        const PROVIDE_PARSER_MESSAGE = 'Please provide which parser should be used to get data from the site.';
        const PARSER_INVALID_MESSAGE = 'There is no such parser.';
        const parsersString = 'Available price parsers: \n • ' + Object.keys(priceParsers).join('\n • ');

        const [payload, ctx] = await this.simpleCommandFlow(context, [
            {
                key: 'url',
                validation: (input: string) => isValidHttpUrl(input),
                messages: {
                    info: PROVIDE_URL_MESSAGE,
                    error: URL_INVALID_MESSAGE
                }
            }, {
                key: 'name',
                messages: {
                    info: PROVIDE_ITEM_NAME_MESSAGE
                }
            }, {
                key: 'parser',
                validation: (input: string) => priceParsers.hasOwnProperty(input),
                messages: {
                    info: PROVIDE_PARSER_MESSAGE + ' ' + parsersString,
                    error: PARSER_INVALID_MESSAGE + ' ' + parsersString
                }
            }
        ]);

        if (isTrackedPriceItemPayload(payload)) {
            this.commandListeners.add.forEach(fn => fn(payload));
            ctx.reply(
                `*${this.escape(payload.name)}*\n` +
                `available under ${this.escape(payload.url)}\n` +
                `has been added to the watch list \n` +
                `and will be scrapped with *${this.escape(payload.parser)}* parser\\.`,
                { parse_mode: "MarkdownV2", disable_web_page_preview: true }
            );
        } else {
            ctx.reply('Something went wrong...');
        }
    }

    private handleScan(context: Context) {
        this.commandListeners.scan.forEach(fn => fn());
        context.reply('Performing prices & availability scans. This should take few minutes.');
    }

    onItemAdded(fn: (payload: AddTrackedPriceItemPayload) => void) {
        this.commandListeners.add = (this.commandListeners.add || []);
        this.commandListeners.add.push(fn);
    }

    onScan(fn: () => void) {
        this.commandListeners.scan = (this.commandListeners.scan || []);
        this.commandListeners.scan.push(fn);
    }
}
