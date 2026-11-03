

'use client';

import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, Wand2, Lightbulb, Loader2, X } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import React, { useState, useCallback } from 'react';
import { generateSocialVideo } from '@/ai/flows/generate-social-video';
import { generateSocialPost } from '@/ai/flows/generate-social-post';
import { useToast } from '@/hooks/use-toast';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { PostPreviewCard } from '@/components/post-preview-card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useRouter } from 'next/navigation';


// Mock data for AI ideas
const aiIdeas = {
  video: [
    'A fast-paced tour of a new property hitting the market.',
    'A "day in the life" of a real estate agent.',
    'Tips for first-time home buyers.',
    'Before and after of a staged room.',
  ],
  pictures: [
    'Showcase the best feature of a luxury listing.',
    'Create a carousel post of a kitchen transformation.',
    '"Guess the price" of this stunning home.',
    'Highlight a unique architectural detail.',
  ],
  everyday: [
    'Post a fun fact about the local area.',
    'Share a client testimonial with a photo.',
    'Ask a "this or that" question (e.g., open-plan vs. traditional).',
    'Share a quick tip for home maintenance.',
  ],
  competitions: [
    'Run a "tag a friend who is looking for a new home" giveaway.',
    'A photo contest for the best Christmas decorations in the neighborhood.',
    'A quiz about local landmarks with a prize.',
    'Partner with a local business for a joint giveaway.',
  ],
}

type IdeaCategory = keyof typeof aiIdeas;
type FileWithPreview = File & { preview: string };


