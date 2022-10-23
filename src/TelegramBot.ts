import "dotenv/config";

import { Bot } from "grammy";
import { Message } from "@grammyjs/types";
import { escapeChars, getEnvVariable } from "./utils";

export default class TelegramBot {
    bot = new Bot(getEnvVariable('BOT_TOKEN'));
    chatId = getEnvVariable('CHAT_ID');
    launched = false;

    launch(): void {
        // this.bot.start();
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
}
