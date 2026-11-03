import Link from 'next/link';
import { Building2, LayoutDashboard, Home, Image, Clapperboard, FileText, Users, BarChart3, Settings, CalendarDays, ShieldCheck, ArrowLeft } from 'lucide-react';

const modules = [
  { name: 'Properties', description: 'Create and manage property listings', icon: Home },
  { name: 'Content Studio', description: 'Generate property descriptions and adverts', icon: FileText },
  { name: 'Photo Studio', description: 'Improve and prepare listing photography', icon: Image },
  { name: 'Video Studio', description: 'Create property marketing videos', icon: Clapperboard },
  { name: 'Campaign Calendar', description: 'Plan social and email campaigns', icon: CalendarDays },
  { name: 'Analytics', description: 'Review campaign performance', icon: BarChart3 },
];
const adminModules = [
  { name: 'Agency Accounts', description: 'Manage agency tenancy and membership', icon: Building2 },
  { name: 'Users and Roles', description: 'Manage access and permissions', icon: Users },
  { name: 'Integrations', description: 'Connect services and APIs', icon: LayoutDashboard },
  { name: 'System Settings', description: 'Platform configuration', icon: Settings },
  { name: 'Activity and Reports', description: 'Review system usage', icon: BarChart3 },
  { name: 'Security', description: 'Authentication and access policies', icon: ShieldCheck },
];

export default async function PreviewPage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  const admin = role === 'admin';
  if (role !== 'admin' && role !== 'user') {
    const { notFound } = await import('next/navigation');
    notFound();
  }
  const cards = admin ? adminModules : modules;
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-5">
          <Link href="/login" className="text-xl font-bold tracking-wide text-sky-700">EASTUDIO</Link>
          <nav className="flex flex-wrap items-center gap-3 text-sm">
            <Link href="/preview/user" className={admin ? 'rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100' : 'rounded-lg bg-sky-100 px-3 py-2 font-semibold text-sky-800'}>User Dashboard</Link>
            <Link href="/preview/admin" className={admin ? 'rounded-lg bg-sky-100 px-3 py-2 font-semibold text-sky-800' : 'rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100'}>Admin Dashboard</Link>
            <Link href="/login" className="rounded-lg border border-slate-300 px-3 py-2">Sign in</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-10">
        <Link href="/login" className="mb-7 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-sky-700"><ArrowLeft size={16}/> Back to login</Link>
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-sky-700">Read-only demonstration</p>
            <h1 className="mt-2 text-3xl font-bold">{admin ? 'Administration Dashboard' : 'Estate Agent Dashboard'}</h1>
            <p className="mt-2 max-w-2xl text-slate-600">Preview the interface without signing in. This contains example modules only; no customer records or administrative actions are available.</p>
          </div>
          <span className="rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-900">Preview mode — no live data</span>
        </div>
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {[
            ['Account status', 'Demo only'],
            ['Live integrations', 'Not connected'],
            ['Permissions', 'Read-only'],
          ].map(([label,value]) => (
            <section key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-lg font-semibold">{value}</p>
            </section>
          ))}
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {cards.map(({name,description,icon:Icon}) => (
            <section key={name} className="min-h-44 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-700"><Icon size={23}/></div>
              <h2 className="text-lg font-semibold">{name}</h2>
              <p className="mt-1 text-sm text-slate-600">{description}</p>
              <p className="mt-4 text-xs font-medium text-slate-400">Preview — feature requires sign-in</p>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
