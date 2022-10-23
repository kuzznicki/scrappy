import Logger from "../Logger";
import { endOfLogRegex } from "./helpers";

const testString = 'test string';

test('info()', () => {
    console.log = jest.fn();

    Logger.getInstance().info(testString)

    expect(console.log).toBeCalledTimes(1);
    expect(console.log).toBeCalledWith(expect.stringMatching(
        new RegExp(testString + endOfLogRegex, 'g')
    ));
});

test('success()', () => {
    console.log = jest.fn();

    Logger.getInstance().success(testString);

    expect(console.log).toBeCalledTimes(1);
    expect(console.log).toBeCalledWith(expect.stringMatching(
        new RegExp(testString + endOfLogRegex, 'g')
    ));
});

test('failure()', () => {
    console.error = jest.fn();

    Logger.getInstance().failure(testString);

    expect(console.error).toBeCalledTimes(1);
    expect(console.error).toBeCalledWith(expect.stringMatching(
        new RegExp(testString + endOfLogRegex, 'g')
    ));
});

test('warn()', () => {
    console.warn = jest.fn();
    Logger.getInstance().warn(testString);

    expect(console.warn).toBeCalledTimes(1);
    expect(console.warn).toBeCalledWith(expect.stringMatching(
        new RegExp(testString + endOfLogRegex, 'g')
    ));
});

test('error()', () => {
    console.error = jest.fn();
    Logger.getInstance().error(testString);

    expect(console.error).toBeCalledTimes(1);
    expect(console.error).toBeCalledWith(expect.stringMatching(
        new RegExp(testString + endOfLogRegex, 'g')
    ));
});

test('printProgressBar()', () => {
    const stdoutWriteMock = process.stdout.write = jest.fn();
    let calls = 0;
    const segments = Logger.barSegmentsCnt;
    const empty = Logger.barEmptyBlock;
    const filled = Logger.barFilledBlock;
    const total = 10;

    const update = Logger.getInstance().printProgressBar(0, total);
    expect(stdoutWriteMock).toBeCalledTimes(++calls);
    expect(stdoutWriteMock).lastCalledWith('\n' + empty.repeat(segments));

    update(-2 * total);
    expect(stdoutWriteMock).toBeCalledTimes(++calls);
    expect(stdoutWriteMock).lastCalledWith('\r' + empty.repeat(segments));

    update(3);
    const filledCnt = Math.floor(3 / total * segments);
    expect(stdoutWriteMock).toBeCalledTimes(++calls);
    expect(stdoutWriteMock).lastCalledWith('\r' + filled.repeat(filledCnt) + empty.repeat(segments - filledCnt));

    update(total);
    expect(stdoutWriteMock).toBeCalledTimes(++calls);
    expect(stdoutWriteMock).lastCalledWith('\r' + filled.repeat(segments));
});
