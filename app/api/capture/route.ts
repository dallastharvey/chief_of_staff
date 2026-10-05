import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Extracted = {
  kind: "task" | "event" | "person" | "note" | "commitment";
  title: string;
  content: string;
  due_at: string | null;
};

function fallback(input: string): Extracted {
  return { kind: "note", title: input.trim().slice(0, 80), content: input.trim(), due_at: null };
}

async function extract(input: string): Promise<Extracted> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return fallback(input);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Extract one memory item. Return JSON with kind (task, event, person, note, commitment), title, content, and due_at. due_at must be ISO 8601 when an unambiguous date/time is present, otherwise null. Do not invent dates." },
        { role: "user", content: input }
      ]
    })
  });
  if (!response.ok) return fallback(input);
  const json = await response.json();
  try { return JSON.parse(json.choices?.[0]?.message?.content ?? "") as Extracted; }
  catch { return fallback(input); }
}

export async function POST(request: Request) {
  const body = await request.json();
  const input = typeof body.input === "string" ? body.input.trim() : "";
  if (!input) return NextResponse.json({ error: "Capture cannot be empty." }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: request.headers.get("Authorization") ?? "" } } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const extracted = await extract(input);
  const { data, error } = await supabase.from("memory_items").insert({
    user_id: user.id, source: "manual", kind: extracted.kind,
    title: extracted.title, content: extracted.content, due_at: extracted.due_at
  }).select("id, kind, title, content, due_at, created_at").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data, persistence: "supabase" });
}