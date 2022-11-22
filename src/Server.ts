import express from "express";
import { getEnvVariable } from "./utils";
import PricesService from "./PricesService";
import AvailabilityService from "./AvailabilityService";
import TelegramBot from "./TelegramBot";

export default class Server {
    static async run(
        pricesService: PricesService, 
        availabilityService: AvailabilityService,
        bot: TelegramBot
    ) {
        const PORT = getEnvVariable('SERVER_PORT', 'number');
        
        const app = express();
        app.use(express.json());
        await app.listen(PORT);
        console.log('App running on port: ' + PORT);
        
        let pricesPromises: Promise<boolean>[] = [];
        let availabilityPromises: Promise<boolean>[] = [];

        const checkPrices: () => void = async () => {
            const pricesQueue = [...pricesPromises];
            const availabilityQueue = [...availabilityPromises];

            pricesPromises.push(new Promise(async resolve => {
                if (pricesQueue.length) await Promise.all(pricesQueue);
                if (availabilityQueue.length) await Promise.all(availabilityQueue);

                await pricesService.updatePrices();
                const checkInterval = getEnvVariable('PRICES_CHECK_INTERVAL_MINUTES', 'number') * 60 * 1000;
                resolve(true);
                setTimeout(checkPrices, checkInterval);
            }));
        };

        const checkAvailability: () => void = async () => {
            const pricesQueue = [...pricesPromises];
            const availabilityQueue = [...availabilityPromises];

            availabilityPromises.push(new Promise(async resolve => {
                if (pricesQueue.length) await Promise.all(pricesQueue);
                if (availabilityQueue.length) await Promise.all(availabilityQueue);

                await availabilityService.updateAvailability();
                const checkInterval = getEnvVariable('AVAILABILITY_CHECK_INTERVAL_MINUTES', 'number') * 60 * 1000;
                resolve(true);
                setTimeout(checkAvailability, checkInterval);
            }));
        };

        checkPrices();
        checkAvailability();

        bot.onScan(() => {
            checkAvailability();
            checkPrices();
        });
    }
}
