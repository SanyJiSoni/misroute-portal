"use client";

import { useEffect, useState } from "react";

export default function RawDashboard() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/upload")
      .then((res) => res.json())
      .then(setData);
  }, []);

  return (
    <div style={{ padding: "40px" }}>
      <h1>Bucket Data (Raw)</h1>

      {data.length > 0 && (
        <table border={1}>
          <thead>
            <tr>
              {Object.keys(data[0]).map((k) => (
                <th key={k}>{k}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                {Object.values(row).map((val: any, j) => (
                  <td key={j}>{val}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}