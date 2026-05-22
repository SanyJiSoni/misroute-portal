"use client";

import {
  useEffect,
  useState,
} from "react";

export default function Dashboard() {
  const [data, setData] =
    useState<any[]>([]);

  const [selectedGC,
    setSelectedGC] =
    useState("");

  const [selectedDate,
    setSelectedDate] =
    useState("");

  useEffect(() => {
    fetch("/api/upload")
      .then((res) => res.json())
.then((res) => {
  console.log(
    "Fetched Data:",
    res
  );

  if (Array.isArray(res)) {
    setData(res);
  } else {
    console.error(
      "API did not return array"
    );

    setData([]);
  }
})
      .catch((err) =>
        console.error(
          "Error fetching data:",
          err
        )
      );
  }, []);

const filteredData =
  data.filter((row) => {
    const gcMatch =
      !selectedGC ||
      row.action_user
        ?.toString()
        .toLowerCase()
        .includes(
          selectedGC.toLowerCase()
        );

    const dateMatch =
      !selectedDate ||
      row.misrouted_date
        ?.toString()
        .toLowerCase()
        .includes(
          selectedDate.toLowerCase()
        );

    return (
      gcMatch &&
      dateMatch
    );
  });

  return (
    <div
      style={{
        padding: "40px",
        fontFamily: "Arial",
      }}
    >
      <h1
        style={{
          fontSize: "24px",
          fontWeight: "bold",
        }}
      >
        Dashboard - Uploaded Data
      </h1>

      {/* NAVIGATION */}
      <div
        style={{
          marginTop: "20px",
          marginBottom: "20px",
          display: "flex",
          gap: "10px",
        }}
      >
        <a href="/upload">
          <button>
            Upload Data
          </button>
        </a>

        <a href="/workflow">
          <button>
            Workflow
          </button>
        </a>
      </div>

      {/* FILTERS */}
      <div
        style={{
          marginBottom: "20px",
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >


        <input
          placeholder="Filter by GC"
          value={selectedGC}
          onChange={(e) =>
            setSelectedGC(
              e.target.value
            )
          }
          style={{
            padding: "8px",
            width: "200px",
          }}
        />

        <input
          placeholder="Filter by Date"
          value={selectedDate}
          onChange={(e) =>
            setSelectedDate(
              e.target.value
            )
          }
          style={{
            padding: "8px",
            width: "200px",
          }}
        />
      </div>

      {/* TABLE */}
      {filteredData.length ===
      0 ? (
        <p
          style={{
            marginTop: "20px",
          }}
        >
          No data available
        </p>
      ) : (
        <div
          style={{
            overflowX: "auto",
          }}
        >
          <table
            border={1}
            style={{
              marginTop: "20px",
              width: "100%",
              borderCollapse:
                "collapse",
            }}
          >
            <thead>
              <tr>
                {Object.keys(
                  filteredData[0]
                ).map((key) => (
                  <th
                    key={key}
                    style={{
                      padding:
                        "10px",
                      background:
                        "#f2f2f2",
                    }}
                  >
                    {key}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredData.map(
                (row, i) => (
                  <tr key={i}>
                    {Object.values(
                      row
                    ).map(
                      (
                        val: any,
                        j
                      ) => (
                        <td
                          key={j}
                          style={{
                            padding:
                              "8px",
                          }}
                        >
                          {val}
                        </td>
                      )
                    )}
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}