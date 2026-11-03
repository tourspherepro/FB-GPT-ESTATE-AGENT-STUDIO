'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/app-layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Loader2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

// Extend browser for Speech API
declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

// Placeholder API call
async function sendCommandToOutlook(data: { command: string; payload: object }) {
  console.log('Sending command:', data);

  try {
    const res = await fetch('/api/outlook-voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    return res.json();
  } catch (error) {
    console.warn('API placeholder failed:', error);
    return { success: true, placeholder: true, data };
  }
}

export default function OutlookVoiceAssistantPage() {
  const { toast } = useToast();
  const [isSupported, setIsSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState('Idle');
  const [lastCommand, setLastCommand] = useState('');
  const [apiResult, setApiResult] = useState<any | null>(null);

  const recognitionRef = useRef<any>(null);

  // Check browser compatibility
  useEffect(() => {
    if (typeof window !== 'undefined' && !('webkitSpeechRecognition' in window)) {
      setIsSupported(false);
      toast({
        variant: 'destructive',
        title: 'Voice Not Supported',
        description: 'Use Google Chrome on desktop to enable voice commands.',
      });
    }
  }, [toast]);

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setStatus('Stopped');
  };

  const handleCommand = async (spoken: string) => {
    const cmd = spoken.toLowerCase().trim();
    setLastCommand(cmd);

    let command = '';
    const payload = {};

    if (cmd.includes('next')) command = 'nextEmail';
    else if (cmd.includes('previous') || cmd.includes('back')) command = 'previousEmail';
    else if (cmd.includes('read')) command = 'readEmail';
    else if (cmd.includes('reply')) command = 'reply';
    else if (cmd.includes('delete')) command = 'delete';
    else if (cmd.includes('stop')) {
      stopListening();
      setStatus('Stopped by command');
      return;
    } else {
      setStatus(`Unknown command: “${cmd}”`);
      return;
    }

    setStatus(`Sending command: ${command}`);

    const result = await sendCommandToOutlook({ command, payload });
    setApiResult(result);

    if (result?.error) setStatus('Error sending command');
    else setStatus(`Command sent: ${command}`);
  };

  const startListening = () => {
    if (!isSupported || isListening) return;

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setStatus('Listening...');
    };

    recognition.onresult = (event: any) => {
      const spoken = event.results[event.resultIndex][0].transcript.trim();
      handleCommand(spoken);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech Error', event.error);
      stopListening();
      setStatus(`Error: ${event.error}`);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (status === 'Listening...') setStatus('Stopped');
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-8">

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white shadow-lg"
        >
          <h1 className="text-3xl font-bold">Outlook Voice Assistant</h1>
          <p className="mt-2 text-slate-300">
            Voice-controlled Outlook tools — navigate, read, reply, and delete emails hands-free.
          </p>

          <div className="mt-4 flex items-center gap-3">
            <Badge variant="outline" className="border-slate-600 bg-slate-900/40 text-slate-100">
              Beta Release
            </Badge>
            <span className="text-xs text-slate-300">
              Commands: next, previous, read, reply, delete, stop
            </span>
          </div>
        </motion.div>

        {/* GRID */}
        <div className="grid gap-6 md:grid-cols-2">

          {/* LEFT SIDE — Voice Controls */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Voice Controls</CardTitle>
              <CardDescription>
                Use your microphone to control Outlook through simple voice commands.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Buttons */}
              <div className="flex gap-4 flex-wrap">
                <Button
                  size="lg"
                  onClick={startListening}
                  disabled={isListening || !isSupported}
                >
                  <Mic className="mr-2 h-4 w-4" />
                  Start Listening
                </Button>

                <Button
                  size="lg"
                  variant="destructive"
                  onClick={stopListening}
                  disabled={!isListening}
                >
                  <MicOff className="mr-2 h-4 w-4" />
                  Stop
                </Button>
              </div>

              {/* Live Indicator */}
              {isListening && (
                <div className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-700">
                  <span className="mr-2 h-2 w-2 animate-ping rounded-full bg-emerald-500"></span>
                  Listening for commands...
                </div>
              )}

              <div className="mt-4 rounded-lg border bg-slate-50 p-4">
                <p className="text-sm text-slate-600 mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Example commands:
                </p>
                <div className="flex flex-wrap gap-2">
                  {['next email', 'previous email', 'read email', 'reply', 'delete email', 'stop'].map(
                    (cmd) => (
                      <code
                        key={cmd}
                        className="rounded bg-white px-2 py-1 text-xs text-slate-700 shadow-sm"
                      >
                        “{cmd}”
                      </code>
                    )
                  )}
                </div>
              </div>
            </CardContent>

            {isListening && (
              <CardFooter className="border-t bg-slate-50">
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
                <span className="text-xs text-slate-600">Voice engine active</span>
              </CardFooter>
            )}
          </Card>

          {/* RIGHT SIDE – Console */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Console Output</CardTitle>
              <CardDescription>Status, last command, and debug logs.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-24 text-xs text-muted-foreground">Status</span>
                  <Badge>{status}</Badge>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-24 text-xs text-muted-foreground">Last Command</span>
                  <span className="font-mono text-xs">{lastCommand || '—'}</span>
                </div>
              </div>

              <div>
                <p className="text-xs mb-1 text-muted-foreground">Debug Output</p>
                <pre className="h-56 overflow-auto rounded-md bg-muted p-3 text-xs">
                  {apiResult ? JSON.stringify(apiResult, null, 2) : 'Waiting for command...'}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
