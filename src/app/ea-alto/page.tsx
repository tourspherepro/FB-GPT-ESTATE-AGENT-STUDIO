
'use client';

import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function EaAltoPage() {

  return (
    <AppLayout>
       <div className="flex items-center gap-4 mb-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">EA-ALTO</h1>
        </div>
        <p className="text-muted-foreground mb-8">Synchronize property data with your Alto account.</p>
        <Card>
            <CardHeader>
                <CardTitle>Under Construction</CardTitle>
                <CardDescription>This tool is currently under construction.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>The EA-ALTO integration will allow you to seamlessly synchronize your property data between EASTUDIO and your Alto account. Stay tuned for updates!</p>
            </CardContent>
        </Card>
    </AppLayout>
  );
}
