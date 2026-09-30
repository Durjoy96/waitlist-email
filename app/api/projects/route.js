import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function POST(req) {
  const apiKey = req.headers.get("x-api-key");
  if (apiKey !== process.env.MY_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { name } = await req.json();
  if (!name)
    return NextResponse.json({ error: "name required" }, { status: 400 });

  const projectId = name.toLowerCase().replace(/[^a-z0-9-]/g, "-");

  const client = await clientPromise;
  const db = client.db("waitlist");
  await db
    .collection("projects")
    .updateOne(
      { projectId },
      { $setOnInsert: { projectId, name, createdAt: new Date() } },
      { upsert: true },
    );

  const baseUrl = process.env.BASE_URL || "http://localhost:3000";
  const snippet = `<form action="${baseUrl}/api/collect/${projectId}" method="POST">
  <input type="email" name="email" required placeholder="you@example.com" />
  <button type="submit">Join Waitlist</button>
</form>`;

  return NextResponse.json({ projectId, snippet });
}
