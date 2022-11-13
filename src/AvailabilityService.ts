import Logger from "./Logger";
import { availabilityParsers } from "./parsers";
import Scraper from "./Scraper";
import Store from "./Store";
import TelegramBot from "./TelegramBot";
import { AvailabilityById, AvailabilityBySite, AvailabilityUpdates, TrackedAvailabilitySites } from "./types";
import { getEnvVariable, splitMessage, wait } from "./utils";

export default class AvailabilityService {
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

    async updateAvailability() {
        const { store, bot, logger } = this;

        const sites = await store.loadTrackedAvailabilitySites();
        const currentAvailability = await this.scrapAvailability(sites);
        const previousAvailability = await store.getAvailabilityFromFile();

        for (const siteId of Object.keys(sites)) {
            const previousAvailabilityBySite = previousAvailability[siteId] || {};
            const currentAvailabilityBySite = currentAvailability[siteId] || {};
            const updates = this.getUpdates(previousAvailabilityBySite, currentAvailabilityBySite);
            
            if (!updates.availableIds.length && !updates.notAvailableIds.length) {
                logger.info('Nothing changed.')
                break;
            }
    
            const siteName = sites[siteId].name;
            this.logAvailabilityUpdates(siteName, updates);

            // using itemsInfo variable to get name and url for available and not available items
            const itemsInfo: AvailabilityById = { ...previousAvailability[siteId], ...currentAvailability[siteId] };
            const messages = this.generateBotUpdateMessages(siteName, itemsInfo, updates)
            
            this.sendBotMessages(messages);
        }

        store.saveAvailabilityScrapingResult(currentAvailability);
        store.saveLastAvailability(currentAvailability); // todo: should be done in one call
    }

    private async scrapAvailability(sites: TrackedAvailabilitySites): Promise<AvailabilityBySite> {
        const { scraper, logger } = this; 

        const requestInterval = getEnvVariable('REQUEST_INTERVAL_SECONDS', 'number') * 1000;
        const availability: AvailabilityBySite = {};
        
        const sitesLen = Object.keys(sites).length;
        logger.info(`Scrapping ${sitesLen} sites...`);
        const updateBar = logger.printProgressBar(0, sitesLen);

        for (const [siteId, siteDef] of Object.entries(sites)) {
            updateBar(1);
            const { urlPattern, initialValue, parser, name } = siteDef;

            const PAGE_NUMBER_PATTERN = '{{PAGE_NUMBER}}';
            let pageVal: number = isNaN(Number(initialValue)) ? 0 : Number(initialValue);
            let nextPageAvailable = false;

            do {
                let url: string = urlPattern.replace(PAGE_NUMBER_PATTERN, pageVal.toString());

                const [error, res, thereIsNextPage] = await scraper.getAvailability(url, availabilityParsers[parser]);
                if (error) {
                    logger.error(`Failed to scrap availability for: ${siteId} - Error: ${error.message}`);
                    continue;
                }
                
                availability[siteId] = {  ...(availability[siteId] || {}), ...res };
                
                nextPageAvailable = thereIsNextPage;
                if (nextPageAvailable) pageVal++;
                
                await wait(requestInterval);

            } while (nextPageAvailable);
        }

        logger.info('Complete!');
        return availability;
    }

    private getUpdates(previous: AvailabilityById, current: AvailabilityById): AvailabilityUpdates {
        const updates: AvailabilityUpdates = { availableIds: [], notAvailableIds: [] };

        for (const id of Object.keys(current)) {
            if (current[id].available && (!previous.hasOwnProperty(id) || !previous[id].available)) {
                updates.availableIds.push(id);
            } else if (!current[id].available && previous[id]?.available) {
                updates.notAvailableIds.push(id);
            }
        }

        for (const id of Object.keys(previous)) {
            if (previous[id].available && !current.hasOwnProperty(id)) {
                updates.notAvailableIds.push(id);
            }
        }

        return updates;
    }

    private logAvailabilityUpdates(siteName: string, updates: AvailabilityUpdates): void {
        const len = updates.availableIds.length + updates.notAvailableIds.length;
        const header = `${siteName} - Availability changed for ${len} ${len > 1 ? 'items' : 'item'}:`;

        const availableString = updates.availableIds.map(id => ' - ' + id).join('\n');
        const notAvailableString = updates.notAvailableIds.map(id => ' - ' + id).join('\n');

        this.logger.info(header);
        if (availableString) this.logger.success('Available:\n' + availableString + '\n');
        if (notAvailableString) this.logger.failure('Not available:\n' + notAvailableString + '\n');
    }

    private generateBotUpdateMessages(siteName: string, items: AvailabilityById, updates: AvailabilityUpdates): string[] {
        const { bot } = this;
        const CHARS_LIMIT = 4096;

        const len = updates.availableIds.length + updates.notAvailableIds.length;
        const header = bot.escape(`${siteName} - Availability changed for ${len} ${len > 1 ? 'items' : 'item'}:\n\n`);

        const getEscapedInlineUrl = (name: string, url: string): string => {
            const itemName = bot.escape(name); 
            const itemUrl = bot.escapeUrl(url); 
            return `[${itemName}](${itemUrl})`;;
        };

        const availableStringParts = updates.availableIds.map(id => {
            return ` • 💚 ${getEscapedInlineUrl(items[id].name, items[id].url || '#')}\n`;
        });

        const notAvailableStringParts = updates.notAvailableIds.map(id => {
            return ` • 💔 ${getEscapedInlineUrl(items[id].name, items[id].url || '#')}\n`;
        });

        const messageParts = [header];
        if (availableStringParts.length) messageParts.push('*Now available:*\n', ...availableStringParts);
        if (notAvailableStringParts.length) messageParts.push('*Not available anymore:*\n', ...notAvailableStringParts);

        return splitMessage(messageParts, CHARS_LIMIT);
    }

    async sendBotMessages(messages: string[]): Promise<void> {
        for (const msg of messages) {
            await this.bot.sendMessage(msg);
            await wait(2000);
        }
    }
}
