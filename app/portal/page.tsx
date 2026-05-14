"use client";

import Link from "next/link";

import {
  useSession,
  signOut,
} from "next-auth/react";

export default function PortalPage() {
  const { data: session } =
    useSession();

  const role =
    session?.user?.role;

  return (
    <div
      style={{
        padding: "40px",
        fontFamily: "Arial",
      }}
    >
      <h1>
        Misroute Defaulter Portal
      </h1>

      <p>
        Logged in as:
        {" "}
        {role}
      </p>

      <div
        style={{
          marginTop: "30px",
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        <Link href="/dashboard">
          <button>
            Dashboard
          </button>
        </Link>

        {(role === "PE" ||
          role === "CENOPS") && (
          <Link href="/upload">
            <button>
              Upload Data
            </button>
          </Link>
        )}

        <Link href="/workflow">
          <button>
            Workflow
          </button>
        </Link>
      </div>

      <button
        onClick={() => signOut()}
        style={{
          marginTop: "40px",
        }}
      >
        Logout
      </button>
    </div>
  );
}