export default function SocialsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [currentIdeas, setCurrentIdeas] = useState<string[]>([]);
    const [isLoadingIdeas, setIsLoadingIdeas] = useState(false);
    const [showExitDialog, setShowExitDialog] = useState(false);
    
    // Video state
    const [videoPrompt, setVideoPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [duration, setDuration] = useState(8); // Veo 3 default is 8s
    const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
    const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);

    // Picture post state
    const [postImages, setPostImages] = useState<FileWithPreview[]>([]);
    const [postCaption, setPostCaption] = useState('');
    const [previewImages, setPreviewImages] = useState<string[]>([]);
    const [previewCaption, setPreviewCaption] = useState('');

    // Everyday post state
    const [everydayText, setEverydayText] = useState('');
    const [isGeneratingPost, setIsGeneratingPost] = useState(false);
    const [everydayPreviewText, setEverydayPreviewText] = useState('');

    // Competition state
    const [competitionText, setCompetitionText] = useState('');
    const [competitionImage, setCompetitionImage] = useState<FileWithPreview | null>(null);
    const [competitionPreviewText, setCompetitionPreviewText] = useState('');
    const [competitionPreviewImage, setCompetitionPreviewImage] = useState<string | null>(null);


    const onDropPictures = useCallback((acceptedFiles: File[]) => {
        const filesWithPreview = acceptedFiles.map(file => Object.assign(file, {
          preview: URL.createObjectURL(file)
        }));
        setPostImages(prev => [...prev, ...filesWithPreview]);
      }, []);
    
      const { getRootProps: getPicturesRootProps, getInputProps: getPicturesInputProps } = useDropzone({
        onDrop: onDropPictures,
        accept: { 'image/*': [] },
      });

    const onDropCompetition = useCallback((acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const fileWithPreview = Object.assign(acceptedFiles[0], {
          preview: URL.createObjectURL(acceptedFiles[0])
        });
        setCompetitionImage(fileWithPreview);
      }
    }, []);
    
      const { getRootProps: getCompetitionRootProps, getInputProps: getCompetitionInputProps } = useDropzone({
        onDrop: onDropCompetition,
        accept: { 'image/*': [] },
        multiple: false,
      });
    
    const removeImage = (index: number) => {
        setPostImages(prev => prev.filter((_, i) => i !== index));
    };

    const getIdeas = (category: IdeaCategory) => {
        setIsLoadingIdeas(true);
        setCurrentIdeas([]);
        setTimeout(() => {
            setCurrentIdeas(aiIdeas[category]);
            setIsLoadingIdeas(false);
        }, 1000);
    }
    
    const handleGenerateVideo = async () => {
        if (!videoPrompt) {
            toast({
                variant: 'destructive',
                title: 'Prompt is required',
                description: 'Please enter a prompt to generate a video.',
            });
            return;
        }
        
        setIsGeneratingVideo(true);
        setGeneratedVideo(null);
        
        try {
            const result = await generateSocialVideo({
                prompt: videoPrompt,
                aspectRatio,
                durationSeconds: duration,
            });
            setGeneratedVideo(result.videoDataUri);
        } catch (error: any) {
            console.error('Video generation failed:', error);
            const errorMessage = error.message || 'An unexpected error occurred. Please try again.';
            
            if (errorMessage.includes('429')) {
                 toast({
                    variant: 'destructive',
                    title: 'Rate Limit Exceeded',
                    description: 'You have made too many requests. Please wait a while before trying again.',
                });
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Video Generation Failed',
                    description: errorMessage,
                });
            }
        } finally {
            setIsGeneratingVideo(false);
        }
    }

    const handleCreatePicturePost = () => {
        if (postImages.length === 0 && !postCaption) {
          toast({
            variant: 'destructive',
            title: 'Cannot create post',
            description: 'Please add at least one image or write a caption.',
          });
          return;
        }
        setPreviewImages(postImages.map(f => f.preview));
        setPreviewCaption(postCaption);
         toast({
            title: 'Post Created!',
            description: 'Your post preview has been updated.',
        });
      };
    
    const handleGenerateEverydayPost = async () => {
        if (!everydayText) {
          toast({ variant: 'destructive', title: 'Cannot generate post', description: 'Please write some text for your post idea.' });
          return;
        }
        setIsGeneratingPost(true);
        setEverydayPreviewText('');

        try {
            const result = await generateSocialPost({ prompt: everydayText });
            setEverydayPreviewText(result.post);
            toast({ title: 'Post Generated!', description: 'Your AI-powered post has been created.' });
        } catch (error: any) {
            console.error('Post generation failed:', error);
            toast({ variant: 'destructive', title: 'Generation Failed', description: 'Could not generate post. Please try again.'});
        } finally {
            setIsGeneratingPost(false);
        }
    };

    const handleCreateCompetitionPost = () => {
        if (!competitionText) {
          toast({ variant: 'destructive', title: 'Cannot create post', description: 'Please describe your competition.' });
          return;
        }
        setCompetitionPreviewText(competitionText);
        setCompetitionPreviewImage(competitionImage ? competitionImage.preview : null);
        toast({ title: 'Competition Launched!', description: 'Your competition post preview has been updated.' });
    };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-2">
            
            <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">Socials Suite</h1>
        </div>
        <p className="text-muted-foreground mb-8">Create, schedule, and get AI-powered ideas for your social media posts.</p>

        <Tabs defaultValue="video" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-card border">
                <TabsTrigger value="video">Video Post</TabsTrigger>
                <TabsTrigger value="pictures">Picture Post</TabsTrigger>
                <TabsTrigger value="everyday">Everyday Post</TabsTrigger>
                <TabsTrigger value="competitions">Competition</TabsTrigger>
                <TabsTrigger value="ideas">
                    <Lightbulb className="w-4 h-4 mr-2 text-yellow-400" />
                    AI Content Ideas
                </TabsTrigger>
            </TabsList>
            
            <TabsContent value="video" className="mt-6">
                <div className="grid md:grid-cols-2 gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>1. Design Your Video</CardTitle>
                            <CardDescription>Use AI to generate a video from a text prompt.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea 
                                placeholder="e.g., 'A cinematic drone shot of a modern house by the lake at sunset...'" 
                                rows={6}
                                value={videoPrompt}
                                onChange={(e) => setVideoPrompt(e.target.value)}
                                disabled={isGeneratingVideo}
                            />
                             <div className="grid grid-cols-2 gap-4">
                                <Select 
                                    defaultValue={aspectRatio}
                                    onValueChange={setAspectRatio}
                                    disabled={isGeneratingVideo || true} // Veo 3 doesn't support aspect ratio changes in this way
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Aspect Ratio" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select 
                                    defaultValue={String(duration)}
                                    onValueChange={(value) => setDuration(Number(value))}
                                    disabled={isGeneratingVideo || true} // Veo 3 duration is not configurable
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Duration" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="8">8 seconds</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" onClick={handleGenerateVideo} disabled={isGeneratingVideo}>
                                {isGeneratingVideo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                                {isGeneratingVideo ? 'Generating Video...' : 'Generate Video'}
                            </Button>
                        </CardFooter>
                    </Card>
                     <PostPreviewCard title="Video Preview" description="Your generated video will appear here.">
                        <div className="aspect-video w-full bg-muted rounded-lg flex items-center justify-center">
                            {isGeneratingVideo ? (
                                <div className="text-center text-muted-foreground p-4">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                                    <p className="mt-2 text-sm">Generating video... This can take up to a minute.</p>
                                </div>
                            ) : generatedVideo ? (
                                <video src={generatedVideo} controls className="w-full h-full rounded-lg" />
                            ) : (
                                <p className="text-sm text-muted-foreground">Preview</p>
                            )}
                        </div>
                    </PostPreviewCard>
                </div>
            </TabsContent>

            <TabsContent value="pictures" className="mt-6">
                <div className="grid md:grid-cols-2 gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>1. Create Your Post</CardTitle>
                            <CardDescription>Upload images and write your caption.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div {...getPicturesRootProps()} className="flex items-center justify-center w-full">
                                <label htmlFor="pictures-upload" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted/50 transition-colors">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                                    <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold text-primary">Click to upload</span> or drag and drop</p>
                                    </div>
                                    <input {...getPicturesInputProps()} id="pictures-upload" />
                                </label>
                            </div>
                            {postImages.length > 0 && (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                    {postImages.map((file, index) => (
                                        <div key={file.name} className="relative group aspect-square">
                                            <Image src={file.preview} alt={file.name} fill className="object-cover rounded-md" />
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                                                onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <Textarea 
                                placeholder="Write your caption here..." 
                                rows={4}
                                value={postCaption}
                                onChange={(e) => setPostCaption(e.target.value)}
                             />
                        </CardContent>
                        <CardFooter>
                           <Button className="w-full" onClick={handleCreatePicturePost}>Create Post</Button>
                        </CardFooter>
                    </Card>
                    <PostPreviewCard title="Picture Post Preview" description="A preview of your picture-based post.">
                        <div className="aspect-square w-full bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                            {previewImages.length > 0 ? (
                                <Image src={previewImages[0]} alt="Post preview" width={400} height={400} className="object-contain w-full h-full" />
                            ) : (
                                <p className="text-sm text-muted-foreground">Image Preview</p>
                            )}
                        </div>
                        {previewCaption && <p className="text-sm whitespace-pre-wrap pt-4">{previewCaption}</p>}
                    </PostPreviewCard>
                </div>
            </TabsContent>

            <TabsContent value="everyday" className="mt-6">
                 <div className="grid md:grid-cols-2 gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Create an Everyday Post</CardTitle>
                            <CardDescription>Give the AI a topic or idea to generate a post.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea 
                                placeholder="What's on your mind today? Share a market update, a quick tip, or a behind-the-scenes look..." 
                                rows={8} 
                                value={everydayText}
                                onChange={(e) => setEverydayText(e.target.value)}
                                disabled={isGeneratingPost}
                            />
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" onClick={handleGenerateEverydayPost} disabled={isGeneratingPost}>
                                {isGeneratingPost ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                                {isGeneratingPost ? 'Generating...' : 'Generate Post with AI'}
                            </Button>
                        </CardFooter>
                    </Card>
                    <PostPreviewCard title="AI-Generated Post Preview" description="A preview of your AI-generated post.">
                         {isGeneratingPost ? (
                            <div className="text-center text-muted-foreground p-4">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                                <p className="mt-2 text-sm">Generating post...</p>
                            </div>
                         ) : (
                            <p className="text-sm whitespace-pre-wrap">{everydayPreviewText || 'Your generated post text will appear here.'}</p>
                         )}
                    </PostPreviewCard>
                </div>
            </TabsContent>
            
            <TabsContent value="competitions" className="mt-6">
                <div className="grid md:grid-cols-2 gap-8">
                     <Card>
                        <CardHeader>
                            <CardTitle>Launch a Competition</CardTitle>
                            <CardDescription>Run a competition to boost engagement and reach.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea 
                                placeholder="Describe the competition rules, prize, and how to enter..." 
                                rows={8}
                                value={competitionText}
                                onChange={(e) => setCompetitionText(e.target.value)}
                            />
                            <div {...getCompetitionRootProps()} className="flex items-center justify-center w-full">
                                <label htmlFor="competition-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted/50 transition-colors">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    {competitionImage ? (
                                        <Image src={competitionImage.preview} alt="Prize" width={80} height={80} className="object-contain rounded-md" />
                                    ) : (
                                        <>
                                        <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground">Add a prize image (optional)</p>
                                        </>
                                    )}
                                    </div>
                                    <input {...getCompetitionInputProps()} id="competition-upload" />
                                </label>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" onClick={handleCreateCompetitionPost}>Launch Competition</Button>
                        </CardFooter>
                    </Card>
                    <PostPreviewCard title="Competition Preview" description="A preview of your competition announcement.">
                        {competitionPreviewImage && (
                            <div className="aspect-video w-full bg-muted rounded-lg flex items-center justify-center overflow-hidden mb-4">
                                <Image src={competitionPreviewImage} alt="Competition prize" width={400} height={225} className="object-contain w-full h-full" />
                            </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{competitionPreviewText || 'Your competition details will appear here.'}</p>
                    </PostPreviewCard>
                </div>
            </TabsContent>

             <TabsContent value="ideas" className="mt-6">
                <Card className="bg-card">
                    <CardHeader className="flex-row items-center justify-between">
                        <div className="space-y-1.5">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Lightbulb className="w-5 h-5 text-yellow-400" />
                                AI Content Ideas
                            </CardTitle>
                            <CardDescription>Get inspiration for your next post.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {(Object.keys(aiIdeas) as IdeaCategory[]).map(category => (
                            <div key={category} className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="capitalize font-semibold">{category}</h3>
                                    <Button variant="outline" size="sm" onClick={() => getIdeas(category)} disabled={isLoadingIdeas}>
                                        {isLoadingIdeas ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Get Ideas'}
                                    </Button>
                                </div>
                                {currentIdeas.length > 0 && (
                                    <ul className="space-y-3 list-disc pl-5 text-sm text-muted-foreground">
                                        {aiIdeas[category].map((idea, i) => <li key={i}>{idea}</li>)}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </TabsContent>

        </Tabs>
      </div>

      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Any unsaved changes will be lost. Are you sure you want to return to the dashboard?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push('/dashboard')}>
              Return to Dashboard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
