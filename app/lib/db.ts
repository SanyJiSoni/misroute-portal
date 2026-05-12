import { Pool } from "pg";

export const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "misroute_db",
  password: "I@sany@1928",
  port: 5432,
});