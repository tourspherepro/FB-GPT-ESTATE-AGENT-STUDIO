
'use client';

import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  Phone,
  CalendarCheck,
  CircleAlert,
  Play,
  Pause,
  Loader2,
  FileUp,
  Settings,
  List,
  Clapperboard,
  BookUser,
  Power,
  Server,
  HeartPulse,
  Info,
  Clock,
  Code,
  Copy,
  Terminal,
  RefreshCcw,
} from 'lucide-react';
import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';

// --- Mock Data (to be replaced with Firestore data) ---

const mockStats = {
  callsToday: 128,
  bookingsToday: 14,
  pendingLeads: 256,
  failedCalls: 9,
};

const mockRecentBookings = [
  { id: 1, customer: 'Alice Johnson', address: '456 Oak Avenue', dateTime: '2024-07-29 10:00', source: 'Excel', status: 'Booked' },
  { id: 2, customer: 'Bob Williams', address: '789 Pine Street', dateTime: '2024-07-29 14:30', source: 'Portal', status: 'Booked' },
  { id: 3, customer: 'Charlie Brown', address: '101 Maple Drive', dateTime: '2024-07-30 11:00', source: 'Outlook', status: 'Booked' },
];

const mockConversionFunnel = [
  { stage: 'Total Leads', value: 400, color: 'bg-sky-500' },
  { stage: 'Attempted', value: 300, color: 'bg-blue-500' },
  { stage: 'Contacted', value: 150, color: 'bg-indigo-500' },
  { stage: 'Booked', value: 50, color: 'bg-violet-500' },
  { stage: 'No Answer', value: 100, color: 'bg-purple-500' },
  { stage: 'Not Interested', value: 50, color: 'bg-fuchsia-500' },
];

const mockAltoJobs = [
    { id: 'job-xyz-123', type: 'Book Slot', status: 'done', requestedTime: '2024-07-30T10:00:00Z', result: { success: true, reason: '' } },
    { id: 'job-abc-456', type: 'Check Slot', status: 'pending', requestedTime: '2024-07-30T14:30:00Z', result: null },
    { id: 'job-def-789', type: 'Book Slot', status: 'error', requestedTime: '2024-07-30T11:00:00Z', result: { success: false, reason: 'slot_conflict' } },
    { id: 'job-ghi-012', type: 'Book Slot', status: 'in_progress', requestedTime: '2024-07-30T09:00:00Z', result: null },
];

const mockAgentStatus = {
    online: true,
    version: '1.2.1',
    lastHeartbeat: new Date().toISOString(),
    errorsToday: 1,
};

const mockErrorLogs = [
    "[ERROR] Failed to populate text field 'contact_name' on appointment modal.",
    "[ERROR] Timeout waiting for element '#diary-view'.",
    "[FATAL] Alto browser window not found.",
    "[WARN] Slot '14:30' was already booked.",
    "[ERROR] Unhandled exception during 'CreateAppointment' subflow.",
];


type CampaignStatus = 'idle' | 'running' | 'paused';


// --- UI Components ---

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <div className="text-muted-foreground">{icon}</div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

const ConversionFunnel = () => (
  <Card>
    <CardHeader>
      <CardTitle>Call Conversion Funnel</CardTitle>
      <CardDescription>Visual representation of lead progression through the campaign.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {mockConversionFunnel.map(item => (
        <div key={item.stage}>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-muted-foreground">{item.stage}</span>
            <span>{item.value}</span>
          </div>
          <Progress value={(item.value / mockConversionFunnel[0].value) * 100} className="h-2 [&>div]:bg-primary" />
        </div>
      ))}
    </CardContent>
  </Card>
);

