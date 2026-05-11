"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function updatePassword() {
    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        alert(error.message);
      } else {
        alert("Password updated successfully");
        window.location.href = "/login";
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#05080d] px-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#0b111a] p-6 shadow-2xl">
        <h1 className="mb-2 text-3xl font-bold">Reset Password</h1>

        <p className="mb-6 text-sm text-slate-400">
          Enter your new password below
        </p>

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-[#05080d] px-4 py-3 pr-12 outline-none focus:border-violet-500"
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <button
          onClick={updatePassword}
          disabled={loading}
          className="mt-5 w-full rounded-xl bg-violet-600 py-3 font-medium transition hover:bg-violet-500 disabled:opacity-50"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </div>
    </main>
  );
}