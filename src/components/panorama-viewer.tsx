
// src/components/panorama-viewer.tsx
"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

type PanoramaViewerProps = {
  imageUrl: string;
};

// For now this is just a green box + orbit controls.
// Once stable, you can replace with your 360 sphere + texture.
function SimpleScene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 3, 3]} />
      <mesh>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#4ade80" />
      </mesh>
      <OrbitControls enableZoom />
    </>
  );
}

const PanoramaViewer: React.FC<PanoramaViewerProps> = ({ imageUrl }) => {
  // `imageUrl` is unused in this minimal test; add your 360 texture later.
  return (
    <div className="w-full h-96 rounded-xl overflow-hidden border">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <Suspense fallback={null}>
          <SimpleScene />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default PanoramaViewer;
