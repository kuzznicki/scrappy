import { escapeChars, formatDatetime, range, clamp, getEnvVariable } from "../utils";

test('clamp()', () => {
    expect(clamp(-2, 0, 10)).toEqual(0);
    expect(clamp(5, 0, 10)).toEqual(5);
    expect(clamp(23, 0, 10)).toEqual(10);
});

test('range()', () => {
    expect(range(4)).toEqual([0, 1, 2, 3])
});

test('escapeChars()', () => {
    const str = 'Some (test) string';
    const res = 'Some \\(test\\) string';
    expect(escapeChars(str, ['(', ')'])).toBe(res);
});

test('formatDatetime()', () => {
    const datetime = new Date('December 17, 1995 03:24:00');
    const res = '03:24:00 17/12/1995';
    const ffRes = '1995_12_17__03_24_00';
    expect(formatDatetime(datetime)).toBe(res);
    expect(formatDatetime(datetime, true)).toBe(ffRes);
});

test('getEnvVariable() - should read string value', () => {
    const [key, value] = ['STRING_VAR', 'SOME_VALUE'];
    process.env[key] = value;
    expect(getEnvVariable(key)).toEqual(value);
});

test('getEnvVariable() - should read number value', () => {
    const [key, value] = ['NUMBER_VAR', -30.12];
    process.env[key] = value + '';
    expect(getEnvVariable(key, 'number')).toEqual(value);
});

test('getEnvVariable() - should throw an error while reading string as number value', () => {
    expect.assertions(1);
    const [key, value] = ['NUMBER_VAR', 'SOME_VALUE'];
    process.env[key] = value + '';

    try {
        getEnvVariable(key, 'number');
    } catch (e) {
        if (!(e instanceof Error)) return;
        expect(e.message).toBe(`Environment variable: ${key} is not a number.`);
    }
});

test('getEnvVariable() - should throw an error while reading undefined value ', () => {
    expect.assertions(1);
    const key = 'FAKE_VARIABLE';

    try {
        getEnvVariable(key);
    } catch (e) {
        if (!(e instanceof Error)) return;
        expect(e.message).toBe(`Environment variable: ${key} is not set.`);
    }
});
