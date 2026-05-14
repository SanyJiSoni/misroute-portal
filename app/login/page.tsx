"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [employeeId, setEmployeeId] =
    useState("");

  const [password, setPassword] =
    useState("");

  async function handleLogin() {
    await signIn("credentials", {
      employee_id: employeeId,
      password,
      callbackUrl: "/portal",
    });
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f4f4f4",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "40px",
          borderRadius: "10px",
          width: "350px",
        }}
      >
        <h1>
          Misroute Portal Login
        </h1>

        <input
          placeholder="Employee ID"
          value={employeeId}
          onChange={(e) =>
            setEmployeeId(e.target.value)
          }
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "20px",
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "10px",
          }}
        />

        <button
          onClick={handleLogin}
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "20px",
          }}
        >
          Login
        </button>
      </div>
    </div>
  );
}