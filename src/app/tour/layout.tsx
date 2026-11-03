
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '360 Tour | EA Tools',
};

// This is a minimal layout to allow the 360 tour to be truly fullscreen.
export default function TourLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
