import { NextRequest, NextResponse } from "next/server";
import { pool } from "../../lib/db";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

/* =========================
   🔹 ACTION DICTIONARY
========================= */

const VALID_CASE_STATUS = [
  "OPEN",
  "UNDER_OPS_REVIEW",
  "UNDER_HR_REVIEW",
  "ON_HOLD",
  "APPROVED",
  "REJECTED",
  "CLOSED",
];

const VALID_OPS_STATUS = [
  "PENDING",
  "APPROVED",
  "HOLD",
  "REJECTED",
];

const VALID_HR_STATUS = [
  "PENDING",
  "APPROVED",
  "HOLD",
  "WARNING_ISSUED",
  "TERMINATION_EXECUTED",
  "RETRAINING_ASSIGNED",
];






/* =========================
   GET ALL CASES
========================= */
export async function GET() {
  try {
    const result = await pool.query(`
      SELECT *
      FROM action_cases
      ORDER BY created_at DESC
    `);

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Failed to fetch cases" },
      { status: 500 }
    );
  }
}

/* =========================
   UPDATE CASE
========================= */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

/* =========================
   🔹 SESSION VALIDATION
========================= */

/* =========================
   🔹 SESSION VALIDATION
========================= */

const session = await getServerSession(authOptions);



// if (!session || !session.user) {
//   return NextResponse.json(
//     {
//       error: "Unauthorized",
//     },
//     { status: 401 }
//   );
// }





const currentUser = {
  role: "ADMIN",
  site: "ALL",
};
const actor_role = currentUser.role;

/* =========================
   🔹 REQUEST BODY
========================= */

const {
  case_id,

  case_status,

  ops_status,
  hr_status,

  ops_remark,
  hr_remark,

  hold_reason,

  final_decision,
} = body;



/* =========================
   🔹 VALIDATION
========================= */

if (
  case_status &&
  !VALID_CASE_STATUS.includes(case_status)
) {
  return NextResponse.json(
    {
      error: `Invalid case_status: ${case_status}`,
    },
    { status: 400 }
  );
}

if (
  ops_status &&
  !VALID_OPS_STATUS.includes(ops_status)
) {
  return NextResponse.json(
    {
      error: `Invalid ops_status: ${ops_status}`,
    },
    { status: 400 }
  );
}

if (
  hr_status &&
  !VALID_HR_STATUS.includes(hr_status)
) {
  return NextResponse.json(
    {
      error: `Invalid hr_status: ${hr_status}`,
    },
    { status: 400 }
  );
}



/* =========================
   🔹 USER SESSION
========================= */




/* =========================
   🔹 SITE ACCESS VALIDATION
========================= 

const caseResult = await pool.query(
  `
  SELECT * FROM action_cases
  WHERE case_id = $1
  `,
  [case_id]
);

if (caseResult.rows.length === 0) {
  return NextResponse.json(
    {
      error: "Case not found",
    },
    { status: 404 }
  );
}

const caseData = caseResult.rows[0];

// ADMIN bypass
if (
  currentUser.role !== "ADMIN" &&
  currentUser.site !== "ALL"
) {
  if (
    currentUser.assigned_site !== caseData.site
  ) {
    return NextResponse.json(
      {
        error:
          "Access denied: Site mismatch",
      },
      { status: 403 }
    );
  }
}


Temporarily bypassing site access validation for development purposes

*/



/* =========================
   🔹 ROLE DICTIONARY
========================= */

const VALID_ROLES = [
  "ADMIN",
  "OPS",
  "HR",
  "PE",
];




if (
  actor_role &&
  !VALID_ROLES.includes(actor_role)
) {
  return NextResponse.json(
    {
      error: `Invalid actor_role: ${actor_role}`,
    },
    { status: 400 }
  );
}



/* =========================
   🔹 PERMISSION ENGINE
========================= */

// OPS actions
if (
  ops_status &&
  actor_role !== "OPS" &&
  actor_role !== "ADMIN"
) {
  return NextResponse.json(
    {
      error:
        "Only OPS or ADMIN can perform OPS actions",
    },
    { status: 403 }
  );
}

// HR actions
if (
  hr_status &&
  actor_role !== "HR" &&
  actor_role !== "ADMIN"
) {
  return NextResponse.json(
    {
      error:
        "Only HR or ADMIN can perform HR actions",
    },
    { status: 403 }
  );
}









/* =========================
   🔹 HOLD FREEZE LOGIC
========================= */

const existingCase = await pool.query(
  `
  SELECT * FROM action_cases
  WHERE case_id = $1
  `,
  [case_id]
);

const currentCase = existingCase.rows[0];

// If already on HOLD → block workflow
if (currentCase.case_status === "ON_HOLD") {
  return NextResponse.json(
    {
      error:
        "Case is currently ON_HOLD. Workflow actions blocked.",
    },
    { status: 400 }
  );
}

/* =========================
   🔹 UPDATE CASE
========================= */

await pool.query(
  `
  UPDATE action_cases
  SET
    case_status = COALESCE($1, case_status),

    ops_status = COALESCE($2, ops_status),
    hr_status = COALESCE($3, hr_status),

    ops_remark = COALESCE($4, ops_remark),
    hr_remark = COALESCE($5, hr_remark),

    hold_reason = COALESCE($6, hold_reason),

    final_decision = COALESCE($7, final_decision)

  WHERE case_id = $8
  `,
  [
    case_status,

    ops_status,
    hr_status,

    ops_remark,
    hr_remark,

    hold_reason,

    final_decision,

    case_id,
  ]
);

/* =========================
   🔹 CREATE ACTIVITY LOG
========================= */

await pool.query(
  `
  INSERT INTO case_activity_logs
  (
    case_id,
    actor_type,
    action_taken,
    remarks
  )
  VALUES ($1,$2,$3,$4)
  `,
  [
    case_id,

    ops_status ? "OPS" : "HR",

    ops_status ||
      hr_status ||
      case_status ||
      "UPDATED",

    ops_remark ||
      hr_remark ||
      hold_reason ||
      "",
  ]
);

    return NextResponse.json({
      message: "Case updated successfully",
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Case update failed" },
      { status: 500 }
    );
  }
}