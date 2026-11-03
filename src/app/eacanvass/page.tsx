
'use client';

import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookUser } from 'lucide-react';

export default function EACanvassPage() {
  return (
    <AppLayout>
      <div className="flex items-center gap-4 mb-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline flex items-center gap-3">
          <BookUser className="w-8 h-8" /> EACanvass
        </h1>
      </div>
      <p className="text-muted-foreground mb-8">Generate and manage canvassing leads and materials.</p>
      <Card>
        <CardHeader>
          <CardTitle>Under Construction</CardTitle>
          <CardDescription>This tool is currently under construction.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>The EACanvass tool will help you identify, manage, and create materials for your canvassing efforts. Stay tuned for updates!</p>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
