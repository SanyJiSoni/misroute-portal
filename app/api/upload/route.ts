import { NextRequest, NextResponse } from "next/server";
import { pool } from "../../lib/db";

/* =========================
   🔹 DATA STORES
========================= */
import {
  processedDataStore,
  aggregatedDataStore,
  workflowStore,
} from "../store";

/* =========================
   🔹 HELPERS
========================= */
/* =========================
   🔹 SAFE VALUE NORMALIZER
========================= */
const safeNormalize = (val: any) =>
  (val || "").toString().trim().toUpperCase();

/* =========================
   🔹 SAFE DATE NORMALIZER
========================= */
const normalizeDate = (val: any) => {
  if (!val) return "";

  const d = new Date(val);

  if (isNaN(d.getTime())) return "";

  return d.toISOString().split("T")[0];
};
/* =========================
   🔹 BUCKET ENGINE
========================= */
function applyBucketLogic(data: any[]) {
  const manifestMap: Record<string, any[]> = {};

  // Group by Manifest
  data.forEach((row) => {
    const manifest = row.Manifest_Code || "UNKNOWN";

    if (!manifestMap[manifest]) {
      manifestMap[manifest] = [];
    }

    manifestMap[manifest].push(row);
  });

  let processedData: any[] = [];

  Object.keys(manifestMap).forEach((manifest) => {
    const rows = manifestMap[manifest];
    const awbCount = rows.length;

    rows.forEach((row) => {
      let bucket = "";

      const alongRoute = safeNormalize(row.Along_the_route);
const misrouteLoc = safeNormalize(row.Misrouted_Captured_location);
const destination = safeNormalize(row.Manifest_Destination_name);
const shipmentFlag = safeNormalize(row.Shipment_Count_Flag);

      // 🔴 Priority 1
      if (alongRoute === "YES") {
        bucket = "Open at Via";
      }

      // 🔴 Priority 2
      else if (
        (misrouteLoc.includes("NCR") && destination.includes("NCR")) ||
        (misrouteLoc.includes("KOL") && destination.includes("KOL"))
      ) {
        bucket = "Open at Via";
      }

      // 🔴 Priority 3
      else {
        if (awbCount === 1) {
          bucket = "1 AWB Misroute";
        } else if (awbCount >= 2 && awbCount <= 3) {
          if (shipmentFlag.includes("WHOLE_BAG_MISROUTE")) {
            bucket = "2-3 AWB Whole Bag Misroute";
          } else {
            bucket = "2-3 AWB Misroute";
          }
        } else if (awbCount > 3) {
          bucket = "3+ AWB Misroute";
        }
      }

      processedData.push({
        ...row,
        bucket,
        awb_count: awbCount,
      });
    });
  });

  return processedData;
}

/* =========================
   🔹 AGGREGATION ENGINE
========================= */
function aggregateData(processedData: any[]) {
  const aggregationMap: Record<string, any> = {};

  processedData.forEach((row) => {
    const gc = row.action_user || "UNKNOWN";
    const origin = row.Manifest_origin_name || "UNKNOWN";

    const rawDate = row.Misrouted_date;

const date = new Date(rawDate);

if (isNaN(date.getTime())) {
  console.log("Invalid date:", rawDate);
  return;
}
    if (isNaN(date.getTime())) return;

    const week = Math.ceil(date.getDate() / 7);

    const key = `${gc}_${week}`;

    if (!aggregationMap[key]) {
      aggregationMap[key] = {
        gc,
        origin,
        week,
        awb_count: 0,
        dates: new Set(),
      };
    }

    aggregationMap[key].awb_count += 1;
    const normalizedDate = date.toISOString().split("T")[0]; // YYYY-MM-DD
aggregationMap[key].dates.add(normalizedDate);
  });

  return Object.values(aggregationMap).map((item: any) => ({
    gc: item.gc,
    origin: item.origin,
    week: item.week,
    awb_count: item.awb_count,
    frequency: item.dates.size,
  }));
}



/* =========================
   🔹 DECISION ENGINE
========================= */
function applyDecisionEngine(aggregatedData: any[]) {
  let decisionData: any[] = [];

  // Track warnings per GC
  const warningTracker: Record<string, number> = {};

  aggregatedData.forEach((row) => {
    let action = "No Action";

    // 🔹 Weekly Rules
    if (row.frequency > 3 && row.awb_count > 16) {
      action = "Termination";
    } else if (row.frequency > 3 && row.awb_count > 5 && row.awb_count <= 16) {
      action = "Warning Letter";

      // Track warning
      const gc = row.gc;
      if (!warningTracker[gc]) {
        warningTracker[gc] = 0;
      }
      warningTracker[gc] += 1;
    }

    decisionData.push({
      ...row,
      action,
    });
  });

  // 🔹 Quarterly Rule
  decisionData = decisionData.map((row) => {
    if (warningTracker[row.gc] >= 2 && row.action === "Warning Letter") {
      return {
        ...row,
        action: "Termination (Quarterly Rule)",
      };
    }
    return row;
  });

  return decisionData;
}






