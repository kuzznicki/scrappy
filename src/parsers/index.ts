import { AvailabilityById, PriceScrapResult } from "../types";
import perfumehub from "./perfumehub";
import perfumypl from "./perfumypl";
import justjoinit_json from "./justjoinit_json";

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

export const availabilityParsersJson: {
    [k: string]: (json: object, siteUrl: string) => [AvailabilityById, boolean]
} = {
    justjoinit_json
}
