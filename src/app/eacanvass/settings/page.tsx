
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { Loader2, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Template {
    id: string;
    name: string;
    content: string;
}

const defaultTemplates: Omit<Template, 'id'>[] = [
    {
        name: 'Executor Introduction Letter',
        content: `Dear {{executorName}},\n\nI am writing to you with my deepest condolences following the recent passing of {{deceasedName}}.\n\nMy name is [Your Name] and I am a local property specialist with [Your Agency Name]. I understand this is a difficult time, and when you are ready, I would be pleased to provide a complimentary, no-obligation market appraisal for the property at {{propertyAddress}}.\n\nWe offer a sensitive and discreet service to assist with all property matters during probate.\n\nYours sincerely,\n[Your Name]\n[Your Agency Name]`
    },
    {
        name: 'Solicitor Partnership Letter',
        content: `Dear [Solicitor Contact],\n\nMy name is [Your Name] from [Your Agency Name]. We specialise in providing prompt, accurate, and RICS-compliant probate valuations for properties in the Bradford area.\n\nWe understand the importance of an efficient and professional service for your clients during the probate process. We would be delighted to partner with your firm to assist with any property requirements.\n\nWe are currently instructed on the estate of {{deceasedName}} and would be happy to discuss how we can assist your team.\n\nYours faithfully,\n[Your Name]\n[Your Agency Name]`
    }
];

export default function CanvassSettingsPage() {
    const { user } = useAuth();
    const { firestore } = useFirebase();
    const { toast } = useToast();

    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user || !firestore) return;
        
        setIsLoading(true);
        const fetchTemplates = async () => {
            const fetchedTemplates: Template[] = [];
            let templatesAreDefaults = false;
            for (const dt of defaultTemplates) {
                const templateId = dt.name.toLowerCase().replace(/ /g, '-');
                const docRef = doc(firestore, `users/${user.uid}/eaCanvassTemplates`, templateId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    fetchedTemplates.push({ id: docSnap.id, ...docSnap.data() } as Template);
                } else {
                    // Pre-populate if it doesn't exist
                    const newTemplate = { name: dt.name, content: dt.content };
                    await setDoc(docRef, newTemplate);
                    fetchedTemplates.push({ id: templateId, ...newTemplate });
                    templatesAreDefaults = true;
                }
            }
            setTemplates(fetchedTemplates);
            if (fetchedTemplates.length > 0) {
                setSelectedTemplate(fetchedTemplates[0]);
            }
             if (templatesAreDefaults) {
                toast({ title: 'Welcome!', description: 'We\'ve added some default letter templates for you.'});
            }
            setIsLoading(false);
        };

        fetchTemplates();
    }, [user, firestore, toast]);

    const handleSaveTemplate = async () => {
        if (!user || !selectedTemplate || !firestore) return;
        setIsLoading(true);
        const docRef = doc(firestore, `users/${user.uid}/eaCanvassTemplates`, selectedTemplate.id);
        try {
            await setDoc(docRef, { name: selectedTemplate.name, content: selectedTemplate.content });
            toast({ title: 'Template Saved', description: `"${selectedTemplate.name}" has been updated.` });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };
    
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: 'Copied to clipboard!'});
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Letter Templates</CardTitle>
                    <CardDescription>Manage your outreach letter templates. Use the merge fields to auto-populate lead data.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center h-48">
                            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                {templates.map(template => (
                                    <Button key={template.id} variant={selectedTemplate?.id === template.id ? 'default' : 'outline'} onClick={() => setSelectedTemplate(template)}>
                                        {template.name}
                                    </Button>
                                ))}
                            </div>
                            
                            {selectedTemplate && (
                                <div className="p-4 border rounded-lg">
                                    <Label htmlFor="template-content" className="text-sm font-semibold">{selectedTemplate.name}</Label>
                                    <div className="my-2 flex flex-wrap gap-1">
                                        {['{{deceasedName}}', '{{propertyAddress}}', '{{executorName}}', '{{agencyName}}'].map(field => (
                                            <Badge variant="secondary" key={field} className="font-mono cursor-pointer" onClick={() => copyToClipboard(field)}>
                                                {field} <Copy className="w-3 h-3 ml-2" />
                                            </Badge>
                                        ))}
                                    </div>
                                    <Textarea 
                                        id="template-content"
                                        value={selectedTemplate.content}
                                        onChange={(e) => setSelectedTemplate(st => st ? {...st, content: e.target.value} : null)}
                                        rows={12}
                                        className="font-mono text-xs"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSaveTemplate} disabled={isLoading || !selectedTemplate}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Template
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Agency &amp; Export Settings</CardTitle>
                    <CardDescription>Configure your agency details and default export settings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="agencyName">Agency Name</Label>
                        <Input id="agencyName" placeholder="Your Agency Name" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="agencyFooter">Letter Footer Text</Label>
                        <Input id="agencyFooter" placeholder="e.g., 123 High Street, Bradford, BD1 1AA | 01274 123456" />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button disabled>Save Settings</Button>
                </CardFooter>
            </Card>
        </div>
    );
}
