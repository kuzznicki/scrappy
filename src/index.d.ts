declare namespace NodeJS {
    interface ProcessEnv {
        TRACKED_PRICES_JSON: string
        PRICES_CHECK_INTERVAL_MINUTES: string
        TRACKED_AVAILABILITY_JSON: string
        AVAILABILITY_CHECK_INTERVAL_MINUTES: string
        RESULTS_FOLDER: string
        SERVER_PORT: string
        REQUEST_INTERVAL_SECONDS: string
        BOT_TOKEN: string
        CHAT_ID: string
    }
}

declare module '*.json' {
    const value: any;
    export default value;
}
