import { NextRequest, NextResponse } from "next/server";
import { pool } from "../../lib/db";

export async function GET(req: NextRequest) {
  try {
    const caseId =
      req.nextUrl.searchParams.get("case_id");

    const result = await pool.query(
      `
      SELECT *
      FROM case_activity_logs
      WHERE case_id = $1
      ORDER BY created_at DESC
      `,
      [caseId]
    );

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        error:
          "Failed to fetch activity logs",
      },
      { status: 500 }
    );
  }
}