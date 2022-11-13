import { AvailabilityById, PriceScrapResult } from "../types";
import perfumehub from "./perfumehub";
import perfumypl from "./perfumypl";

export const priceParsers: { 
    [k: string]: (html: string) => PriceScrapResult[]
} = {
    perfumehub
}

export const availabilityParsers: {
    [k: string]: (html: string, siteUrl: string) => [AvailabilityById, boolean]
} = {
    perfumypl
}
