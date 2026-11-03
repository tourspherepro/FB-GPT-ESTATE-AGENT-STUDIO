import { notFound } from 'next/navigation';
import Link from 'next/link';
import { DashboardContent } from '@/components/dashboard/dashboard-content';

// Same live dashboard presentation and tool cards, without authentication-dependent
// layout or data access. This route is not available outside Next.js development.
export default function DesignUserPage() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="border-b border-amber-200 bg-amber-50 px-6 py-3 text-sm text-amber-900">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <strong>LOCAL DESIGN MODE — Actual user dashboard layout; no login or live data</strong>
          <nav className="flex gap-5 underline">
            <Link href="/design/admin">Admin dashboard</Link>
            <Link href="/login">Back to login</Link>
          </nav>
        </div>
      </div>
      <main className="mx-auto max-w-7xl px-6 py-8">
        <DashboardContent designPreview />
      </main>
    </div>
  );
}
