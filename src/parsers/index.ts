import { ScrapResult } from "../types";
import perfumehub from "./perfumehub";

const modulesMap: { 
    [k: string]: (html: string) => ScrapResult[]
} = {
    perfumehub
}

export default modulesMap;
