import fs from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import { LowestPricesById, ObservedItemsDict, ScrapResultById } from "./types";
import Logger from "./Logger";
import { formatDatetime, getEnvVariable } from "./utils";
import parsers from "./parsers";

export default class Store {
    observedItems: ObservedItemsDict = {};
    resultsFolder: string;
    lowestPricesFilename = 'lowest_prices.json';

    constructor() {
        const resultsFolder = getEnvVariable('RESULTS_FOLDER');
        if (!existsSync(resultsFolder)) mkdirSync(resultsFolder);
        this.resultsFolder = resultsFolder;
    }

    async loadObservedItems(): Promise<ObservedItemsDict> {
        try {
            const file = await fs.readFile(getEnvVariable('OBSERVED_ITEMS_JSON'));
            const json = file.toString();
            const jsonData = JSON.parse(json);
            const items: ObservedItemsDict = {};
            
            Object.keys(jsonData).forEach(k => {
                const { name, url, parser } = jsonData[k];

                if (!name || !url || !parser) {
                    throw new Error(`Wrong definition of ${k} observed item.`);
                }

                if (!parsers[parser]) {
                    throw new Error(`Unknown parser: ${parser}.`);
                }

                items[k] = { name, url, parser };
            });

            this.observedItems = items;
            return items;
        } catch (e) {
            Logger.getInstance().error('Could not load observed items file - ' + e);
            return {};
        }
    }

    getObservedItems(): ObservedItemsDict {
        return this.observedItems;
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

    async saveResult(result: ScrapResultById): Promise<boolean> {
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
