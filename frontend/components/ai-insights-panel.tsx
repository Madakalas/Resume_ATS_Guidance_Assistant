'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lightbulb, MessageSquare, CheckCircle2 } from 'lucide-react';

const atsTips = [
  {
    id: '1',
    title: 'Use Standard Fonts',
    description: 'Stick to Arial, Calibri, or Times New Roman for maximum compatibility.',
  },
  {
    id: '2',
    title: 'Avoid Graphics',
    description: 'Skip images, charts, and fancy formatting. ATS systems read text only.',
  },
  {
    id: '3',
    title: 'Include Keywords',
    description: 'Match job description keywords naturally throughout your resume.',
  },
  {
    id: '4',
    title: 'Simple Structure',
    description: 'Use clear headings and bullet points for easy parsing by systems.',
  },
];

const mockChat = [
  {
    id: '1',
    role: 'assistant' as const,
    content: 'Hi! I can help you optimize your resume. What would you like to improve?',
  },
  {
    id: '2',
    role: 'user' as const,
    content: 'How can I improve my ATS score?',
  },
  {
    id: '3',
    role: 'assistant' as const,
    content: 'Great question! Make sure to use standard fonts, include relevant keywords, and keep your formatting simple.',
  },
];

export function AIInsightsPanel() {
  return (
    <div className="h-full flex flex-col bg-background border-l border-border">
      <Tabs defaultValue="insights" className="flex flex-col flex-1">
        <TabsList className="w-full rounded-none border-b border-border m-0 h-auto p-4 bg-background">
          <TabsTrigger value="insights" className="gap-2">
            <Lightbulb className="w-4 h-4" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Chat
          </TabsTrigger>
        </TabsList>

        {/* Insights Tab */}
        <TabsContent value="insights" className="flex-1 overflow-y-auto p-4 space-y-3">
          <div>
            <h3 className="text-sm font-semibold mb-3">ATS Optimization Tips</h3>
            <div className="space-y-2">
              {atsTips.map((tip) => (
                <div key={tip.id} className="p-3 bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors">
                  <p className="text-xs font-medium text-foreground mb-1">{tip.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{tip.description}</p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="flex-1 overflow-y-auto flex flex-col p-4">
          <div className="flex-1 space-y-3 mb-4">
            {mockChat.map((msg) => (
              <div
                key={msg.id}
                className={`text-xs p-2 rounded ${
                  msg.role === 'assistant'
                    ? 'bg-secondary text-secondary-foreground'
                    : 'bg-primary text-primary-foreground ml-4'
                }`}
              >
                {msg.content}
              </div>
            ))}
          </div>
          <input
            type="text"
            placeholder="Ask AI Assistant..."
            className="text-xs p-2 border border-input rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
