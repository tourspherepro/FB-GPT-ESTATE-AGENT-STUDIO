import { notFound } from 'next/navigation';
import DashboardPage from '@/app/dashboard/page';

// These routes are deliberately unavailable in production builds.
export default function DesignUserPage() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return <DashboardPage />;
}
