
'use client';

import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCcw, Wand2, Loader2, Undo2, Orbit, Sparkles, Trash2, Cloudy, Ruler, Image as ImageIcon, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { editImage, EditImageInput } from '@/ai/flows/edit-image-flow';
import { measureRoomFrom360 } from '@/ai/flows/measure-room-from-360';
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


const PanoramaViewer = dynamic(() => import('@/components/panorama-viewer'), {
  ssr: false,
  loading: () => <div className="flex h-full w-full items-center justify-center bg-muted"><Loader2 className="h-8 w-8 animate-spin" /></div>,
});


type FileWithPreview = File & { preview: string };
type AlteredImageState = {
  preview: string;
  promptUsed: string;
};

// Add a new type for the output of the measure room flow
type MeasureRoomFrom360Output = {
  lengthMeters: number;
  widthMeters: number;
  heightMeters: number;
};


export default function EaImageProPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [originalImage, setOriginalImage] = useState<FileWithPreview | null>(null);
  const [originalPano, setOriginalPano] = useState<FileWithPreview | null>(null);
  
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPrompt, setLoadingPrompt] = useState('');
  
  const [objectToRemove, setObjectToRemove] = useState('');

  const [roomMeasurements, setRoomMeasurements] = useState<MeasureRoomFrom360Output | null>(null);
  const [isMeasuring, setIsMeasuring] = useState(false);
  
  const [activeTab, setActiveTab] = useState('standard');


  const onDrop = useCallback((acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        const fileWithPreview = Object.assign(file, {
          preview: URL.createObjectURL(file)
        });
        setOriginalImage(fileWithPreview);
        setOriginalPano(null);
        setCurrentImage(fileWithPreview.preview);
        setHistory([]);
        setRoomMeasurements(null);
        setActiveTab('standard');
      }
  }, []);
  
  const toDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };
  
  const onDropPano = useCallback((acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        const fileWithPreview = Object.assign(file, {
          preview: URL.createObjectURL(file) // Keep blob for display if needed, but we'll convert to data URI for the viewer
        });

        toDataURL(file).then(dataUrl => {
            setOriginalPano(fileWithPreview);
            setOriginalImage(null);
            setCurrentImage(dataUrl); // Use data URI for the viewer
            setHistory([]);
            setRoomMeasurements(null);
            setActiveTab('360');
        });
      }
  }, []);

  const { getRootProps: getPhotoRootProps, getInputProps: getPhotoInputProps } = useDropzone({
    onDrop,
    multiple: false,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
  });

  const { getRootProps: getPanoRootProps, getInputProps: getPanoInputProps } = useDropzone({
    onDrop: onDropPano,
    multiple: false,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
  });


  const handleReset = () => {
    // Revoke Object URLs to prevent memory leaks
    if (originalImage) URL.revokeObjectURL(originalImage.preview);
    if (originalPano) URL.revokeObjectURL(originalPano.preview);
    history.forEach(url => { if (url.startsWith('blob:')) URL.revokeObjectURL(url); });
    if(currentImage && currentImage.startsWith('blob:')) URL.revokeObjectURL(currentImage);

    setOriginalImage(null);
    setOriginalPano(null);
    setCurrentImage(null);
    setHistory([]);
    setIsLoading(false);
    setRoomMeasurements(null);
    setActiveTab('standard');
    toast({ title: 'Workspace Reset', description: 'All images have been cleared.' });
  };
  
  const handleApiRequest = async (prompt: string, displayPrompt: string) => {
    const imageToProcess = currentImage;
    if (!imageToProcess) {
      toast({ variant: 'destructive', title: 'No Image', description: 'Please upload an image first.' });
      return;
    }
    
    setIsLoading(true);
    setLoadingPrompt(displayPrompt);

    try {
        let imageDataUri = imageToProcess;
        if (imageToProcess.startsWith('blob:')) {
            const response = await fetch(imageToProcess);
            const blob = await response.blob();
            imageDataUri = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        }
        
        const input: EditImageInput = {
            imageDataUri: imageDataUri,
            prompt: prompt,
        };

        const result = await editImage(input);
        
        // Add previous image to history before updating
        setHistory(prev => [...prev, imageToProcess]);
        setCurrentImage(result.imageDataUri);

        toast({
            title: `Image Enhanced`,
            description: `Successfully applied: ${displayPrompt}.`
        });

    } catch (error: any) {
      console.error(`Error during enhancement:`, error);
      toast({
        variant: 'destructive',
        title: `Operation Failed`,
        description: error.message || 'An unexpected error occurred.',
        duration: 9000,
      });
    } finally {
      setIsLoading(false);
      setLoadingPrompt('');
    }
  };

  const handleMeasureRoom = async () => {
    if (!originalPano || !currentImage) {
        toast({ variant: 'destructive', title: 'No 360° Image', description: 'Please upload a panoramic image to measure the room.' });
        return;
    }
    setIsMeasuring(true);
    setRoomMeasurements(null);

    try {
        let imageDataUri = currentImage;
        if (currentImage.startsWith('blob:')) {
            const response = await fetch(currentImage);
            const blob = await response.blob();
            imageDataUri = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        }
        
        const result = await measureRoomFrom360({ imageDataUri, cameraHeightCm: 173 });
        setRoomMeasurements(result);
        toast({ title: 'Measurement Complete', description: 'Room dimensions have been estimated.' });

    } catch (error: any) {
        console.error('Error during room measurement:', error);
        toast({
            variant: 'destructive',
            title: 'Measurement Failed',
            description: error.message || 'Could not calculate room dimensions.',
        });
    } finally {
        setIsMeasuring(false);
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previousImage = history[history.length - 1];
    setCurrentImage(previousImage);
    setHistory(prev => prev.slice(0, -1));
  }


  useEffect(() => {
    // Cleanup function to revoke Object URLs on component unmount
    return () => {
        if (originalImage) URL.revokeObjectURL(originalImage.preview);
        if (originalPano) URL.revokeObjectURL(originalPano.preview);
        history.forEach(url => { if (url.startsWith('blob:')) URL.revokeObjectURL(url); });
        // Don't revoke currentImage as it might be a data URI
    }
  }, [originalImage, originalPano, history]);


  return (
    <AppLayout>
      <div className="flex items-center gap-4 mb-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">EA Image Pro</h1>
      </div>
      <p className="text-muted-foreground mb-8">Enhance property photos, from standard shots to 360° tours, with AI precision.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column for uploads & tools */}
        <div className="lg:col-span-1 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ImageIcon className="text-primary"/> 1. Upload Standard Photo</CardTitle>
              <CardDescription>For regular property photos.</CardDescription>
            </CardHeader>
            <CardContent>
              <div {...getPhotoRootProps()} className="flex items-center justify-center w-full p-8 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors">
                <input {...getPhotoInputProps()} />
                <div className="text-center">
                  <Upload className="w-10 h-10 text-muted-foreground mx-auto" />
                  <p className="mt-2 text-sm text-center text-muted-foreground">
                    Drag & drop, or click to upload
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Orbit className="text-primary"/> OR Upload 360° Photo</CardTitle>
              <CardDescription>For Ricoh Theta or similar panoramic images.</CardDescription>
            </CardHeader>
            <CardContent>
              <div {...getPanoRootProps()} className="flex items-center justify-center w-full p-8 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors">
                <input {...getPanoInputProps()} />
                <div className="text-center">
                  <Upload className="w-10 h-10 text-muted-foreground mx-auto" />
                  <p className="mt-2 text-sm text-center text-muted-foreground">
                    Drag & drop, or click to upload
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

           <Card>
                <CardHeader>
                    <CardTitle>2. AI Editing Tools</CardTitle>
                    <CardDescription>Select a tool to apply to your image.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Button onClick={() => handleApiRequest('auto-enhance', 'Auto Enhance')} className="w-full justify-start" disabled={isLoading || !currentImage} variant="outline">
                        <Sparkles className="mr-2" /> Auto Enhance
                    </Button>
                    <Button onClick={() => handleApiRequest('Replace the current sky with a clear, bright blue sky with a few fluffy white clouds.', 'Sky Replacement')} className="w-full justify-start" disabled={isLoading || !currentImage} variant="outline">
                        <Cloudy className="mr-2" /> Sky Replacement
                    </Button>
                     <Button onClick={() => handleApiRequest('Perform a magic erase function on this image to clean up any minor imperfections, blemishes, or distracting small objects, while keeping the main subject and background intact.', 'Magic Eraser')} className="w-full justify-start" disabled={isLoading || !currentImage} variant="outline">
                        <Wand2 className="mr-2" /> Magic Eraser
                    </Button>
                    <div className="pt-2">
                        <div className="flex gap-2">
                            <Input 
                                placeholder="e.g., 'the car in the driveway'" 
                                value={objectToRemove}
                                onChange={(e) => setObjectToRemove(e.target.value)}
                                disabled={isLoading || !currentImage}
                            />
                            <Button onClick={() => handleApiRequest(`Remove ${objectToRemove} from the image`, 'Object Removal')} disabled={isLoading || !currentImage || !objectToRemove}>
                                <Trash2 />
                            </Button>
                        </div>
                         <p className="text-xs text-muted-foreground mt-1">Describe an object to remove.</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>3. AI Measurement Tool</CardTitle>
                    <CardDescription>Estimate room dimensions from a 360° photo.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleMeasureRoom} className="w-full justify-center" disabled={isMeasuring || !originalPano}>
                        <Ruler className="mr-2" />
                        {isMeasuring ? 'Measuring...' : 'Measure Room'}
                    </Button>
                    {isMeasuring && <div className="flex justify-center mt-2"><Loader2 className="w-5 h-5 animate-spin" /></div>}
                    {roomMeasurements && (
                        <div className="mt-4 space-y-2 text-sm border-t pt-4">
                            <h4 className="font-semibold">Estimated Dimensions:</h4>
                            <div className="flex justify-between"><span>Length:</span> <span>{roomMeasurements.lengthMeters.toFixed(2)}m</span></div>
                            <div className="flex justify-between"><span>Width:</span> <span>{roomMeasurements.widthMeters.toFixed(2)}m</span></div>
                            <div className="flex justify-between"><span>Height:</span> <span>{roomMeasurements.heightMeters.toFixed(2)}m</span></div>
                        </div>
                    )}
                </CardContent>
            </Card>

        </div>

        {/* Right column for preview and actions */}
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Preview & Refine</CardTitle>
                <CardDescription>Your uploaded image will be shown here. Use the tools to enhance it.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="standard">Standard Photo</TabsTrigger>
                        <TabsTrigger value="360">360° Photo</TabsTrigger>
                    </TabsList>
                    <TabsContent value="standard">
                        <div className="relative mt-4 aspect-video w-full bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                            {isLoading && (
                                <div className="absolute inset-0 bg-black/50 z-10 flex flex-col items-center justify-center text-white">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                    <p className="mt-2 text-sm">Applying: {loadingPrompt}...</p>
                                </div>
                            )}
                            {currentImage && originalImage ? (
                               <img src={currentImage} alt="Property view" className="object-contain w-full h-full" />
                            ) : (
                                <div className="text-center p-8">
                                    <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <p className="mt-4 text-sm text-muted-foreground">Upload a standard photo to see a preview.</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                    <TabsContent value="360">
                        <div className="relative mt-4 aspect-video w-full bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                             {isLoading && (
                                <div className="absolute inset-0 bg-black/50 z-10 flex flex-col items-center justify-center text-white">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                    <p className="mt-2 text-sm">Applying: {loadingPrompt}...</p>
                                </div>
                            )}
                            {currentImage && originalPano ? (
                                <PanoramaViewer imageUrl={currentImage} />
                            ) : (
                                <div className="text-center p-8">
                                    <Orbit className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <p className="mt-4 text-sm text-muted-foreground">Upload a 360° photo to see an interactive preview.</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
            <CardFooter className="border-t pt-6 flex justify-between">
                <Button variant="outline" onClick={handleUndo} disabled={isLoading || history.length === 0}>
                    <Undo2 className="mr-2" /> Undo
                </Button>
                <Button variant="destructive" onClick={handleReset} disabled={isLoading}>
                    <RefreshCcw className="mr-2" />
                    Reset Workspace
                </Button>
            </CardFooter>
        </Card>
      </div>

    </AppLayout>
  );
}
