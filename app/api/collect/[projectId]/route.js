import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req, { params }) {
  const { projectId } = await params;
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
    return NextResponse.json(
      { error: "invalid email" },
      { status: 400, headers: corsHeaders },
    );
  }

  const client = await clientPromise;
  const db = client.db("waitlist");

  const project = await db.collection("projects").findOne({ projectId });
  if (!project) {
    return NextResponse.json(
      { error: "project not found" },
      { status: 404, headers: corsHeaders },
    );
  }

  const existing = await db.collection("emails").findOne({ projectId, email });
  if (existing) {
    return NextResponse.json(
      { status: "already_exists" },
      { status: 200, headers: corsHeaders },
    );
  }

  await db
    .collection("emails")
    .insertOne({ projectId, email, createdAt: new Date() });

  return NextResponse.json(
    { status: "success" },
    { status: 200, headers: corsHeaders },
  );
}
