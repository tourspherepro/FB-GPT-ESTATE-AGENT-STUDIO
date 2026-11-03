
'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the PanoramaViewer with SSR turned off
const PanoramaViewer = dynamic(() => import('@/components/panorama-viewer'), {
  ssr: false,
  loading: () => (
    <div style={{ width: "100%", height: "100vh", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p>Loading Tour...</p>
    </div>
  ),
});


// This page is dedicated to showing the 360 tour in fullscreen.
export default function TourViewerPage() {
  return (
    <PanoramaViewer />
  );
}
