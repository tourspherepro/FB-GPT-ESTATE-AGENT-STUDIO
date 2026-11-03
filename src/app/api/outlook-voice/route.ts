import { NextResponse } from 'next/server';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { z } from 'zod';

export const runtime = 'nodejs';

const CommandSchema = z.object({
  command: z.string().trim().min(1).max(200),
  payload: z.record(z.unknown()).optional(),
});

function getAdminApp() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin credentials are not configured');
  }

  return getApps()[0] ?? initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
  });
}

export async function POST(req: Request) {
  try {
    const token = req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
    if (!token) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const app = getAdminApp();
    let decoded;
    try {
      decoded = await getAuth(app).verifyIdToken(token, true);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid authentication token' }, { status: 401 });
    }

    // The requester must be explicitly provisioned for this tenant and API.
    if (typeof decoded.tenantId !== 'string' || !decoded.tenantId || decoded.outlookVoice !== true) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const parsed = CommandSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid command payload' }, { status: 400 });
    }

    const doc = await getFirestore(app).collection('outlookCommands').add({
      ...parsed.data,
      tenantId: decoded.tenantId,
      userId: decoded.uid,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, id: doc.id });
  } catch (error) {
    console.error('Outlook command request failed', error);
    return NextResponse.json({ success: false, error: 'Outlook command service unavailable' }, { status: 503 });
  }
}
