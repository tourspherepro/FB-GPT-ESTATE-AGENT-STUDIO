
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PostPreviewCardProps {
    title: string;
    description: string;
    children: React.ReactNode;
}

export function PostPreviewCard({ title, description, children }: PostPreviewCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="border rounded-lg p-4 space-y-2 bg-background">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">EA</div>
                        <div>
                            <p className="font-semibold">estateagent.tools</p>
                            <p className="text-xs text-muted-foreground">Sponsored</p>
                        </div>
                    </div>
                    {children}
                </div>
            </CardContent>
        </Card>
    );
}
