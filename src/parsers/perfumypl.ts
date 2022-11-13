import { load } from "cheerio";
import { AvailabilityById } from "../types";

export default function(htmlStr: string, siteUrl: string): [AvailabilityById, boolean] {
    const res: AvailabilityById = {};

    const $ = load(htmlStr);

    const nextPageAvailable = !$('.pagination__element.--next.--disabled').length;
    const elems = $('#search .product a.product__name');

    for (const elem of elems) {
        const offerHtml = $.html(elem);
        const $o = load(offerHtml);

        const name = $o.text();
        const relativeUrl = elem?.attribs?.href;
        const url = siteUrl + relativeUrl;
        const available = true;

        if (!name || !url) continue;

        const id = name.replace(/\s/g, '_');
        res[id] = { name, url, available };
    }

    return [res, nextPageAvailable];
}
