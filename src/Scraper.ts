import axios from "axios";
import { PriceScrapResult, AvailabilityById } from "./types";

export default class Scraper {
    async getPrice(
        url: string, 
        parser: (html: string) => PriceScrapResult[]
    ): Promise<[Error, null] | [false, PriceScrapResult[]]> {
        
        try {
            const html = await this.scrap<string>(url);
            const res: PriceScrapResult[] = parser(html);
            return [false, res];
        } catch (e) {
            return e instanceof Error ? [e, null] : [new Error(e + ''), null];
        }
    }

    async getAvailability(
        url: string, 
        parser: (html: string, siteUrl: string) => [AvailabilityById, boolean]
    ): Promise<[Error, null, null] | [false, AvailabilityById, boolean]> {
        try {
            const html = await this.scrap<string>(url);
            const siteUrl = new URL(url).hostname;
            const res: [AvailabilityById, boolean] = parser(html, siteUrl);
            return [false, res[0], res[1]];
        } catch (e) {
            return e instanceof Error ? [e, null, null] : [new Error(e + ''), null, null];
        }
    }

    async getAvailabilityJson(
        url: string, 
        parser: (html: object, siteUrl: string) => [AvailabilityById, boolean]
    ): Promise<[Error, null, null] | [false, AvailabilityById, boolean]> {
        
        try {
            const json = await this.scrap<object>(url);
            const siteUrl = new URL(url).hostname;
            const res: [AvailabilityById, boolean] = parser(json, siteUrl);
            return [false, res[0], res[1]];
        } catch (e) {
            return e instanceof Error ? [e, null, null] : [new Error(e + ''), null, null];
        }
    }

    private scrap<T>(url: string): Promise<T> {
        return axios.get<T>(url, { 
            headers: {
                "referer": url,
                "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"106\", \"Google Chrome\";v=\"106\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"macOS\"",
                "sec-fetch-site": "same-site",
                "sec-fetch-user": "?1",
                "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36",
                "accept-language": "en-US,en;q=0.9"
            }
        }).then(response => response.data);
    }
}
