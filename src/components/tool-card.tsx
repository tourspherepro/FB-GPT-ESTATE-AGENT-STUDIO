
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

interface ToolCardProps {
    name: string;
    description: string;
    href: string;
    icon: React.ReactNode;
}

export function ToolCard({ name, description, href, icon }: ToolCardProps) {
    return (
        <Link href={href} className="group block h-full">
            <Card className="h-full p-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-md rounded-2xl transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1 group-hover:shadow-blue-500/10 relative overflow-hidden">
                <div className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{
                    background: 'radial-gradient(300px at 50% 50%, rgba(45, 212, 191, 0.1), transparent 80%)'
                }}></div>
                <CardHeader className="p-0 items-start text-left relative z-10">
                     <div className="flex items-center justify-center w-10 h-10 mb-3 rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-500/20 text-cyan-500 transition-all duration-300 group-hover:bg-gradient-to-br group-hover:from-cyan-500 group-hover:to-blue-600 group-hover:text-white group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-blue-500/20">
                        {icon}
                    </div>
                </CardHeader>
                <CardContent className="p-0 text-left relative z-10">
                    <CardTitle className="text-md font-semibold text-slate-800 dark:text-slate-200">{name}</CardTitle>
                    <CardDescription className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</CardDescription>
                </CardContent>
            </Card>
        </Link>
    );
}
