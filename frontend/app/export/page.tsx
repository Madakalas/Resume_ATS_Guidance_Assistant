'use client';

import { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/sidebar';
import { BackButton } from '@/components/back-button';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Download, Trash2, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import ResumePreview from '@/components/resume-preview';
import { toastSectionAdded } from '@/lib/toast-helpers';

interface ExportRecord {
  id: string;
  resumeName: string;
  versionName: string;
  timestamp: Date;
  format: string;
}

export default function ExportPage() {
  const store = useStore();
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null); // hidden unscaled capture target
  const [mounted, setMounted] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState(store.resumes[0]?.id || '');
  const [selectedVersionId, setSelectedVersionId] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [atsSafeMode, setAtsSafeMode] = useState(false);
  const [exportHistory, setExportHistory] = useState<ExportRecord[]>([]);
  const [previewZoom, setPreviewZoom] = useState(100);

  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedResume = store.resumes.find((r) => r.id === selectedResumeId);
  const versions = selectedResumeId ? store.getResumeVersions(selectedResumeId) : [];
  const selectedVersion = selectedVersionId ? versions.find((v) => v.id === selectedVersionId) : null;

  if (!selectedVersionId && versions.length > 0) {
    setSelectedVersionId(versions[0].id);
  }

  const handleExport = async (format: 'pdf' | 'docx' = 'pdf') => {
    if (!selectedVersion || !selectedResumeId || !selectedResume) return;
    setIsExporting(true);
    try {
      if (format === 'pdf') {
        // Use captureRef (hidden, unscaled) — not the zoomed visible preview
        const captureEl = captureRef.current;
        if (captureEl) {
          const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
            import('html2canvas'),
            import('jspdf'),
          ]);

          const paperW = selectedVersion.settings.paperSize === 'Letter' ? 215.9 : 210;
          const paperH = selectedVersion.settings.paperSize === 'Letter' ? 279.4 : 297;
          const MM_TO_PX = 3.7795;
          const pageWpx = Math.round(paperW * MM_TO_PX);
          const pageHpx = Math.round(paperH * MM_TO_PX);
          const RENDER_SCALE = 2.5; // ~240dpi for crisp, aligned text

          const pdf = new jsPDF('p', 'mm', paperW === 215.9 ? [215.9, 279.4] : 'a4', true);

          const paperPages = Array.from(captureEl.querySelectorAll('[data-resume-paper]')) as HTMLElement[];
          const pagesToRender = paperPages.length > 0 ? paperPages : [captureEl];

          for (let p = 0; p < pagesToRender.length; p++) {
            if (p > 0) pdf.addPage();
            const canvas = await html2canvas(pagesToRender[p], {
              scale: RENDER_SCALE,
              useCORS: true,
              logging: false,
              backgroundColor: '#ffffff',
              width: pageWpx,
              height: pageHpx,
            });
            const flat = document.createElement('canvas');
            flat.width = canvas.width;
            flat.height = canvas.height;
            const ctx = flat.getContext('2d')!;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, flat.width, flat.height);
            ctx.drawImage(canvas, 0, 0);
            pdf.addImage(flat.toDataURL('image/jpeg', 0.90), 'JPEG', 0, 0, paperW, paperH, '', 'FAST');
          }

          const fileName = `${selectedResume.name.replace(/[^\w\s-.]/gi, '_')}.pdf`;
          const blob = pdf.output('blob');
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          store.addExportRecord(selectedResumeId, selectedVersionId, 'pdf', fileName);
          toastSectionAdded('Resume exported successfully');
        } else {
          toastSectionAdded('Select a version and try again.');
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const fileName = `${selectedResume.name}-DOCX.docx`;
        store.addExportRecord(selectedResumeId, selectedVersionId, 'docx', fileName);
        toastSectionAdded('DOCX export is not implemented yet. Use PDF.');
      }
    } catch (e) {
      console.error('Export failed:', e);
      toastSectionAdded('Export failed. Try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteExport = (id: string) => {
    setExportHistory(exportHistory.filter((item) => item.id !== id));
  };

  return (
    <div className="flex h-screen bg-background">
      <div className="w-64 border-r border-border bg-sidebar">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
            <BackButton breadcrumb="Dashboard" />
            <h1 className="text-3xl font-bold text-foreground">Export Center</h1>
            <p className="text-sm text-muted-foreground mt-1">Generate PDF exports with ATS optimization</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            <div className="border rounded-lg p-6 space-y-4">
              <h2 className="text-lg font-semibold">Export Settings</h2>

              <div>
                <Label className="text-sm mb-2 block">Select Resume</Label>
                <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {store.resumes.map((resume) => (
                      <SelectItem key={resume.id} value={resume.id}>
                        {resume.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm mb-2 block">Select Version</Label>
                <Select value={selectedVersionId} onValueChange={setSelectedVersionId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {versions.map((version) => (
                      <SelectItem key={version.id} value={version.id}>
                        {version.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded">
                <Label htmlFor="ats-safe" className="text-sm cursor-pointer">
                  ATS Safe Mode
                </Label>
                <Switch
                  id="ats-safe"
                  checked={atsSafeMode}
                  onCheckedChange={setAtsSafeMode}
                />
              </div>

              <Button
                onClick={() => handleExport()}
                disabled={!selectedVersion || isExporting}
                className="w-full"
                size="lg"
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export as PDF'}
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted p-4 border-b">
                <h3 className="font-semibold text-sm">Export History</h3>
              </div>
              {exportHistory.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No exports yet. Export your resume above to see history.
                </div>
              ) : (
                <div className="divide-y">
                  {exportHistory.map((record) => (
                    <div key={record.id} className="p-4 flex items-center justify-between hover:bg-muted/50">
                      <div>
                        <p className="font-medium text-sm">{record.resumeName}</p>
                        <p className="text-xs text-muted-foreground">{record.versionName}</p>
                        <p className="text-xs text-muted-foreground">
                          {record.timestamp.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" disabled>
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteExport(record.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 border rounded-lg p-4 h-fit">
            {!mounted ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                Loading preview…
              </div>
            ) : selectedVersion ? (
              <>
                <div className="flex items-center justify-end gap-2 mb-3">
                  <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/50 p-0.5">
                    <button type="button" onClick={() => setPreviewZoom(z => Math.max(50, z - 25))} className="p-1.5 rounded hover:bg-muted text-muted-foreground" title="Zoom out" aria-label="Zoom out">
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-medium min-w-[3rem] text-center">{previewZoom}%</span>
                    <button type="button" onClick={() => setPreviewZoom(z => Math.min(150, z + 25))} className="p-1.5 rounded hover:bg-muted text-muted-foreground" title="Zoom in" aria-label="Zoom in">
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div ref={previewContainerRef} className="overflow-auto flex justify-center" style={{ transform: `scale(${previewZoom / 100})`, transformOrigin: 'top center' }}>
                  <ResumePreview version={selectedVersion} />
                </div>
                {/* Hidden capture target — unscaled, used by PDF export */}
                <div ref={captureRef} style={{ position: 'absolute', top: 0, left: 0, opacity: 0, pointerEvents: 'none', zIndex: -1 }}>
                  <ResumePreview version={selectedVersion} />
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground text-sm py-8">
                Select a version to see preview
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
