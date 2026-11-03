
'use client';

import React, { useState, useCallback, useRef } from 'react';
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Clapperboard,
  ImageIcon,
  Video,
  Wand2,
  Loader2,
  List,
  Save,
  Download,
  Library,
  Upload,
  Sparkles,
  StopCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { runCreatorStudio, CreatorStudioInput, CreatorStudioOutput } from '@/ai/flows/creator-studio-flow';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';


// Mock types based on the system prompt
type GenerationType = 'text_to_image' | 'text_to_video' | 'image_to_video';

export default function CreatorStudioPage() {
  const { toast } = useToast();
  const [generationType, setGenerationType] = useState<GenerationType>('text_to_video');
  const [prompt, setPrompt] = useState('');
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [model, setModel] = useState('videocrafter2');
  const [duration, setDuration] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [storyboard, setStoryboard] = useState<any[]>([]); // Using any to match storyboard schema
  const [generatedAsset, setGeneratedAsset] = useState<CreatorStudioOutput | null>(null);
  const [inputImage, setInputImage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);


  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setInputImage(loadEvent.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
  });

  const handleGenerate = async () => {
    if (!prompt) {
      toast({ variant: 'destructive', title: 'Prompt is required' });
      return;
    }
     if (generationType === 'image_to_video' && !inputImage) {
      toast({ variant: 'destructive', title: 'Image is required for this generation type.' });
      return;
    }
    
    setIsLoading(true);
    setStoryboard([]);
    setGeneratedAsset(null);
    setEnhancedPrompt('');
    
    abortControllerRef.current = new AbortController();

    const input: CreatorStudioInput = {
        requestType: generationType,
        prompt: prompt,
        ...(generationType.includes('video') && { durationSeconds: duration }),
        ...(generationType === 'image_to_video' && { imageDataUri: inputImage! }),
    };

    try {
        const result = await runCreatorStudio(input, abortControllerRef.current.signal);
        
        if (abortControllerRef.current?.signal.aborted) {
            toast({ title: 'Generation Cancelled', description: 'The operation was stopped.' });
            return;
        }

        setGeneratedAsset(result);
        setEnhancedPrompt(result.finalPrompt);
        
        // Storyboard simulation since it's not in the final output schema
        if (result.type === 'video') {
             setStoryboard([
                { shot_number: 1, description: `Wide shot establishing the scene: ${result.finalPrompt}` },
                { shot_number: 2, description: `Medium shot focusing on the main subject, slight camera pan.` },
                { shot_number: 3, description: `Close-up shot of a key detail.` },
            ]);
        }
        
        toast({ title: 'Generation Complete!', description: `Your ${result.type} has been created.` });

    } catch (error: any) {
        if (error.name === 'AbortError' || abortControllerRef.current?.signal.aborted) {
             toast({ title: 'Generation Cancelled', description: 'The operation was stopped by the user.' });
        } else {
            console.error("Generation failed:", error);
            toast({ variant: 'destructive', title: 'Generation Failed', description: 'An unexpected error occurred.' });
        }
    } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const isPreviewVideo = generatedAsset?.type === 'video';
  const previewAssetUrl = isPreviewVideo 
    ? '/placeholder-video.mp4' // Using placeholder as we don't get a real URL back
    : generatedAsset?.ui.thumbnail; // Using thumbnail for image preview

  return (
    <AppLayout>
      <div className="flex items-center gap-4 mb-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">Creator Studio</h1>
      </div>
      <p className="text-muted-foreground mb-8">Generate stunning images and videos with the power of AI.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- LEFT PANEL --- */}
        <div className="lg:col-span-1 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary" /> Generate</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Select value={generationType} onValueChange={(v) => setGenerationType(v as GenerationType)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="text_to_video"><Video className="inline-block mr-2" />Text to Video</SelectItem>
                            <SelectItem value="text_to_image"><ImageIcon className="inline-block mr-2" />Text to Image</SelectItem>
                            <SelectItem value="image_to_video"><Clapperboard className="inline-block mr-2" />Image to Video</SelectItem>
                        </SelectContent>
                    </Select>
                    
                    {generationType === 'image_to_video' ? (
                        <div {...getRootProps()} className={`flex flex-col items-center justify-center w-full p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors ${isDragActive ? 'border-primary' : ''}`}>
                            <input {...getInputProps()} />
                            {inputImage ? (
                                <Image src={inputImage} alt="Input preview" width={200} height={112} className="rounded-md object-cover"/>
                            ) : (
                                <div className="text-center">
                                    <Upload className="w-10 h-10 text-muted-foreground mx-auto" />
                                    <p className="mt-2 text-sm text-center text-muted-foreground">
                                        Drag & drop an image, or click to upload
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : null}

                     <Textarea 
                        placeholder="Enter your creative prompt here..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={5}
                    />

                    <div>
                        <Label htmlFor="enhancer">Prompt Enhancer</Label>
                        <Textarea id="enhancer" placeholder="AI-enhanced prompt will appear here..." value={enhancedPrompt} readOnly rows={3} className="mt-1 bg-muted/50" />
                    </div>

                    <div>
                        <Label>Model</Label>
                        <Select value={model} onValueChange={setModel}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {generationType === 'text_to_image' && <>
                                    <SelectItem value="sdxl">Stable Diffusion XL (sdxl)</SelectItem>
                                    <SelectItem value="sd15">Stable Diffusion 1.5 (sd15)</SelectItem>
                                    <SelectItem value="playground-v2">Playground v2</SelectItem>
                                </>}
                                {generationType === 'text_to_video' && <>
                                    <SelectItem value="videocrafter2">VideoCrafter 2</SelectItem>
                                    <SelectItem value="zeroscope">Zeroscope v2</SelectItem>
                                </>}
                                 {generationType === 'image_to_video' && <>
                                    <SelectItem value="modelscope">ModelScope I2V</SelectItem>
                                    <SelectItem value="animatediff">AnimateDiff</SelectItem>
                                </>}
                            </SelectContent>
                        </Select>
                    </div>

                    {generationType.includes('video') && (
                        <div>
                            <Label>Duration: {duration}s</Label>
                            <Slider value={[duration]} onValueChange={(v) => setDuration(v[0])} min={2} max={5} step={1} />
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    {!isLoading ? (
                        <Button className="w-full" onClick={handleGenerate} disabled={isLoading}>
                            <Wand2 className="mr-2" />
                            Generate Asset
                        </Button>
                    ) : (
                        <Button className="w-full" variant="destructive" onClick={handleStop}>
                            <StopCircle className="mr-2" />
                            Stop Generating
                        </Button>
                    )}
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Library /> Export</CardTitle>
                </CardHeader>
                 <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start" disabled={!generatedAsset}>
                        <Save className="mr-2" /> Save to Project
                    </Button>
                    <Button variant="outline" className="w-full justify-start" disabled={!generatedAsset}>
                        <Download className="mr-2" /> Download Asset
                    </Button>
                 </CardContent>
            </Card>
        </div>

        {/* --- RIGHT PANEL --- */}
        <div className="lg:col-span-2">
            <Tabs defaultValue="preview" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="storyboard" disabled={generationType === 'text_to_image'}>
                        <List className="mr-2" /> Storyboard
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="preview">
                    <Card className="mt-2">
                        <CardContent className="p-4">
                            <div className="aspect-video w-full bg-muted rounded-lg flex items-center justify-center">
                                {isLoading && <Loader2 className="h-12 w-12 animate-spin text-primary"/>}
                                {!isLoading && previewAssetUrl && isPreviewVideo && (
                                    <video src={previewAssetUrl} controls autoPlay loop className="w-full h-full rounded-lg" />
                                )}
                                {!isLoading && previewAssetUrl && !isPreviewVideo && (
                                    <img src={previewAssetUrl} alt="Generated asset" className="w-full h-full object-cover rounded-lg" />
                                )}
                                {!isLoading && !generatedAsset && (
                                    <p className="text-muted-foreground">Your generated asset will appear here</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="storyboard">
                     <Card className="mt-2">
                        <CardHeader>
                            <CardTitle>AI-Generated Storyboard</CardTitle>
                            <CardDescription>Review and edit the scenes for your video.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-96 pr-4">
                                <div className="space-y-4">
                                    {isLoading && storyboard.length === 0 && <div className="flex justify-center"><Loader2 className="animate-spin text-primary" /></div>}
                                    {storyboard.map(shot => (
                                        <div key={shot.shot_number} className="space-y-2">
                                            <Label>Shot {shot.shot_number}</Label>
                                            <Textarea defaultValue={shot.description} rows={2}/>
                                        </div>
                                    ))}
                                    {!isLoading && storyboard.length > 0 &&
                                        <Button variant="outline" size="sm">
                                            <Wand2 className="mr-2" /> Regenerate Descriptions
                                        </Button>
                                    }
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
