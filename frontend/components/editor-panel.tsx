'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ContentTab from './editor-tabs/content-tab';
import SettingsTab from './editor-tabs/settings-tab';

export default function EditorPanel({
  versionId,
}: {
  versionId: string;
}) {
  return (
    <div className="w-full flex flex-col h-full overflow-hidden">
      {/* Tabs */}
      <Tabs defaultValue="content" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full justify-start px-4 py-3 h-auto border-b border-border rounded-none bg-transparent">
          <TabsTrigger value="content" className="text-sm font-medium">
            Content
          </TabsTrigger>
          <TabsTrigger value="design" className="text-sm font-medium">
            Design & Settings
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto">
          <TabsContent
            value="content"
            className="p-4 space-y-4 m-0"
            forceMount
          >
            <ContentTab versionId={versionId} />
          </TabsContent>

          <TabsContent
            value="design"
            className="p-4 space-y-4 m-0"
            forceMount
          >
            <SettingsTab versionId={versionId} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
