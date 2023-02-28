declare namespace NodeJS {
  interface ProcessEnv {
    APOLLO_API_KEY: string
    AIRTABLE_API_KEY: string;
    OPEN_AI_API_KEY: string;
    DATABASE_URL: string;
  }
}