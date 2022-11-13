import { PriceScrapResult } from "../types";
import perfumehub from "./perfumehub";

const modulesMap: { 
    [k: string]: (html: string) => PriceScrapResult[]
} = {
    perfumehub
}

export default modulesMap;
