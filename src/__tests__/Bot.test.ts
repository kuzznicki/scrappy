import TelegramBot from "../TelegramBot";

let telegramBot: TelegramBot;
let launchMock: jest.Mock;
let sendMessageMock: jest.Mock;

beforeEach(() => {
    telegramBot = new TelegramBot();
    launchMock = telegramBot.bot.start = jest.fn();
    sendMessageMock = telegramBot.bot.api.sendMessage = jest.fn();
})

test('Should escape a text', () => {
    const str = "[~Test~] #...= (<+-string*>) # `{escape!}||";
    const res = "\\[\\~Test\\~\\] \\#\\.\\.\\.\\= \\(<\\+\\-string\\*\\>\\) \\# \\`\\{escape\\!\\}\\|\\|";
    expect(telegramBot.escape(str)).toBe(res);
})

test('Should escape a URL', () => {
    const str = "https://example.com/resources/filenameTo\\Escape(2).txt";
    const res = "https://example.com/resources/filenameTo\\\\Escape(2\\).txt";
    expect(telegramBot.escapeUrl(str)).toBe(res);
})

test('Should throw error if sending message before calling launch()', async () => {
    expect.assertions(1);
    try {
        await telegramBot.sendMessage('test');
    } catch (e) {
        if (!(e instanceof Error)) return;
        expect(e.message).toBe('Can not send a message before launch');
    }
})

test('Should send a message', async () => {
    await telegramBot.launch();
    await telegramBot.sendMessage('test');
    expect(sendMessageMock).toBeCalledTimes(1);
})
