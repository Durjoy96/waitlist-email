import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function POST(req, { params }) {
  const { projectId } = params;
  const contentType = req.headers.get("content-type") || "";

  let email;
  if (contentType.includes("application/json")) {
    email = (await req.json()).email;
  } else {
    const formData = await req.formData();
    email = formData.get("email");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return NextResponse.redirect(new URL("/error?reason=invalid", req.url));
  }

  const client = await clientPromise;
  const db = client.db("waitlist");

  const project = await db.collection("projects").findOne({ projectId });
  if (!project) {
    return NextResponse.json({ error: "project not found" }, { status: 404 });
  }

  const existing = await db.collection("emails").findOne({ projectId, email });
  if (existing) {
    return NextResponse.redirect(new URL("/thank-you?status=already", req.url));
  }

  await db
    .collection("emails")
    .insertOne({ projectId, email, createdAt: new Date() });

  return NextResponse.redirect(new URL("/thank-you", req.url));
}
