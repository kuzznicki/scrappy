export type PriceScrapResultById = {
    [trackedItemId: string]: PriceScrapResult[]
};

export type LowestPricesById = {
    [trackedItemId: string]: number,
};

export type PriceScrapResult = {
    shop: string,
    price: number
};

export type TrackedPriceItem = {
    name: string,
    url: string,
    parser: string
};

export type TrackedPriceItemsDict = {
    [trackedItemId: string]: {
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

export type Availability = {
    url: string,
    name: string,
    available: boolean
}

export type AvailabilityById = {
    [trackedItemId: string]: Availability
};

export type AvailabilityBySite = {
    [siteId: string]: AvailabilityById
}

export type SiteDefinition = {
    name: string,
    urlPattern: string,
    initialValue: string,
    parser: string
}

export type TrackedAvailabilitySites = {
    [trackedItemId: string]: {
        name: string,
        urlPattern: string,
        initialValue: string,
        parser: string
    }
};

export type AvailabilityUpdates = {
    availableIds: string[],
    notAvailableIds: string[]
}

export type AddTrackedPriceItemPayload = { 
    url: string, 
    name: string, 
    parser: string 
};

export function isTrackedPriceItemPayload(val: any): val is AddTrackedPriceItemPayload {
    return (
        val && typeof val === 'object' &&
        'url' in val && typeof val['url'] === 'string' &&
        'name' in val && typeof val['name'] === 'string' &&
        'parser' in val && typeof val['parser'] === 'string'
    );
}