"use client";

import { useEffect, useState } from "react";

export default function WorkflowPage() {
  const [data, setData] = useState<any[]>([]);

  const fetchData = () => {
    fetch("/api/workflow")
      .then((res) => res.json())
      .then(setData);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateStatus = async (row: any, status: string) => {
    await fetch("/api/workflow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        gc: row.gc,
        week: row.week,
        status,
      }),
    });

    fetchData();
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>Workflow Dashboard</h1>

      {data.length > 0 && (
        <table border={1}>
          <thead>
            <tr>
              <th>GC</th>
              <th>Week</th>
              <th>AWB</th>
              <th>Freq</th>
              <th>Action</th>
              <th>Status</th>
              <th>Controls</th>
            </tr>
          </thead>

          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                <td>{row.gc}</td>
                <td>{row.week}</td>
                <td>{row.awb_count}</td>
                <td>{row.frequency}</td>
                <td>{row.action}</td>
                <td>{row.status}</td>

                <td>
                  <button onClick={() => updateStatus(row, "Approved")}>
                    Approve
                  </button>

                  <button onClick={() => updateStatus(row, "On Hold")}>
                    Hold
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}