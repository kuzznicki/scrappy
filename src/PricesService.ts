import Logger from "./Logger";
import parsers from "./parsers";
import Scraper from "./Scraper";
import Store from "./Store";
import TelegramBot from "./TelegramBot";
import { isNewPriceUpdate, LowestPricesById, ObservedItemsDict, PriceUpdate, ScrapResultById } from "./types";
import { getEnvVariable, wait } from "./utils";

export default class PricesService {
    private store;
    private scraper;
    private bot;
    private logger;

    constructor(store: Store, scraper: Scraper, bot: TelegramBot) {
        this.store = store;
        this.scraper = scraper;
        this.bot = bot;
        this.logger = Logger.getInstance();
    }

    async updatePrices() {
        const { store, bot } = this;

        const items = store.getObservedItems();
        const scrappedData = await this.scrapPrices(items);
        store.saveResult(scrappedData);

        const previousLowest = await store.getLowestPricesFromFile();
        const scrappedLowest = this.scrappedDataToLowestPrices(scrappedData);
        const currentLowest = { ...previousLowest, ...scrappedLowest };
        store.saveLowestPrices(currentLowest);

        const updates = this.getUpdates(previousLowest, currentLowest);
        if (!updates.length) return;

        this.logPriceUpdates(updates);
        bot.sendMessage(this.generateBotUpdateMessage(items, updates));
    }

    private async scrapPrices(items: ObservedItemsDict): Promise<ScrapResultById> {
        const { scraper, logger } = this; 

        const requestInterval = getEnvVariable('REQUEST_INTERVAL_SECONDS', 'number') * 1000;
        const scrappedData: ScrapResultById = {};
        
        const itemsLen = Object.keys(items).length;
        logger.info(`Scrapping ${itemsLen} items...`);
        const updateBar = logger.printProgressBar(0, itemsLen);

        for (const [id, { url, parser }] of Object.entries(items)) {
            updateBar(1);

            const [error, res] = await scraper.get(url, parsers[parser]);
            if (error) {
                logger.error(`Failed to scrap data for: ${id} - Error: ${error.message}`);
                continue;
            }

            scrappedData[id] = res;
            await wait(requestInterval);
        }

        logger.info('Complete!');
        return scrappedData;
    }

    private scrappedDataToLowestPrices(scrappedData: ScrapResultById): LowestPricesById {
        const scrappedLowestPrices: LowestPricesById = {};
        
        for (const [id, data] of Object.entries(scrappedData)) {
            if (!data.length) continue;
            scrappedLowestPrices[id] = Math.min(...data.map(r => r.price));
        }

        return scrappedLowestPrices;
    }

    private getUpdates(previousLowest: LowestPricesById, currentLowest: LowestPricesById): PriceUpdate[] {
        const updates: PriceUpdate[] = [];

        for (const [id, currentPrice] of Object.entries(currentLowest)) {
            if (!previousLowest.hasOwnProperty(id)) {
                updates.push({ id, type: 'new', currentPrice });

            } else if (previousLowest[id] !== currentPrice) {
                const previousPrice = previousLowest[id];
                updates.push({ id, type: 'updated', previousPrice, currentPrice });
            }
        }

        return updates;
    }

    private logPriceUpdates(updates: PriceUpdate[]): void {
        const len = updates.length;
        const logger = this.logger; 
        logger.success(`Price changed for ${len} ${len > 1 ? 'items' : 'item'}`);

        updates.forEach(u => {
            if (isNewPriceUpdate(u)) {
                logger.important(` + ${u.currentPrice} (${u.id})`);

            } else if (u.currentPrice < u.previousPrice) {
                logger.success(`${u.previousPrice} -> ${u.currentPrice} (${u.id})`);

            } else if (u.currentPrice > u.previousPrice) {
                logger.failure(`${u.currentPrice} <- ${u.previousPrice} (${u.id})`);
            }
        });
    }

    private generateBotUpdateMessage(items: ObservedItemsDict, updates: PriceUpdate[]): string {
        const bot = this.bot;
        const len = updates.length;
        
        const header = `Price changed for ${len} ${len > 1 ? 'items' : 'item'}:\n\n`;
        const discountStrings: string[] = [];
        const firstUpdateStrings: string[] = [];
        const priceUpStrings: string[] = [];

        const updateToEscapedUrl = (u: PriceUpdate): string => {
            const itemName = bot.escape(items[u.id].name || u.id); 
            const itemUrl = bot.escapeUrl(items[u.id].url || '#'); 
            return `[${itemName}](${itemUrl})`;;
        };

        updates.forEach(u => {
            const url = updateToEscapedUrl(u);

            if (isNewPriceUpdate(u)) {
                firstUpdateStrings.push(bot.escape(` • ⭐ added price (${u.currentPrice}) for `) + url);
            } else if (u.currentPrice < u.previousPrice) {
                discountStrings.push(bot.escape(` • 💚 ${u.previousPrice} -> ${u.currentPrice} for `) + url);
            } else if (u.currentPrice > u.previousPrice) {
                priceUpStrings.push(bot.escape(` • 💔 ${u.currentPrice} <- ${u.previousPrice} for `) + url);
            }
        });

        return header + 
            discountStrings.join('\n\n') + 
            firstUpdateStrings.join('\n\n') + 
            priceUpStrings.join('\n\n');
    }
}
