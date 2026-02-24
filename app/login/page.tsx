"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const handleLogin = () => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (
      normalizedEmail === "admin" &&
      normalizedPassword === "123456"
    ) {
      if (remember) {
        localStorage.setItem("isLoggedIn", "true");
      } else {
        sessionStorage.setItem("isLoggedIn", "true");
      }

      router.push("/dashboard");
    } else {
      alert("Invalid credentials");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="bg-surface p-8 rounded-xl shadow w-80">
        <h1 className="text-2xl font-bold mb-6 text-center text-primary">
          Navkon Admin
        </h1>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full border border-muted p-2 mb-4 rounded bg-background text-foreground"
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full border border-muted p-2 mb-2 rounded bg-background text-foreground"
        />

        {/* Remember Me */}
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="mr-2"
          />
          <label className="text-sm text-muted">Remember me</label>
        </div>

        <button
          onClick={handleLogin}
          className="w-full bg-accent text-white p-2 rounded hover:opacity-90 transition"
        >
          Login
        </button>
      </div>
    </div>
  );
}