import dotenv from "dotenv";
import { enrichAirtable } from './services/tableEnricher';
dotenv.config()

try {
  enrichAirtable()
} catch (error) {
  console.log(error.message || error)
}