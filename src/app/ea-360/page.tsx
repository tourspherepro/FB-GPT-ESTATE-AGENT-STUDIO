
'use client';

import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Orbit, FileJson, Copy, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useToast } from '@/hooks/use-toast';

// Dynamically import the PanoramaViewer with SSR turned off
const PanoramaViewer = dynamic(() => import('@/components/panorama-viewer'), {
  ssr: false,
  loading: () => <div className="w-full h-96 rounded-xl flex flex-col items-center justify-center bg-muted text-muted-foreground"><Loader2 className="w-8 h-8 animate-spin mb-2" /><span>Loading 360° Preview...</span></div>
});

// This path should point to a real image in your Firebase Storage bucket for testing
const testPanoramaStoragePath = "panoramas/living-room-360.jpg"; 

// Mock data representing a Firestore document
const mockPanoramaData = {
  is360: true,
  projection: "equirectangular",
  storagePath: testPanoramaStoragePath,
  initialYaw: 120,
  initialPitch: 10,
  initialFov: 75,
  roomName: "Living Room",
};

export default function Ea360Page() {
  const { toast } = useToast();

  const handleCopyJson = () => {
      navigator.clipboard.writeText(JSON.stringify(mockPanoramaData, null, 2));
      toast({
        title: "Copied to Clipboard",
        description: "The mock Firestore data has been copied."
      })
  }

  return (
    <AppLayout>
      <div className="flex items-center gap-4 mb-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline flex items-center gap-3">
          <Orbit className="w-8 h-8" /> EA 360 Tour
        </h1>
      </div>
      <p className="text-muted-foreground mb-8">View and manage your 360° property images.</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>{mockPanoramaData.roomName}</CardTitle>
                    <CardDescription>
                        Interactive 360° preview.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* The imageUrl prop is not used by the simple green box, but we pass it for when the real viewer is implemented */}
                    <PanoramaViewer
                        imageUrl={testPanoramaStoragePath}
                    />
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileJson /> Firestore Data</CardTitle>
                    <CardDescription>
                        This is the data structure used to load the panorama.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
                        <code>{JSON.stringify(mockPanoramaData, null, 2)}</code>
                    </pre>
                </CardContent>
                 <CardFooter>
                    <Button variant="outline" className="w-full" onClick={handleCopyJson}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy JSON
                    </Button>
                </CardFooter>
            </Card>
        </div>
      </div>
    </AppLayout>
  );
}