const DashboardTab = () => {
    const [campaignStatus, setCampaignStatus] = useState<CampaignStatus>('idle');
    const [isStarting, setIsStarting] = useState(false);

    const handleToggleCampaign = () => {
        if (campaignStatus === 'running') {
            setCampaignStatus('paused');
        } else {
            setIsStarting(true);
            setTimeout(() => {
                setCampaignStatus('running');
                setIsStarting(false);
            }, 1500);
        }
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Calls Today" value={mockStats.callsToday} icon={<Phone className="h-4 w-4" />} />
                <StatCard title="Bookings Today" value={mockStats.bookingsToday} icon={<CalendarCheck className="h-4 w-4" />} />
                <StatCard title="Pending Leads" value={mockStats.pendingLeads} icon={<Users className="h-4 w-4" />} />
                <StatCard title="Failed Calls" value={mockStats.failedCalls} icon={<CircleAlert className="h-4 w-4 text-destructive" />} />
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                 <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Campaign Status</CardTitle>
                        <CardDescription>Control and monitor the AI calling campaign in real-time.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center space-y-4">
                         <Button
                            size="lg"
                            className="w-full"
                            onClick={handleToggleCampaign}
                            disabled={isStarting}
                         >
                            {isStarting ? (
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            ) : campaignStatus === 'running' ? (
                                <Pause className="mr-2 h-5 w-5" />
                            ) : (
                                <Play className="mr-2 h-5 w-5" />
                            )}
                            {isStarting ? 'Starting...' : campaignStatus === 'running' ? 'Pause Campaign' : 'Start Campaign'}
                        </Button>
                        <div className="text-sm text-muted-foreground pt-4 text-center">
                            <p>Status: <span className={`capitalize font-semibold ${campaignStatus === 'running' ? 'text-green-500' : campaignStatus === 'paused' ? 'text-amber-500' : 'text-gray-500'}`}>{campaignStatus}</span></p>
                            {campaignStatus === 'running' && <p className="mt-1">Now Dialling: <span className="font-semibold text-foreground">Laura Williams (07123...)</span></p>}
                        </div>
                    </CardContent>
                </Card>
                <div className="lg:col-span-2">
                    <ConversionFunnel />
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Recent Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead>Date/Time</TableHead>
                            <TableHead>Source</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {mockRecentBookings.map((booking) => (
                            <TableRow key={booking.id}>
                                <TableCell className="font-medium">{booking.customer}</TableCell>
                                <TableCell>{booking.address}</TableCell>
                                <TableCell>{booking.dateTime}</TableCell>
                                <TableCell>{booking.source}</TableCell>
                                <TableCell><Badge>{booking.status}</Badge></TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

const AltoIntegrationPage = () => {
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'done': return <Badge variant="secondary" className="bg-green-100 text-green-800">Done</Badge>;
            case 'pending': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
            case 'in_progress': return <Badge variant="secondary" className="bg-blue-100 text-blue-800 animate-pulse">In Progress</Badge>;
            case 'error': return <Badge variant="destructive">Error</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Alto Job Queue</CardTitle>
                        <CardDescription>Real-time status of automation jobs sent to the Alto Power Automate agent.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Job ID</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Requested</TableHead>
                                    <TableHead>Result</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mockAltoJobs.map(job => (
                                    <TableRow key={job.id}>
                                        <TableCell className="font-mono text-xs">{job.id}</TableCell>
                                        <TableCell>{job.type}</TableCell>
                                        <TableCell>{getStatusBadge(job.status)}</TableCell>
                                        <TableCell>{new Date(job.requestedTime).toLocaleTimeString()}</TableCell>
                                        <TableCell className="text-xs">{job.result?.success ? 'Success' : job.result?.reason || 'N/A'}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm">Re-run</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Test Tools</CardTitle>
                        <CardDescription>Manually trigger agent actions to test the connection to Alto.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 space-y-2">
                             <Button className="w-full">Test Check Slot</Button>
                             <Button className="w-full">Test Book Slot</Button>
                        </div>
                        <div className="flex-1">
                             <Textarea readOnly value="[LOG] Awaiting test command..." className="h-full bg-slate-100 dark:bg-slate-800 font-mono text-xs" />
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-1 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <div className={`w-3 h-3 rounded-full ${mockAgentStatus.online ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                            Agent Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Status:</span>
                            <span className={`font-semibold ${mockAgentStatus.online ? 'text-green-600' : 'text-red-600'}`}>{mockAgentStatus.online ? 'Online' : 'Offline'}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Version:</span>
                            <span>v{mockAgentStatus.version}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Last Heartbeat:</span>
                            <span>{new Date(mockAgentStatus.lastHeartbeat).toLocaleTimeString()}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Errors Today:</span>
                            <span>{mockAgentStatus.errorsToday}</span>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Troubleshooting</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div>
                            <h4 className="text-sm font-semibold mb-2">Last 5 Errors</h4>
                             <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-md font-mono text-xs text-red-500 space-y-1 h-32 overflow-y-auto">
                                {mockErrorLogs.map((log, i) => <p key={i}>{log}</p>)}
                            </div>
                        </div>
                        <Button variant="outline" className="w-full" onClick={() => navigator.clipboard.writeText(mockErrorLogs.join('\n'))}>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Logs
                        </Button>
                        <div>
                            <h4 className="text-sm font-semibold mb-2">Restart Agent</h4>
                            <p className="text-xs text-muted-foreground">
                                1. Open Power Automate on the Alto PC.
                                2. Stop the 'EACaller-Main-Flow'.
                                3. Relaunch the flow in run mode.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};


const PlaceholderPage = ({ title }: { title: string }) => (
    <Card>
        <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>This section is under construction.</CardDescription>
        </CardHeader>
        <CardContent className="h-96 flex items-center justify-center">
            <p className="text-muted-foreground">Coming Soon</p>
        </CardContent>
    </Card>
)

export default function EACallerPage() {

  return (
    <AppLayout>
      <div className="flex items-center gap-4 mb-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">AI Voice Caller</h1>
      </div>
      <p className="text-muted-foreground mb-8">Manage your AI-powered outbound calling agent.</p>

      <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-1 md:grid-cols-7 bg-card border mb-6 h-auto flex-wrap">
                <TabsTrigger value="dashboard"><Clapperboard className="w-4 h-4 mr-2" />Dashboard</TabsTrigger>
                <TabsTrigger value="lead-queue"><List className="w-4 h-4 mr-2" />Lead Queue</TabsTrigger>
                <TabsTrigger value="live-campaign"><Play className="w-4 h-4 mr-2" />Live Campaign</TabsTrigger>
                <TabsTrigger value="call-logs"><Phone className="w-4 h-4 mr-2" />Call Logs</TabsTrigger>
                <TabsTrigger value="appointments"><BookUser className="w-4 h-4 mr-2" />Appointments</TabsTrigger>
                <TabsTrigger value="settings"><Settings className="w-4 h-4 mr-2" />Settings</TabsTrigger>
                <TabsTrigger value="alto-integration"><Server className="w-4 h-4 mr-2" />Alto Integration</TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard">
                <DashboardTab />
            </TabsContent>
            <TabsContent value="lead-queue">
                <PlaceholderPage title="Lead Queue" />
            </TabsContent>
             <TabsContent value="live-campaign">
                <PlaceholderPage title="Live Campaign" />
            </TabsContent>
             <TabsContent value="call-logs">
                <PlaceholderPage title="Call Logs" />
            </TabsContent>
            <TabsContent value="appointments">
                <PlaceholderPage title="Appointments" />
            </TabsContent>
            <TabsContent value="settings">
                <PlaceholderPage title="Settings" />
            </TabsContent>
             <TabsContent value="alto-integration">
                <AltoIntegrationPage />
            </TabsContent>
        </Tabs>
    </AppLayout>
  );
}
