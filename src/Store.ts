import fs from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import Logger from "./Logger";
import { formatDatetime, getEnvVariable } from "./utils";
import { priceParsers, availabilityParsers } from "./parsers";
import { AvailabilityBySite, LowestPricesById, TrackedAvailabilitySites, TrackedPriceItemsDict, PriceScrapResultById, AddTrackedPriceItemPayload } from "./types";

export default class Store {
    trackedPricesItems: TrackedPriceItemsDict = {};
    trackedAvailabilitySites: TrackedAvailabilitySites = {};
    lowestPricesFilename = 'lowest_prices.json';
    availabilityFilename = 'last_availability.json';
    resultsFolder: string;

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
                    throw new Error(`Wrong definition of ${k} tracked price item.`);
                }

                if (!priceParsers[parser]) {
                    throw new Error(`Unknown parser: ${parser}.`);
                }

                items[k] = { name, url, parser };
            });

            this.trackedPricesItems = items;
            return items;
        } catch (e) {
            Logger.getInstance().error('Could not load tracked price items file - ' + e);
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

    async savePriceScrapingResult(result: PriceScrapResultById): Promise<boolean> {
        const datetime = formatDatetime(new Date(), true);
        const filename = `${this.resultsFolder}/prices_${datetime}.json`;

        try {
            await fs.writeFile(filename, JSON.stringify(result));
            return true;
        } catch (e) {
            Logger.getInstance().error('Failed to save scraping results - ' + e);
            return false;
        }
    }

    async addTrackedPriceItem(payload: AddTrackedPriceItemPayload) {
        this.trackedPricesItems[Date.now() + ''] = payload;
        // created
        // created by
        // updated

        try {
            await fs.writeFile(getEnvVariable('TRACKED_PRICES_JSON'), JSON.stringify(this.trackedPricesItems));
            return true;
        } catch (e) {
            Logger.getInstance().error('Failed to update observed items - ' + e);
            return false;
        }
    }

    async loadTrackedAvailabilitySites(): Promise<TrackedAvailabilitySites> {
        try {
            const file = await fs.readFile(getEnvVariable('TRACKED_AVAILABILITY_JSON'));
            const json = file.toString();
            const jsonData = JSON.parse(json);
            const sites: TrackedAvailabilitySites = {};
            
            Object.keys(jsonData).forEach(k => {
                const { name, urlPattern, initialValue, parser } = jsonData[k];

                if (!name || !urlPattern || !initialValue || !parser) {
                    throw new Error(`Wrong definition of ${k} observed availability site.`);
                }

                if (!availabilityParsers[parser]) {
                    throw new Error(`Unknown parser: ${parser}.`);
                }

                sites[k] = { name, urlPattern, initialValue, parser };
            });

            this.trackedAvailabilitySites = sites;
            return sites;
        } catch (e) {
            Logger.getInstance().error('Could not load observed availability sites file - ' + e);
            return {};
        }
    }

    getTrackedAvailabilitySites(): TrackedAvailabilitySites {
        return this.trackedAvailabilitySites;
    }

    async getAvailabilityFromFile(): Promise<AvailabilityBySite>  {
        try {
            const file = await fs.readFile(`${this.resultsFolder}/${this.availabilityFilename}`);
            const json = file.toString();
            const data = JSON.parse(json);
            delete data.LAST_UPDATE;

            const currentlyObserved = Object.keys(this.trackedAvailabilitySites);

            for (const id of Object.keys(data)) {
                if (!currentlyObserved.includes(id)) {
                    delete data[id];
                }
            }

            return data;
        } catch (e) {
            Logger.getInstance().warn('Could not load last availability file - ' + e);
            return {};
        }
    }

    async saveLastAvailability(data: AvailabilityBySite): Promise<boolean> {
        try {
            const LAST_UPDATE = formatDatetime(new Date());
            const fileJson = JSON.stringify({ ...data, LAST_UPDATE });
            await fs.writeFile(`${this.resultsFolder}/${this.availabilityFilename}`, fileJson);
            return true;
        } catch (e) {
            Logger.getInstance().error('Failed to last availability file - ' + e);
            return false;
        }
    }

    async saveAvailabilityScrapingResult(result: AvailabilityBySite): Promise<boolean> {
        const datetime = formatDatetime(new Date(), true);
        const filename = `${this.resultsFolder}/availability_${datetime}.json`;

        try {
            await fs.writeFile(filename, JSON.stringify(result));
            return true;
        } catch (e) {
            Logger.getInstance().error('Failed to save availability scraping results - ' + e);
            return false;
        }
    }
}
