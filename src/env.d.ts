declare namespace NodeJS {
  interface ProcessEnv {
    APOLLO_API_KEY: string
    AIRTABLE_API_KEY: string;
    AIRTABLE_BASE_ID: string;
    AIRTABLE_TABLE_ID: string;
    AIRTABLE_VIEW_ID: string;
    OPEN_AI_API_KEY: string;
    DATABASE_URL: string;
  }
}