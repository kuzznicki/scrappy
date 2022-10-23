import express from "express";
import { getEnvVariable } from "./utils";
import PricesService from "./PricesService";

export default class Server {
    static async run(pricesService: PricesService) {
        const PORT = getEnvVariable('SERVER_PORT', 'number');
        
        const app = express();
        app.use(express.json());
        await app.listen(PORT);
        console.log('App running on port: ' + PORT);
        
        const check = async () => {
            await pricesService.updatePrices();
    
            const checkInterval = getEnvVariable('CHECK_INTERVAL_MINUTES', 'number') * 60 * 1000;
            setTimeout(check, checkInterval);
        };

        check();
    }
}
