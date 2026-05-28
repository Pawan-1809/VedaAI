"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { login } from "@/store/authSlice";

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const auth = useAppSelector((s) => s.auth);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (auth.token) {
      router.push("/");
    }
  }, [auth.token, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await dispatch(login({ username, password }));
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="lg:ml-[304px] flex-1 flex justify-center pt-16 lg:pt-[78px] pb-20 lg:pb-8 px-4 lg:px-8">
        <div className="w-full max-w-[520px] bg-[rgba(255,255,255,0.5)] rounded-[32px] p-6 sm:p-8 flex flex-col gap-6 h-fit">
          <div>
            <h1 className="text-2xl font-bold text-[#303030]">Log in</h1>
            <p className="text-sm text-[rgba(94,94,94,0.55)]">
              Use your VedaAI account to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-2 text-sm text-[#303030]">
              Username
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
                className="h-11 rounded-xl border border-[#dadada] bg-white px-4 text-sm"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm text-[#303030]">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="h-11 rounded-xl border border-[#dadada] bg-white px-4 text-sm"
              />
            </label>

            {auth.error && (
              <div className="text-sm text-red-600">{auth.error}</div>
            )}

            <button
              type="submit"
              disabled={auth.status === "loading"}
              className="h-11 rounded-full bg-[#181818] text-white text-sm font-medium disabled:opacity-60"
            >
              {auth.status === "loading" ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="text-xs text-[rgba(94,94,94,0.55)]">
            <Link href="/" className="hover:underline">
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
