import fs from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import { LowestPricesById, TrackedPriceItemsDict, PriceScrapResultById } from "./types";
import Logger from "./Logger";
import { formatDatetime, getEnvVariable } from "./utils";
import parsers from "./parsers";

export default class Store {
    trackedPricesItems: TrackedPriceItemsDict = {};
    resultsFolder: string;
    lowestPricesFilename = 'lowest_prices.json';

    constructor() {
        const resultsFolder = getEnvVariable('RESULTS_FOLDER');
        if (!existsSync(resultsFolder)) mkdirSync(resultsFolder);
        this.resultsFolder = resultsFolder;
    }

    async loadTrackedPriceItems(): Promise<TrackedPriceItemsDict> {
        try {
            const file = await fs.readFile(getEnvVariable('TRACKED_PRICES_JSON'));
            const json = file.toString();
            const jsonData = JSON.parse(json);
            const items: TrackedPriceItemsDict = {};
            
            Object.keys(jsonData).forEach(k => {
                const { name, url, parser } = jsonData[k];

                if (!name || !url || !parser) {
                    throw new Error(`Wrong definition of ${k} tracked item.`);
                }

                if (!parsers[parser]) {
                    throw new Error(`Unknown parser: ${parser}.`);
                }

                items[k] = { name, url, parser };
            });

            this.trackedPricesItems = items;
            return items;
        } catch (e) {
            Logger.getInstance().error('Could not load tracked items file - ' + e);
            return {};
        }
    }

    getTrackedPriceItems(): TrackedPriceItemsDict {
        return this.trackedPricesItems;
    }

    async getLowestPricesFromFile(): Promise<LowestPricesById> {
        try {
            const file = await fs.readFile(`${this.resultsFolder}/${this.lowestPricesFilename}`);

            const json = file.toString();
            const data = JSON.parse(json);
            delete data.LAST_UPDATE;
            return data;

        } catch (e) {
            Logger.getInstance().warn('Could not load lowest prices file - ' + e);
            return {};
        }
    }

    async saveLowestPrices(data: LowestPricesById): Promise<boolean> {
        try {
            const LAST_UPDATE = formatDatetime(new Date());

            await fs.writeFile(
                `${this.resultsFolder}/${this.lowestPricesFilename}`, 
                JSON.stringify({ ...data, LAST_UPDATE })
            );
            return true;
        } catch (e) {
            Logger.getInstance().error('Failed to save lowest prices file - ' + e);
            return false;
        }
    }

    async saveResult(result: PriceScrapResultById): Promise<boolean> {
        const datetime = formatDatetime(new Date(), true);
        const filename = `${this.resultsFolder}/${datetime}.json`;

        try {
            await fs.writeFile(filename, JSON.stringify(result));
            return true;
        } catch (e) {
            Logger.getInstance().error('Failed to save scraping results - ' + e);
            return false;
        }
    }
}
