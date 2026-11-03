import { notFound } from 'next/navigation';
import AdminPage from '@/app/admin/page';

// These routes are deliberately unavailable in production builds.
export default function DesignAdminPage() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return <AdminPage />;
}
