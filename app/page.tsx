"use client";

import { FormEvent, useState } from "react";

type MemoryItem = {
  id: string;
  kind: string;
  title: string;
  content: string;
  due_at: string | null;
  created_at: string;
};

const starterItems: MemoryItem[] = [
  {
    id: "demo-1",
    kind: "task",
    title: "Review the new house project",
    content: "The garage and attic projects need attention this week.",
    due_at: null,
    created_at: new Date().toISOString()
  },
  {
    id: "demo-2",
    kind: "note",
    title: "Chief of Staff MVP",
    content: "Build around low-friction capture first, then add connected sources.",
    due_at: null,
    created_at: new Date().toISOString()
  }
];

export default function Home() {
  const [input, setInput] = useState("");
  const [items, setItems] = useState<MemoryItem[]>(starterItems);
  const [busy, setBusy] = useState(false);

  async function capture(event: FormEvent) {
    event.preventDefault();
    if (!input.trim() || busy) return;

    setBusy(true);
    try {
      const response = await fetch("/api/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Capture failed");

      setItems((current) => [data.item, ...current]);
      setInput("");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Capture failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">C</span>
          <div>
            <strong>Chief of Staff</strong>
            <span>Your second brain</span>
          </div>
        </div>

        <nav>
          <a className="active" href="#">Today</a>
          <a href="#memory">Memory</a>
          <a href="#connections">Connections</a>
        </nav>

        <div className="sidebar-bottom">
          <div className="health-dot" />
          <span>Core system online</span>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Monday, October 5</p>
            <h1>What needs your attention?</h1>
          </div>
          <div className="avatar">DH</div>
        </header>

        <div className="capture-card">
          <form onSubmit={capture}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell your Chief of Staff anything..."
              rows={4}
              autoFocus
            />
            <div className="capture-footer">
              <span>Capture a thought, task, commitment, person, or idea.</span>
              <button disabled={busy || !input.trim()} type="submit">
                {busy ? "Processing..." : "Capture"}
              </button>
            </div>
          </form>
        </div>

        <div className="grid">
          <section className="panel" id="memory">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Recent memory</p>
                <h2>What I know</h2>
              </div>
              <span className="count">{items.length}</span>
            </div>

            <div className="memory-list">
              {items.map((item) => (
                <article className="memory-item" key={item.id}>
                  <div className={"kind " + item.kind}>{item.kind}</div>
                  <div className="memory-copy">
                    <strong>{item.title}</strong>
                    <p>{item.content}</p>
                    {item.due_at && <time>{new Date(item.due_at).toLocaleString()}</time>}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="panel" id="connections">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">System awareness</p>
                <h2>Connections</h2>
              </div>
            </div>

            <div className="connection">
              <span className="connection-icon">◷</span>
              <div><strong>Calendar</strong><span>Not connected</span></div>
              <b>○</b>
            </div>
            <div className="connection">
              <span className="connection-icon">✉</span>
              <div><strong>Email</strong><span>Not connected</span></div>
              <b>○</b>
            </div>
            <div className="connection">
              <span className="connection-icon">✓</span>
              <div><strong>Tasks</strong><span>Not connected</span></div>
              <b>○</b>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}