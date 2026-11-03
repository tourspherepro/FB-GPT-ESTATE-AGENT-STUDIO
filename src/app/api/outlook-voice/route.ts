
import { NextResponse } from "next/server";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Prevent multiple firebase initializations
try {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    })
  });
} catch {}

const db = getFirestore();

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Store command in Firestore for Outlook Add-In to read
    const doc = await db.collection("outlookCommands").add({
      command: body.command,
      payload: body.payload,
      status: "pending",
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      id: doc.id
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
