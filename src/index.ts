import "dotenv/config";
import PricesService from "./PricesService.js";
import AvailabilityService from "./AvailabilityService.js";
import Scraper from "./Scraper.js";

import Server from "./Server.js";
import Store from "./Store";
import TelegramBot from './TelegramBot';

(async () => {
    const store = new Store();
    await store.loadTrackedPriceItems();

    const bot = new TelegramBot();
    bot.launch();

    const scraper = new Scraper();

    const pricesService = new PricesService(store, scraper, bot);
    const availabilityService = new AvailabilityService(store, scraper, bot);

    Server.run(pricesService, availabilityService);
})();
