import { yellow, red, green, bgRed, white, cyan } from "colors/safe";
import { clamp, formatDatetime } from "./utils";

const separator = ' | ';

export default class Logger {
    private static instance: Logger;
    static barEmptyBlock = '░';
    static barFilledBlock = '█';
    static barSegmentsCnt = 50;

    private lastLogType: 'log' | 'bar' = 'log';

    private constructor() { }

    static getInstance() {
        if (!Logger.instance) Logger.instance = new Logger();
        return Logger.instance;
    }

    private log(
        message: string, 
        consoleFn: (message: any) => void, 
        formatFns: ((message: any) => string)[] = []
    ): void {
        let str = message + separator + formatDatetime(new Date());
        formatFns.forEach(fn => str = fn(str));
        
        if (this.lastLogType === 'bar') this.clearProgressBar();
        
        consoleFn(str);
        this.lastLogType = 'log';
    }

    info(message: string): void { 
        this.log(message, console.log);
    }

    important(message: string): void {
        this.log(message, console.log, [cyan]);
    }
    
    success(message: string): void {
        this.log(message, console.log, [green]);
    }
    
    failure(message: string): void {
        this.log(message, console.error, [red]);
    }

    error(message: string): void {
        this.log(message, console.error, [bgRed, white]);
    }

    warn(message: string): void {
        this.log(message, console.warn, [yellow]);
    }

    printProgressBar(initial: number, total: number): (i: number) => boolean {
        const { barSegmentsCnt, barEmptyBlock: empty, barFilledBlock: filled } = Logger;
        let current = 0;

        const update = (increment: number) => {
            current = clamp(current + increment, 0, total);
            const filledCnt = Math.floor(current / total * barSegmentsCnt);
            process.stdout.write(
                (this.lastLogType === 'bar' ? '\r' : '\n')
                + filled.repeat(filledCnt) 
                + empty.repeat(barSegmentsCnt - filledCnt)
            );
            this.lastLogType = 'bar';
            return current === total;
        };

        update(initial);
        return update;
    }

    clearProgressBar() {
        process.stdout.write('\r' + ' '.repeat(Logger.barSegmentsCnt) + '\r');
    }
}
