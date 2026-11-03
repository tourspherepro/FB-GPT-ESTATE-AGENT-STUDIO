'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/header';
import HeaderHome from '@/components/HeaderHome';
import Footer from '@/components/Footer';
import React from 'react';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const noHeader = ["/login", "/signup", "/tour", "/forgot-password", "/preview"];

  let header = null;
  if (isHome) {
    header = <HeaderHome />;
  } else if (!noHeader.some(path => pathname.startsWith(path))) {
    header = <Header />;
  }

  return (
    <>
      {header}
      <main>{children}</main>
      <Footer />
    </>
  );
}
