import { NextRequest, NextResponse } from "next/server";

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
const normalize = (val: any) =>
  (val || "").toString().trim().toUpperCase();

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

      const alongRoute = normalize(row.Along_the_route);
      const misrouteLoc = normalize(row.Misrouted_Captured_location);
      const destination = normalize(row.Manifest_Destination_name);
      const shipmentFlag = normalize(row.Shipment_Count_Flag);

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

  // Step 2: Aggregation
  const aggregatedData = aggregateData(processedData);

// 🔹 Apply decision logic
const decisionData = applyDecisionEngine(aggregatedData);

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