
'use client';

import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
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

export default function FloorPlanMaestroPage() {
  const router = useRouter();
  const [showExitDialog, setShowExitDialog] = useState(false);

  return (
    <AppLayout>
       <div className="flex items-center gap-4 mb-2">
          
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">Floor Plan Maestro</h1>
        </div>
        <p className="text-muted-foreground mb-8">Generate stunning 2D & 3D floor plans.</p>
        <Card>
            <CardHeader>
                <CardTitle>Editor Under Construction</CardTitle>
                <CardDescription>The floor plan editor is currently being rebuilt to resolve a technical issue. It will be available shortly.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>We are working on a more stable and reliable version of the editor. Thank you for your patience.</p>
            </CardContent>
        </Card>
       <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to return to the dashboard?
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
