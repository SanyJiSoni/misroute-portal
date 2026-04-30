"use client";

import { useState } from "react";
import Papa from "papaparse";

export default function UploadPage() {
  const [file, setFile] = useState<any>(null);
  const [data, setData] = useState<any[]>([]);

  const handleFileSelect = (event: any) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
  };

  const handleUpload = () => {
    console.log("Upload button clicked");

    if (!file) {
      alert("Please select a file first");
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async function (results) {
        console.log("Parsed Data:", results.data);

        const parsedData = results.data;
        setData(parsedData);

        try {
          const response = await fetch("/api/upload", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(parsedData),
          });

          console.log("Backend response:", response);
          alert("Data uploaded successfully!");
        } catch (error) {
          console.error("Fetch error:", error);
          alert("Error sending data to backend");
        }
      },
      error: function (error) {
        console.error("Papa Parse Error:", error);
        alert("Error parsing file");
      },
    });
  };

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>
        Upload Misroute Data
      </h1>

      <input type="file" accept=".csv" onChange={handleFileSelect} />

      <div style={{ marginTop: "20px" }}>
        <button
          onClick={handleUpload}
          style={{ padding: "10px 20px", cursor: "pointer" }}
        >
          Upload File
        </button>
      </div>

      {data.length > 0 && (
        <table border={1} style={{ marginTop: "20px", width: "100%" }}>
          <thead>
            <tr>
              {Object.keys(data[0]).map((key) => (
                <th key={key}>{key}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.slice(0, 5).map((row, i) => (
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