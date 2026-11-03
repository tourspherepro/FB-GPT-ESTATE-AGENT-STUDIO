import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// This is an operational health probe, not a live Firebase/Gemini connection test.
export function GET() {
  const firebaseConfigured = [
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  ].every(Boolean);
  const aiConfigured = Boolean(process.env.GEMINI_API_KEY);
  return NextResponse.json({
    service: 'estateagent-studio',
    status: firebaseConfigured ? 'running' : 'setup_required',
    configuration: {
      firebase: firebaseConfigured ? 'present' : 'missing',
      ai: aiConfigured ? 'present' : 'missing',
    },
    note: 'Configuration presence only; external services not tested',
  }, { status: firebaseConfigured ? 200 : 503, headers: { 'Cache-Control': 'no-store' } });
}
