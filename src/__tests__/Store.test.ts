import Store, {  } from "../Store";
import fs from "fs/promises";
import Logger from "../Logger";
import { LowestPricesById, ObservedItemsDict, ScrapResultById } from "../types";

import { datetimeRegex } from "./helpers";

let store: Store;
const mockErrorString = 'test';
let readFileMock: jest.Mock;
let writeFileMock: jest.Mock;

beforeEach(() => {
    store = new Store();
    readFileMock = fs.readFile = jest.fn();
    writeFileMock = fs.writeFile = jest.fn();
})

test('Should be able to load observed items', async () => {
    const data = { 'product-id': { name: 'Product name', url: 'https://example.com', parser: 'perfumehub' }};
    const fileContent = JSON.stringify(data);
    readFileMock.mockReturnValue(fileContent);

    const items: ObservedItemsDict = await store.loadObservedItems();
    
    expect(readFileMock).toBeCalledTimes(1);
    expect(items).toMatchObject<ObservedItemsDict>(data);
    expect(store.getObservedItems()).toMatchObject<ObservedItemsDict>(data);
})

test('Should return empty object if failed to load observed items', async () => {
    const logErrorMock = Logger.getInstance().error = jest.fn();

    readFileMock.mockRejectedValue(mockErrorString);
    
    const items: ObservedItemsDict = await store.loadObservedItems();

    expect(logErrorMock).toBeCalledTimes(1);
    expect(logErrorMock).toBeCalledWith(expect.stringMatching('Could not load observed items file - ' + mockErrorString));
    expect(readFileMock).toBeCalledTimes(1);
    expect(items).toMatchObject<ObservedItemsDict>({});
});

test('Should be able to get lowest prices data from file', async () => {
    const data = { 'item1': 290, 'item2': 300 };
    const fileContent = JSON.stringify({ ...data, LAST_UPDATE: '03:24:00 17/12/1995' });
    readFileMock.mockReturnValue(fileContent);

    const lowestPricesData: LowestPricesById = await store.getLowestPricesFromFile();

    expect(readFileMock).toBeCalledTimes(1);
    expect(lowestPricesData).toMatchObject<LowestPricesById>(data);
});

test('Should return empty object if failed to load lowest prices', async () => {
    const logWarnMock = Logger.getInstance().warn = jest.fn();
    readFileMock.mockRejectedValue(mockErrorString);

    const lowestPricesData: LowestPricesById = await store.getLowestPricesFromFile();
    
    expect(logWarnMock).toBeCalledTimes(1);
    expect(logWarnMock).toBeCalledWith(expect.stringMatching('Could not load lowest prices file - ' + mockErrorString));
    expect(readFileMock).toBeCalledTimes(1);
    expect(lowestPricesData).toMatchObject<LowestPricesById>({});
});

test('Should be able to save lowest prices data to file', async () => {
    const data: LowestPricesById = { 'item1': 100, 'item2': 200 };
    const dataJson = JSON.stringify({ ...data, LAST_UPDATE: 'VAR' })
    const dataJsonRegex = new RegExp(dataJson.replace('VAR', datetimeRegex));
    const success = await store.saveLowestPrices(data);

    expect(writeFileMock).toBeCalledTimes(1);
    expect(writeFileMock).toBeCalledWith(expect.stringMatching(/.+\.json/), expect.stringMatching(dataJsonRegex));
    expect(success).toBe(true);
});

test('Should return false if failed to save lowest prices data to file', async () => {
    const logErrorMock = Logger.getInstance().error = jest.fn();
    writeFileMock.mockRejectedValue(mockErrorString);

    const data: LowestPricesById = {};
    const success = await store.saveLowestPrices(data)

    expect(writeFileMock).toBeCalledTimes(1);
    expect(logErrorMock).toBeCalledTimes(1);
    expect(logErrorMock).toBeCalledWith(expect.stringMatching('Failed to save lowest prices file - ' + mockErrorString));
    expect(success).toBe(false);
});

test('Should be able to save scraping results to file', async () => {
    const data: ScrapResultById = { 'item1': [{ shop: 'A', price: 2 }] };
    const success = await store.saveResult(data);

    expect(writeFileMock).toBeCalledTimes(1);
    expect(writeFileMock).toBeCalledWith(expect.stringMatching(/.+\.json/), JSON.stringify(data));
    expect(success).toBe(true);
});

test('Should return false if failed to save scraping results to file', async () => {
    const logErrorMock = Logger.getInstance().error = jest.fn();
    writeFileMock.mockRejectedValue(mockErrorString);
    
    const data: ScrapResultById = { 'item1': [{ shop: 'A', price: 2 }] };
    const success = await store.saveResult(data);

    expect(writeFileMock).toBeCalledTimes(1);
    expect(logErrorMock).toBeCalledTimes(1);
    expect(logErrorMock).toBeCalledWith(expect.stringMatching('Failed to save scraping results - ' + mockErrorString));
    expect(success).toBe(false);
});
