
'use client';

import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Wand2, Send, Loader2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { genericChat, ChatMessage } from '@/ai/flows/generic-chat';

const suggestions = [
  'Generate a social caption for a new property',
  'Summarize my latest listing',
  'What’s trending in my area?',
  'Draft an email to a potential buyer',
];

export function AICopilotPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input;
    if (!text.trim()) return;

    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const result = await genericChat(newMessages);
      setMessages(prev => [...prev, result]);
    } catch (error) {
        setMessages(prev => [...prev, { role: 'model', content: "Sorry, I encountered an error. Please try again."}]);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg z-50 animate-glow-pulse">
          <Wand2 className="h-7 w-7" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] p-0 flex flex-col">
        <SheetHeader className="p-6 pb-2">
          <SheetTitle className="flex items-center gap-2">
            <Wand2 className="text-primary" />
            AI Copilot
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1 px-6">
            <div className="space-y-4">
                {messages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`rounded-lg px-4 py-2 max-w-[80%] ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                           <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                         <div className="rounded-lg px-4 py-2 bg-muted flex items-center">
                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                        </div>
                    </div>
                )}
            </div>
        </ScrollArea>
        <div className="p-6 border-t bg-background">
            <div className="grid grid-cols-2 gap-2 mb-4">
                {suggestions.map((s) => (
                    <Button key={s} variant="outline" size="sm" className="text-xs h-auto py-1.5" onClick={() => handleSendMessage(s)}>
                        {s}
                    </Button>
                ))}
            </div>
          <div className="relative">
            <Textarea
              placeholder="Ask AI to help with listings, descriptions, or valuations…"
              className="pr-20"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-2.5 bottom-2.5"
              onClick={() => handleSendMessage()}
              disabled={isLoading || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
