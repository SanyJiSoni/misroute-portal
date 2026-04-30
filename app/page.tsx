export default function Home() {
  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1 style={{ fontSize: "28px", fontWeight: "bold" }}>
        Misroute Defaulter Portal
      </h1>

      <p style={{ marginTop: "10px" }}>
        Logistics Misroute Action & Decision System
      </p>

      <div style={{ marginTop: "30px" }}>
        <a href="/upload">
          <button style={{ padding: "10px 20px", marginRight: "10px" }}>
            Upload Data
          </button>
        </a>

        <a href="/dashboard">
          <button style={{ padding: "10px 20px", marginRight: "10px" }}>
            Dashboard
          </button>
        </a>

        <a href="/actions">
          <button style={{ padding: "10px 20px", marginRight: "10px" }}>
            Actions
          </button>
        </a>

        <a href="/workflow">
          <button style={{ padding: "10px 20px" }}>
            Workflow
          </button>
        </a>
      </div>
    </div>
  );
}