/* =========================
   🔹 API: POST (UPLOAD)
========================= */
export async function POST(req: NextRequest) {
  const body = await req.json();

  // Step 1: Bucket logic
  const processedData = applyBucketLogic(body);

// =========================
// 🔹 SAVE TO DATABASE
// =========================

for (const row of processedData) {
  try {
    // 🔹 Check existing record
    const existing = await pool.query(
      `
      SELECT * FROM processed_data
      WHERE action_user = $1
      AND awb_number = $2
      `,
      [row.action_user, row.awb_number]
    );

    // =========================
    // 🔹 NEW RECORD
    // =========================
    if (existing.rows.length === 0) {
      await pool.query(
        `
        INSERT INTO processed_data
        (
          action_user,
          awb_number,
          manifest_code,
          bucket,
          misrouted_date
        )
        VALUES ($1, $2, $3, $4, $5)
        `,
        [
          row.action_user,
          row.awb_number,
          row.Manifest_Code,
          row.bucket,
          row.Misrouted_date,
        ]
      );

      console.log(
        `Inserted: ${row.action_user} - ${row.awb_number}`
      );
    }

    // =========================
    // 🔹 EXISTING RECORD
    // =========================
    else {
      const oldRow = existing.rows[0];

      const isDifferent =
  safeNormalize(oldRow.bucket) !==
    safeNormalize(row.bucket) ||

  safeNormalize(oldRow.manifest_code) !==
    safeNormalize(row.Manifest_Code) ||

  normalizeDate(oldRow.misrouted_date) !==
    normalizeDate(row.Misrouted_date);

      // 🔴 CONFLICT DETECTED
      if (isDifferent) {
        console.log(
          `⚠ Conflict detected: ${row.action_user} - ${row.awb_number}`
        );

        // Save audit log
        await pool.query(
          `
          INSERT INTO audit_log
          (
            action_user,
            awb_number,
            old_bucket,
            new_bucket,
            old_manifest,
            new_manifest,
            old_date,
            new_date,
            warning_type
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
          `,
          [
            row.action_user,
            row.awb_number,
            oldRow.bucket,
            row.bucket,
            oldRow.manifest_code,
            row.Manifest_Code,
            oldRow.misrouted_date,
            row.Misrouted_date,
            "DATA_CONFLICT",
          ]
        );
      }

      // Exact duplicate
      else {
        console.log(
          `Duplicate skipped: ${row.action_user} - ${row.awb_number}`
        );
      }
    }
  } catch (err) {
    console.error("DB Insert Error:", err);
  }
}




  // Step 2: Aggregation
  const aggregatedData = aggregateData(processedData);

// 🔹 Apply decision logic
const decisionData = applyDecisionEngine(aggregatedData);


// =========================
// 🔹 CREATE ACTION CASES
// =========================

for (const row of decisionData) {
  // Only create cases for actionable rows
  if (
    row.action === "Termination" ||
    row.action === "Warning Letter" ||
    row.action === "Termination (Quarterly Rule)"
  ) {
    const caseId = `CASE-${row.gc}-${row.week}`;

    try {
      // Check existing case
      const existingCase = await pool.query(
        `
        SELECT * FROM action_cases
        WHERE case_id = $1
        `,
        [caseId]
      );

      // Create only if not exists
      if (existingCase.rows.length === 0) {
        await pool.query(
          `
          INSERT INTO action_cases
          (
            case_id,
            gc,
            action_type,
            week,
            awb_count,
            frequency,
            final_decision
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7)
          `,
          [
            caseId,
            row.gc,
            row.action,
            row.week,
            row.awb_count,
            row.frequency,
            row.action,
          ]
        );

        console.log(`Case Created: ${caseId}`);
      } else {
        console.log(`Case already exists: ${caseId}`);
      }
    } catch (err) {
      console.error("Case Creation Error:", err);
    }
  }
}




  // Step 3: Store
// Update processed data
processedDataStore.length = 0;
processedData.forEach((row) => processedDataStore.push(row));

// Update aggregated data
aggregatedDataStore.length = 0;
decisionData.forEach((row) => aggregatedDataStore.push(row));

// Initialize workflow
// Clear existing data
workflowStore.length = 0;

// Push new data
decisionData.forEach((row) => {
  workflowStore.push({
    ...row,
    status: "Pending",
    hr_remark: "",
    ops_remark: "",
    final_action: row.action,
  });
});

  console.log("Processed:", processedData.length);
  console.log("Aggregated:", aggregatedData.length);

  return NextResponse.json({
    message: "Data processed successfully",
  });
}

/* =========================
   🔹 API: GET
========================= */
export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");

  if (type === "aggregated") {
    return NextResponse.json(aggregatedDataStore);
  }

  return NextResponse.json(processedDataStore);
}