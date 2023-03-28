import dotenv from "dotenv";
import { enrichAirtable } from './services/tableEnricher';
dotenv.config()

enrichAirtable()