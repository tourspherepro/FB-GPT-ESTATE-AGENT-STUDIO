
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

export default function CreatePostPage() {
  const { user } = useAuth();
  const { firestore: db } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreatePost = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Not authenticated', description: 'You must be logged in to create a post.' });
      return;
    }
    if (!title || !content) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Please fill out both title and content.' });
      return;
    }
    if (!db) {
        toast({ variant: "destructive", title: "Error", description: "Database service is not available. Please try again later."});
        return;
    }
    
    setIsLoading(true);

    const postData = {
      title,
      content,
      authorId: user.uid,
      authorName: user.displayName || 'Anonymous',
      createdAt: serverTimestamp(),
    };
    
    const postsCollection = collection(db, 'posts');
    addDoc(postsCollection, postData)
      .then(() => {
        toast({ title: 'Post submitted!', description: 'Your new post has been created.' });
        router.push('/posts');
      })
      .catch(error => {
        const permissionError = new FirestorePermissionError({
            path: 'posts',
            operation: 'create',
            requestResourceData: postData,
        });
        errorEmitter.emit('permission-error', permissionError);
        // The listener will handle displaying the error.
      })
      .finally(() => {
         setIsLoading(false);
      });
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-4">
          
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">Create a New Post</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>New Post</CardTitle>
            <CardDescription>Fill in the details for your new post.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Your post title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your post content here..."
                rows={10}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleCreatePost} disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoading ? 'Creating...' : 'Create Post'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AppLayout>
  );
}
