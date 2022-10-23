declare namespace NodeJS {
    interface ProcessEnv {
        OBSERVED_ITEMS_JSON: string
        RESULTS_FOLDER: string
        SERVER_PORT: string
        CHECK_INTERVAL_MINUTES: string
        REQUEST_INTERVAL_SECONDS: string
        BOT_TOKEN: string
        CHAT_ID: string
    }
}

declare module '*.json' {
    const value: any;
    export default value;
}
