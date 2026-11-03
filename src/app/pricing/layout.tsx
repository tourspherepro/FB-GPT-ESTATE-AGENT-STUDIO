import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing | EASTUDIO',
  description: 'Flexible pricing plans for modern estate agents and agencies.',
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}