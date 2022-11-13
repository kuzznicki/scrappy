import axios from "axios";
import { PriceScrapResult } from "./types";

export default class Scraper {
    async get(
        url: string, 
        parser: (html: string) => PriceScrapResult[]
    ): Promise<[Error, null] | [false, PriceScrapResult[]]> {
        
        try {
            const html = await this._scrapHtml(url);
            const res: PriceScrapResult[] = parser(html);
            return [false, res];
        } catch (e) {
            return e instanceof Error ? [e, null] : [new Error(e + ''), null];
        }
    }

    _scrapHtml(url: string): Promise<string> {
        return axios.get<string>(url, { 
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
