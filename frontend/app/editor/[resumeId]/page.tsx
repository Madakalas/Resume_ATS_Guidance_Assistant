'use client';

import { useState, useEffect, use, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { useEscapeBack } from '@/hooks/use-escape-back';
import { Button } from '@/components/ui/button';
import { Download, Copy, ChevronLeft, LayoutGrid, Pen, Sliders, ZoomIn, ZoomOut, RotateCcw, Save, GitBranch, X } from 'lucide-react';
import ResumePreview from '@/components/resume-preview';
import DesignTab from '@/components/editor-tabs/design-tab';
import ContentTab from '@/components/editor-tabs/content-tab';
import SectionsTab from '@/components/editor-tabs/sections-tab';

type Tab = 'content' | 'customization' | 'sections';

export default function EditorPage(props: { params: Promise<{ resumeId: string }> }) {
  const router = useRouter();
  const store = useStore();
  const { resumeId } = use(props.params);

  const [activeTab, setActiveTab] = useState<Tab>('content');
  const [previewWidth, setPreviewWidth] = useState(55);
  const [isDragging, setIsDragging] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(100);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // ── Version save prompt state ──────────────────────────────────────────────
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [saveVersionName, setSaveVersionName] = useState('');
  const [lastSavedHash, setLastSavedHash] = useState('');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissedRef = useRef(false);

  const resume = store.resumes.find(r => r.id === resumeId);
  const versions = resume ? store.getResumeVersions(resume.id) : [];
  const version = versions[0];

  // Hash current version content for change detection
  const getVersionHash = useCallback(() => {
    if (!version) return '';
    return JSON.stringify({ sections: version.sections, settings: version.settings });
  }, [version]);

  // Watch for changes and show save prompt after 5s of inactivity
  useEffect(() => {
    if (!mounted || !version) return;
    const currentHash = getVersionHash();
    if (!lastSavedHash) { setLastSavedHash(currentHash); return; }
    if (currentHash === lastSavedHash) return;
    if (dismissedRef.current) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (getVersionHash() !== lastSavedHash && !dismissedRef.current) {
        setShowSavePrompt(true);
        const vNum = versions.length + 1;
        setSaveVersionName(`v${vNum} – ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`);
      }
    }, 5000);

    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [version?.sections, version?.settings, mounted]);

  const handleSaveAsNewVersion = () => {
    if (!version || !saveVersionName.trim()) return;
    store.duplicateVersion(resumeId, version.id);
    // Rename the newly created version
    const updated = store.getResumeVersions(resumeId);
    const newest = updated[updated.length - 1];
    if (newest) store.renameVersion(newest.id, saveVersionName.trim());
    setLastSavedHash(getVersionHash());
    setShowSavePrompt(false);
    dismissedRef.current = false;
  };

  const handleOverwrite = () => {
    setLastSavedHash(getVersionHash());
    setShowSavePrompt(false);
    dismissedRef.current = false;
  };

  const handleDismissSavePrompt = () => {
    setShowSavePrompt(false);
    dismissedRef.current = true;
    // Re-enable prompt detection after 30s
    setTimeout(() => { dismissedRef.current = false; }, 30000);
  };

  useEffect(() => {
    if (!mounted && resumeId && resume) {
      store.selectResume(resumeId);
      if (versions.length > 0) store.selectVersion(versions[0].id);
      setMounted(true);
    }
  }, [resumeId, mounted]);

  useEscapeBack(() => router.back());

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      const r = Math.min(Math.max((window.innerWidth - e.clientX) / window.innerWidth * 100, 25), 72);
      setPreviewWidth(r);
    };
    const handleMouseUp = () => setIsDragging(false);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => { document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp); };
  }, [isDragging]);

  const handleExportPdf = useCallback(async () => {
    const wrapper = previewContainerRef.current;
    if (!wrapper || exportingPdf) return;
    const r = store.resumes.find(rev => rev.id === resumeId);
    const vers = r ? store.getResumeVersions(r.id) : [];
    const v = vers[0];
    if (!r || !v) return;
    setExportingPdf(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const MM_TO_PX = 3.7795;
      const paperW = v.settings.paperSize === 'Letter' ? 215.9 : 210;
      const paperH = v.settings.paperSize === 'Letter' ? 279.4 : 297;
      const pageWpx = Math.round(paperW * MM_TO_PX);
      const pageHpx = Math.round(paperH * MM_TO_PX);
      const marginV = Math.round(v.settings.marginTopBottom * MM_TO_PX);

      // FIX 5: Render the full hidden measurement div (full height, not clipped),
      // then crop each page from the canvas — avoids border/content overlap at page breaks.
      // We create a temporary off-screen full-height clone for clean rendering.
      const hiddenEl = wrapper.querySelector('[data-resume-hidden]') as HTMLElement | null;

      // Find the full-content wrapper (the hidden measurement div in ResumePreview)
      // Fall back to first paper page if hidden div not found
      const paperPages = Array.from(wrapper.querySelectorAll('[data-resume-paper]')) as HTMLElement[];
      const numPages = paperPages.length;

      // Enable PDF-level compression
      const pdf = new jsPDF('p', 'mm', paperW === 215.9 ? [215.9, 279.4] : 'a4', true);

      // scale=1.5 gives sharp text at ~150dpi; JPEG 0.82 keeps quality high, file small
      const RENDER_SCALE = 1.5;

      const renderPageToJpeg = async (pageEl: HTMLElement): Promise<string> => {
        const canvas = await html2canvas(pageEl, {
          scale: RENDER_SCALE,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: pageWpx,
          height: pageHpx,
        });
        // Ensure white background before JPEG encoding (avoids PNG fallback on transparent canvas)
        const flat = document.createElement('canvas');
        flat.width = canvas.width;
        flat.height = canvas.height;
        const ctx = flat.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, flat.width, flat.height);
        ctx.drawImage(canvas, 0, 0);
        return flat.toDataURL('image/jpeg', 0.82);
      };

      if (numPages === 1) {
        const imgData = await renderPageToJpeg(paperPages[0]);
        pdf.addImage(imgData, 'JPEG', 0, 0, paperW, paperH, '', 'FAST');
      } else {
        for (let p = 0; p < numPages; p++) {
          if (p > 0) pdf.addPage();
          const imgData = await renderPageToJpeg(paperPages[p]);
          pdf.addImage(imgData, 'JPEG', 0, 0, paperW, paperH, '', 'FAST');
        }
      }
      const fileName = `${r.name.replace(/[^\w\s-.]/gi, '_')}.pdf`;
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
      store.addExportRecord(resumeId, v.id, 'pdf', fileName);
    } catch (e) {
      console.error('PDF export failed:', e);
    } finally {
      setExportingPdf(false);
    }
  }, [resumeId, store, exportingPdf]);

  if (!resume || !version) return <div className="p-8 text-gray-500">Loading...</div>;

  const atsSafe = version.settings.atsSafeMode;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'content', label: 'Content', icon: <Pen className="w-4 h-4" /> },
    { id: 'customization', label: 'Customization', icon: <Sliders className="w-4 h-4" /> },
    { id: 'sections', label: 'Sections', icon: <LayoutGrid className="w-4 h-4" /> },
  ];

  return (
    <div className="h-screen flex flex-col bg-[#f0ede8] overflow-hidden">
      {/* ── Version Save Prompt Banner ───────────────────────────────── */}
      {showSavePrompt && (
        <div className="flex items-center justify-between px-5 py-2.5 bg-amber-50 border-b border-amber-200 flex-shrink-0 z-50">
          <div className="flex items-center gap-3">
            <GitBranch className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-sm font-medium text-amber-800">You have unsaved changes — save as a new version?</span>
            <input
              type="text"
              value={saveVersionName}
              onChange={e => setSaveVersionName(e.target.value)}
              placeholder="Version name…"
              className="text-sm border border-amber-300 rounded-md px-2 py-1 bg-white text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-400 w-44"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleSaveAsNewVersion} disabled={!saveVersionName.trim()}
              className="bg-amber-600 hover:bg-amber-700 text-white h-7 text-xs gap-1">
              <Save className="w-3 h-3" /> Save as new version
            </Button>
            <Button size="sm" variant="outline" onClick={handleOverwrite}
              className="border-amber-300 text-amber-700 hover:bg-amber-100 h-7 text-xs">
              Overwrite current
            </Button>
            <button type="button" onClick={handleDismissSavePrompt}
              className="p-1 rounded text-amber-500 hover:text-amber-700 hover:bg-amber-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3 bg-white border-b shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-gray-500 hover:text-gray-800 transition-colors text-sm">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <span className="text-gray-300">|</span>
          <h2 className="font-semibold text-gray-900">{resume.name}</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{version.name}</span>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => store.toggleAtsSafeMode(version.id)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all border ${atsSafe ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-emerald-50 border-emerald-300 text-emerald-700'}`}
          >
            {atsSafe ? '🔒 ATS Safe ON' : '🎨 Design ON'}
          </button>
          <Button variant="outline" size="sm" onClick={() => store.duplicateVersion(resumeId, version.id)}>
            <Copy className="w-3.5 h-3.5 mr-1" /> Duplicate
          </Button>
          <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white" onClick={handleExportPdf} disabled={exportingPdf}>
            <Download className="w-3.5 h-3.5 mr-1" /> {exportingPdf ? 'Exporting…' : 'Export PDF'}
          </Button>
        </div>
      </div>

      {/* ── Main area ────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left panel ─────────────────────────────────────────────── */}
        <div style={{ width: `${100 - previewWidth}%` }} className="flex flex-col overflow-hidden bg-[#f0ede8]">
          {/* Tab switcher */}
          <div className="flex gap-0 px-4 pt-4 pb-0 flex-shrink-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all border-b-2 ${
                  activeTab === tab.id
                    ? 'bg-white text-violet-700 border-violet-600 shadow-sm'
                    : 'bg-white/50 text-gray-500 border-transparent hover:bg-white/80 hover:text-gray-700'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto bg-white rounded-b-none border-t border-gray-100 shadow-sm">
            <div className="p-5">
              {activeTab === 'content' && <ContentTab versionId={version.id} />}
              {activeTab === 'customization' && <DesignTab versionId={version.id} />}
              {activeTab === 'sections' && <SectionsTab versionId={version.id} />}
            </div>
          </div>
        </div>

        {/* ── Resize handle ───────────────────────────────────────────── */}
        <div
          onMouseDown={() => setIsDragging(true)}
          className="w-1.5 bg-gray-200 hover:bg-violet-400 cursor-col-resize transition-colors flex-shrink-0 active:bg-violet-500"
          title="Drag to resize"
        />

        {/* ── Right preview panel ──────────────────────────────────────── */}
        <div style={{ width: `${previewWidth}%` }} className="flex flex-col overflow-hidden bg-[#e8e5e0]">
          {/* Preview header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#e0ddd8] border-b border-[#ccc9c4] flex-shrink-0">
            <span className="text-sm font-medium text-gray-600">
              {version.settings.paperSize} Preview
            </span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-lg border border-[#ccc9c4] bg-white/80 px-2 py-1">
                <button type="button" onClick={() => setPreviewZoom(z => Math.max(25, z - 5))} className="p-0.5 rounded hover:bg-gray-100 text-gray-600" title="Zoom out" aria-label="Zoom out">
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <input
                  type="range"
                  min={25}
                  max={200}
                  step={1}
                  value={previewZoom}
                  onChange={e => setPreviewZoom(Number(e.target.value))}
                  className="w-24 h-1 accent-violet-600 cursor-pointer"
                  title={`Zoom: ${previewZoom}%`}
                />
                <button type="button" onClick={() => setPreviewZoom(z => Math.min(200, z + 5))} className="p-0.5 rounded hover:bg-gray-100 text-gray-600" title="Zoom in" aria-label="Zoom in">
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-medium text-gray-700 min-w-[2.8rem] text-center">{previewZoom}%</span>
                <button type="button" onClick={() => setPreviewZoom(100)} className="p-0.5 rounded hover:bg-gray-100 text-gray-500" title="Reset zoom" aria-label="Reset zoom">
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
              <span className="text-xs text-gray-500">{version.settings.fontSize}pt · Line {version.settings.lineHeight}</span>
            </div>
          </div>

          {/* Paper view */}
          <div className="flex-1 overflow-auto p-6 flex flex-col items-center">
            <div ref={previewContainerRef} style={{ transform: `scale(${previewZoom / 100})`, transformOrigin: 'top center' }}>
              <ResumePreview version={version} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
