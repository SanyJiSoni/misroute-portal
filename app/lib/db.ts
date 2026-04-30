import { Pool } from "pg";

export const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "misroute_db",
  password: "password",
  port: 5432,
});