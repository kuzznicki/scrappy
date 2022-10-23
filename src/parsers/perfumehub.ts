import { load } from "cheerio";
import { ScrapResult } from "../types";

const priceRegex = /[0-9]+\.[0-9]{2}/;

export default function(htmlStr: string): ScrapResult[] {
    const res: ScrapResult[] = [];

    const $ = load(htmlStr);
    const elems = $('#main-content .offer');

    for (const elem of elems) {
        const offerHtml = $.html(elem);;
        const $o = load(offerHtml);

        const shopName = $o('.shop-name > a').text();
        const price = $o('.price > a').text();
        if (!shopName || !price) continue;

        const match = price.match(priceRegex);
        if (!match) continue;

        const priceNum = +match[0];
        res.push({ shop: shopName, price: priceNum });
    }

    return res;
}
