export type ScrapResultById = {
    [observedItemId: string]: ScrapResult[]
};

export type LowestPricesById = {
    [observedItemId: string]: number,
};

export type ScrapResult = {
    shop: string,
    price: number
};

export type ObservedItem = {
    name: string,
    url: string,
    parser: string
};

export type ObservedItemsDict = {
    [observedItemId: string]: {
        name: string,
        url: string,
        parser: string
    }
};

export function isNewPriceUpdate(val: any): val is NewPriceUpdate {
    return (
        val &&
        typeof val === "object" &&
        "id" in val &&
        typeof val["id"] === "string" &&
        "type" in val &&
        val["type"] === "new" &&
        "currentPrice" in val &&
        typeof val["currentPrice"] === "number"
    )
}

type NewPriceUpdate = {
    id: string,
    type: "new"
    currentPrice: number
}

type ExistingPriceUpdate = {
    id: string,
    type: "updated"
    previousPrice: number
    currentPrice: number
}

export type PriceUpdate = NewPriceUpdate | ExistingPriceUpdate;

export type PriceUpdatesByType = {
    new: NewPriceUpdate[], 
    priceUp: ExistingPriceUpdate[], 
    priceDown: ExistingPriceUpdate[] 
}
