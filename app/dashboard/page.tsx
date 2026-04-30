"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/upload?type=aggregated")
      .then((res) => res.json())
      .then((res) => {
        console.log("Fetched Data:", res);
        setData(res);
      })
      .catch((err) => console.error("Error fetching data:", err));
  }, []);

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>
        Dashboard - Uploaded Data
      </h1>

      {data.length === 0 ? (
        <p style={{ marginTop: "20px" }}>No data available</p>
      ) : (
        <table border={1} style={{ marginTop: "20px", width: "100%" }}>
          <thead>
            <tr>
              {Object.keys(data[0]).map((key) => (
                <th key={key}>{key}</th>
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