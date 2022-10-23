export function clamp(val: number, min: number, max: number) {
    if (val < min) return min;
    if (val > max) return max
    return val;
}

export function range(to: number): number[] {
    return [...Array(to).keys()];
}

export function formatDatetime(datetime: Date, fileNameFriendly = false): string {
    const year = datetime.getFullYear();
    const date = (datetime.getDate() + '').padStart(2, '0');
    const month = (datetime.getMonth() + 1 + '').padStart(2, '0');

    const hours = (datetime.getHours() + '').padStart(2, '0')
    const minutes = (datetime.getMinutes() + '').padStart(2, '0');
    const seconds = (datetime.getSeconds() + '').padStart(2, '0');

    return fileNameFriendly 
        ? `${year}_${month}_${date}__${hours}_${minutes}_${seconds}`
        : `${hours}:${minutes}:${seconds} ${date}/${month}/${year}`;
}

export function escapeChars(text: string, charsToEscape: string[]): string {
    let res = text;

    for (const char of charsToEscape) {
        const c = '\\' + char;
        const regex = new RegExp(c, 'g');
        res = res.replace(regex, c);
    }

    return res;
}

export function getEnvVariable(variableName: string): string;
export function getEnvVariable(variableName: string, type: 'number'): number;
export function getEnvVariable(variableName: string, type?: 'string' | 'number') {
    const variable = process.env[variableName]; 
    if (!variable) throw new Error(`Environment variable: ${variableName} is not set.`);

    if (type === 'number') {
        if (isNaN(Number(variable))) throw new Error(`Environment variable: ${variableName} is not a number.`);
        return Number(variable);
    } else {
        return variable;
    }
}

export function wait(timeMs: number): Promise<void> {
    return new Promise(resolve => setTimeout(() => resolve(), timeMs));
}
