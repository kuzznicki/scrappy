import Logger from "./Logger";
import { priceParsers } from "./parsers";
import Scraper from "./Scraper";
import Store from "./Store";
import TelegramBot from "./TelegramBot";
import { isNewPriceUpdate, LowestPricesById, TrackedPriceItemsDict, PriceUpdate, PriceScrapResultById } from "./types";
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

        bot.onItemAdded(payload => store.addTrackedPriceItem(payload));
    }

    async updatePrices() {
        const { store, bot, logger } = this;

        const items = await store.loadTrackedPriceItems();
        const scrappedData = await this.scrapPrices(items);
        store.savePriceScrapingResult(scrappedData);

        const previousLowest = await store.getLowestPricesFromFile();
        const scrappedLowest = this.scrappedDataToLowestPrices(scrappedData);
        const currentLowest = { ...previousLowest, ...scrappedLowest };
        store.saveLowestPrices(currentLowest);

        const updates = this.getUpdates(previousLowest, currentLowest);
        if (!updates.length) {
            logger.info('Nothing changed.');
            return;
        }

        this.logPriceUpdates(updates);
        bot.sendMessage(this.generateBotUpdateMessage(items, updates));
    }

    private async scrapPrices(items: TrackedPriceItemsDict): Promise<PriceScrapResultById> {
        const { scraper, logger } = this; 

        const requestInterval = getEnvVariable('REQUEST_INTERVAL_SECONDS', 'number') * 1000;
        const scrappedData: PriceScrapResultById = {};
        
        const itemsLen = Object.keys(items).length;
        logger.info(`Scrapping ${itemsLen} items...`);
        const updateBar = logger.printProgressBar(0, itemsLen);

        for (const [id, { url, parser }] of Object.entries(items)) {
            updateBar(1);

            const [error, res] = await scraper.getPrice(url, priceParsers[parser]);
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

    private scrappedDataToLowestPrices(scrappedData: PriceScrapResultById): LowestPricesById {
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
                return;
            }
            
            const diff = (u.currentPrice - u.previousPrice).toFixed(2);
            if (u.currentPrice < u.previousPrice) {
                logger.success(`[${diff}] ${u.previousPrice} -> ${u.currentPrice} (${u.id})`);
            } else if (u.currentPrice > u.previousPrice) {
                logger.failure(`[${diff}] ${u.previousPrice} -> ${u.currentPrice} (${u.id})`);
            }
        });
    }

    private generateBotUpdateMessage(items: TrackedPriceItemsDict, updates: PriceUpdate[]): string {
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
                firstUpdateStrings.push(bot.escape(` ??? ??? added price (${u.currentPrice}) for `) + url);
                return;
            }
            
            const diff = (u.currentPrice - u.previousPrice).toFixed(2);
            if (u.currentPrice < u.previousPrice) {
                discountStrings.push(bot.escape(` ??? ???? [${diff}] ${u.previousPrice} -> ${u.currentPrice} for `) + url);
            } else if (u.currentPrice > u.previousPrice) {
                priceUpStrings.push(bot.escape(` ??? ???? [${diff}] ${u.previousPrice} -> ${u.currentPrice} for `) + url);
            }
        });

        return header + [...discountStrings, ...firstUpdateStrings, ...priceUpStrings].join('\n\n');
    }
}
