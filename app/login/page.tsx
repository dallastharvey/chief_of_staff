"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
);

export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    });
    setBusy(false);
    if (error) {
      window.alert(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <main className="login-shell">
      <div className="login-card">
        <span className="brand-mark">C</span>
        <p className="eyebrow">Chief of Staff</p>
        <h1>Sign in</h1>
        <p className="login-copy">Your Chief of Staff needs to know whose life it is managing.</p>
        {sent ? (
          <div className="sent">Check your email for the sign-in link.</div>
        ) : (
          <form onSubmit={submit}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <button disabled={busy}>{busy ? "Sending..." : "Send sign-in link"}</button>
          </form>
        )}
      </div>
    </main>
  );
}