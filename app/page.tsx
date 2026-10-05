"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type MemoryItem = {
  id: string;
  kind: string;
  title: string;
  content: string;
  due_at: string | null;
  created_at: string;
};

type Connection = {
  id: string;
  provider: string;
  display_name: string;
  status: string;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
);

export default function Home() {
  const [input, setInput] = useState("");
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function authHeaders() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      window.location.href = "/login";
      return {};
    }
    return { Authorization: `Bearer ${data.session.access_token}` };
  }

  async function load() {
    setLoading(true);
    const headers = await authHeaders();
    const [memory, connectionData] = await Promise.all([
      fetch("/api/memory", { headers }),
      fetch("/api/connections", { headers })
    ]);

    if (memory.status === 401) {
      window.location.href = "/login";
      return;
    }

    const memoryJson = await memory.json();
    const connectionJson = await connectionData.json();
    setItems(memoryJson.items ?? []);
    setConnections(connectionJson.connections ?? []);
    setLoading(false);
  }

  async function capture(event: FormEvent) {
    event.preventDefault();
    if (!input.trim() || busy) return;

    setBusy(true);
    try {
      const headers = await authHeaders();
      const response = await fetch("/api/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ input })
      });
      const data = await response.json();
      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!response.ok) throw new Error(data.error || "Capture failed");
      setItems((current) => [data.item, ...current]);
      setInput("");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Capture failed");
    } finally {
      setBusy(false);
    }
  }

  const connectionLabel = (provider: string) =>
    connections.find((connection) => connection.provider === provider)?.status === "connected"
      ? "Connected"
      : "Not connected";

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">C</span>
          <div><strong>Chief of Staff</strong><span>Your second brain</span></div>
        </div>
        <nav>
          <a className="active" href="#">Today</a>
          <a href="#memory">Memory</a>
          <a href="#connections">Connections</a>
        </nav>
        <div className="sidebar-bottom"><div className="health-dot" /><span>Core system online</span></div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div><p className="eyebrow">Monday, October 5</p><h1>What needs your attention?</h1></div>
          <div className="avatar">DH</div>
        </header>

        <div className="capture-card">
          <form onSubmit={capture}>
            <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Tell your Chief of Staff anything..." rows={4} autoFocus />
            <div className="capture-footer">
              <span>Capture a thought, task, commitment, person, or idea.</span>
              <button disabled={busy || !input.trim()} type="submit">{busy ? "Processing..." : "Capture"}</button>
            </div>
          </form>
        </div>

        <div className="grid">
          <section className="panel" id="memory">
            <div className="panel-heading"><div><p className="eyebrow">Recent memory</p><h2>What I know</h2></div><span className="count">{items.length}</span></div>
            <div className="memory-list">
              {loading ? <p className="empty">Loading memory...</p> : items.length === 0 ? <p className="empty">Nothing captured yet. Start talking.</p> : items.map((item) => (
                <article className="memory-item" key={item.id}>
                  <div className={"kind " + item.kind}>{item.kind}</div>
                  <div className="memory-copy"><strong>{item.title}</strong><p>{item.content}</p>{item.due_at && <time>{new Date(item.due_at).toLocaleString()}</time>}</div>
                </article>
              ))}
            </div>
          </section>

          <section className="panel" id="connections">
            <div className="panel-heading"><div><p className="eyebrow">System awareness</p><h2>Connections</h2></div></div>
            {[
              ["◷", "Calendar", "calendar"],
              ["✉", "Email", "email"],
              ["✓", "Tasks", "tasks"]
            ].map(([icon, name, provider]) => (
              <div className="connection" key={provider}>
                <span className="connection-icon">{icon}</span>
                <div><strong>{name}</strong><span>{connectionLabel(provider)}</span></div>
                <b>{connectionLabel(provider) === "Connected" ? "●" : "○"}</b>
              </div>
            ))}
          </section>
        </div>
      </section>
    </main>
  );
}