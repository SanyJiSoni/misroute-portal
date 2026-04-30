import { NextRequest, NextResponse } from "next/server";

import { workflowStore } from "../store";

// GET workflow data
export async function GET() {
  return NextResponse.json(workflowStore);
}

// UPDATE workflow (HR/Ops actions)
export async function POST(req: NextRequest) {
  const body = await req.json();

  const { gc, week, status, hr_remark, ops_remark, final_action } = body;

for (let i = 0; i < workflowStore.length; i++) {
  if (
    workflowStore[i].gc === gc &&
    workflowStore[i].week === week
  ) {
    workflowStore[i] = {
      ...workflowStore[i],
      status: status || workflowStore[i].status,
      hr_remark: hr_remark || workflowStore[i].hr_remark,
      ops_remark: ops_remark || workflowStore[i].ops_remark,
      final_action: final_action || workflowStore[i].final_action,
    };
  }
};

  return NextResponse.json({ message: "Workflow updated" });
}