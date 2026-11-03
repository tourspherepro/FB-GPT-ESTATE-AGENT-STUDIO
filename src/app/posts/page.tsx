
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { collection, query, orderBy, DocumentData } from 'firebase/firestore';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';

export interface Post {
  id?: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt?: any;
}

function PostsPageContent() {
  const router = useRouter();
  const { firestore } = useFirebase();

  const postsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'posts'), orderBy('createdAt', 'desc'));
  }, [firestore]);
  
  const { data: posts, isLoading, error } = useCollection<Post>(postsQuery);

  if (error) {
    // The global error listener will catch and display this, but we can have a fallback UI
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto text-center py-10">
          <h1 className="text-2xl font-bold text-destructive">Error Loading Posts</h1>
          <p className="text-muted-foreground">Could not retrieve posts due to a permission error.</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">All Posts</h1>
           <Button onClick={() => router.push('/create-post')}>
                Create New Post
            </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center mt-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !posts || posts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <p>No posts have been created yet.</p>
              <Button onClick={() => router.push('/create-post')} className="mt-4">
                Create the first post
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id}>
                <CardHeader>
                  <CardTitle>{post.title}</CardTitle>
                  <CardDescription className="flex items-center justify-between pt-1">
                    <span>
                      By: <Badge variant="secondary">{post.authorName}</Badge>
                    </span>
                    <span>
                      {post.createdAt?.toDate().toLocaleDateString()}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{post.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// No longer need the provider here as it's in the layout
export default function PostsPage() {
  return <PostsPageContent />;
}
