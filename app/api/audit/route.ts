import { NextResponse } from "next/server";
import { pool } from "../../lib/db";

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT *
      FROM audit_log
      ORDER BY created_at DESC
    `);

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}