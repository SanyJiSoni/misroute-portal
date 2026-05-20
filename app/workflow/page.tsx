"use client";

import { useEffect, useState } from "react";
import { useSession }
from "next-auth/react";

export default function WorkflowPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] =
  useState<any[]>([]);

const [selectedCase, setSelectedCase] =
  useState("");
  const [remarks, setRemarks] = useState<
    Record<string, string>
  >({});

  async function loadCases() {
    const res = await fetch("/api/cases");
    const data = await res.json();

    setCases(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    loadCases();
  }, []);

  async function updateCase(
    caseId: string,
    type: string
  ) {
    let body: any = {
      case_id: caseId,
    };

    if (type === "APPROVE") {
      body.ops_status = "APPROVED";
      body.case_status = "UNDER_HR_REVIEW";
      body.ops_remark = remarks[caseId] || "";
    }

    if (type === "HOLD")
  {
      body.hr_status = "HOLD";
      body.case_status = "ON_HOLD";
      body.hold_reason = remarks[caseId] || "";
    }

if (type === "WARNING") {
  body.hr_status =
    "WARNING_ISSUED";

  body.case_status = "CLOSED";

  body.final_decision =
    "Warning Letter";

  body.hr_remark =
    remarks[caseId] || "";
}

if (type === "TERMINATE") {
  body.hr_status =
    "TERMINATION_EXECUTED";

  body.case_status = "CLOSED";

  body.final_decision =
    "Termination";

  body.hr_remark =
    remarks[caseId] || "";
}

if (type === "CLOSE") {
  body.case_status = "CLOSED";

  body.final_decision =
    "No Action Required";
}


    const res = await fetch("/api/cases", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(body),
    });

    const result = await res.json();

    alert(result.message || result.error);

    loadCases();
  }

async function loadActivity(caseId: string) {
  setSelectedCase(caseId);

  const res = await fetch(
    `/api/case-activity?case_id=${caseId}`
  );

  const data = await res.json();

  setActivityLogs(data);


}



  return (
    <div
      style={{
        padding: "30px",
        fontFamily: "Arial",
      }}
    >
      <h1
        style={{
          fontSize: "32px",
          marginBottom: "20px",
        }}
      >
        Case Workflow Dashboard
      </h1>

      <table
        border={1}
        cellPadding={10}
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <thead
          style={{
            background: "#222",
            color: "white",
          }}
        >
          <tr>
            <th>Case ID</th>
            <th>GC</th>
            <th>Action</th>
            <th>Case Status</th>
            <th>OPS</th>
            <th>HR</th>
            <th>Site</th>
            <th>Remarks</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {Array.isArray(cases) &&
  cases.map((row) => (
            <tr key={row.case_id}>
              <td>{row.case_id}</td>

              <td>{row.gc}</td>

              <td>{row.action_type}</td>

              <td>
                <span
                  style={{
                    padding: "5px 10px",
                    borderRadius: "5px",
                    background:
                      row.case_status === "ON_HOLD"
                        ? "orange"
                        : row.case_status ===
                          "CLOSED"
                        ? "green"
                        : "#ddd",
                  }}
                >
                  {row.case_status}
                </span>
              </td>

              <td>{row.ops_status}</td>

              <td>{row.hr_status}</td>

              <td>{row.site}</td>

              <td>
                <input
                  type="text"
                  placeholder="Enter remarks"
                  value={
                    remarks[row.case_id] || ""
                  }
                  onChange={(e) =>
                    setRemarks({
                      ...remarks,
                      [row.case_id]:
                        e.target.value,
                    })
                  }
                />
              </td>

              <td>
                <button
                  onClick={() =>
                    updateCase(
                      row.case_id,
                      "APPROVE"
                    )
                  }
                >
                  Approve
                </button>

                <button
                  onClick={() =>
                    updateCase(
                      row.case_id,
                      "HOLD"
                    )
                  }
                  style={{
                    marginLeft: "10px",
                  }}
                >
                  Hold
                </button>

<button
  onClick={() =>
    updateCase(
      row.case_id,
      "WARNING"
    )
  }
  style={{
    marginLeft: "10px",
  }}
>
  Warning
</button>

<button
  onClick={() =>
    updateCase(
      row.case_id,
      "TERMINATE"
    )
  }
  style={{
    marginLeft: "10px",
  }}
>
  Terminate
</button>

<button
  onClick={() =>
    updateCase(
      row.case_id,
      "CLOSE"
    )
  }
  style={{
    marginLeft: "10px",
  }}
>
  Close
</button>

                <button
onClick={() => {
  console.log("Timeline Clicked");
  console.log(row.case_id);

  loadActivity(row.case_id);
}}
  style={{
    marginLeft: "10px",
  }}
>
  Timeline
</button>

              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {selectedCase && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background:
        "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 999,
    }}
  >
    <div
      style={{
        background: "white",
        padding: "20px",
        borderRadius: "10px",
        width: "600px",
        maxHeight: "80vh",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
        }}
      >
        <h2>
          Activity Timeline
        </h2>

        <button
          onClick={() => {
            setSelectedCase(
              null
            );

            setActivityLogs(
              []
            );
          }}
        >
          Close
        </button>
      </div>

      <p>
        <strong>
          Case:
        </strong>{" "}
        {selectedCase}
      </p>

      {activityLogs.length ===
        0 && (
        <p>
          No actions taken yet.
        </p>
      )}

      {activityLogs.map(
        (log, i) => (
          <div
            key={i}
            style={{
              borderBottom:
                "1px solid #ddd",
              padding:
                "10px 0",
            }}
          >
            <p>
              <strong>
                Actor:
              </strong>{" "}
              {
                log.actor_type
              }
            </p>

            <p>
              <strong>
                Action:
              </strong>{" "}
              {
                log.action_taken
              }
            </p>

            <p>
              <strong>
                Remarks:
              </strong>{" "}
              {log.remarks}
            </p>

            <p>
              <strong>
                Time:
              </strong>{" "}
              {new Date(
                log.created_at
              ).toLocaleString()}
            </p>
          </div>
        )
      )}
    </div>
  </div>
)}
    </div>
  );
}