'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileUp, FileText, Loader2, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import { uploadDocument } from '@/lib/api';
import { useStore, type ResumeSection, type SectionType } from '@/lib/store';

interface ImportResumeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ImportStep = 'upload' | 'parsing' | 'preview' | 'done';

interface ParsedResumeData {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  location: string;
  jobTitle: string;
  summary: string;
  skills: string[];
  experience: Array<{
    company: string;
    title: string;
    startDate: string;
    endDate: string;
    bullets: string[];
  }>;
  education: Array<{
    school: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    grade: string;
  }>;
  projects: Array<{
    name: string;
    description: string;
    techStack: string[];
    bullets: string[];
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    issueDate: string;
  }>;
  rawText: string;
}

// Parse resume text into structured data using simple heuristics
function parseResumeText(text: string): ParsedResumeData {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const lower = text.toLowerCase();

  // ── Name: usually the first non-empty line
  const firstName = lines[0] || 'Your Name';

  // ── Email
  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch?.[0] || '';

  // ── Phone
  const phoneMatch = text.match(/[\+]?[\d\s\-().]{10,}/);
  const phone = phoneMatch?.[0]?.trim() || '';

  // ── LinkedIn
  const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/i);
  const linkedin = linkedinMatch ? `https://${linkedinMatch[0]}` : '';

  // ── GitHub
  const githubMatch = text.match(/github\.com\/[\w-]+/i);
  const github = githubMatch ? `https://${githubMatch[0]}` : '';

  // ── Job title (heuristic: 2nd or 3rd line if short and contains role keywords)
  let jobTitle = '';
  for (let i = 1; i < Math.min(5, lines.length); i++) {
    const l = lines[i];
    if (l.length < 80 && /developer|engineer|analyst|designer|manager|consultant|architect|scientist|lead|intern|associate/i.test(l)) {
      jobTitle = l;
      break;
    }
  }

  // ── Section detection
  const sectionMap: Record<string, number> = {};
  const SECTION_PATTERNS: Record<string, RegExp> = {
    summary: /^(summary|objective|profile|about me|professional summary|career objective)\s*$/i,
    experience: /^(experience|work experience|professional experience|employment history|work history)\s*$/i,
    education: /^(education|academic background|qualifications|academic qualifications)\s*$/i,
    skills: /^(skills|technical skills|core competencies|competencies|key skills)\s*$/i,
    projects: /^(projects|key projects|personal projects|project experience|portfolio)\s*$/i,
    certifications: /^(certifications?|certificates?|licenses?|credentials?)\s*$/i,
  };

  lines.forEach((line, i) => {
    for (const [key, pattern] of Object.entries(SECTION_PATTERNS)) {
      if (pattern.test(line)) sectionMap[key] = i;
    }
  });

  // ── Extract summary
  let summary = '';
  if (sectionMap.summary !== undefined) {
    const start = sectionMap.summary + 1;
    const nextSection = Object.values(sectionMap).filter((v) => v > sectionMap.summary).sort((a, b) => a - b)[0] || lines.length;
    summary = lines.slice(start, Math.min(start + 5, nextSection)).join(' ');
  }

  // ── Extract skills
  let skills: string[] = [];
  if (sectionMap.skills !== undefined) {
    const start = sectionMap.skills + 1;
    const nextSection = Object.values(sectionMap).filter((v) => v > sectionMap.skills).sort((a, b) => a - b)[0] || lines.length;
    const skillText = lines.slice(start, nextSection).join(' ');
    skills = skillText.split(/[,•|\/\n]+/).map((s) => s.trim()).filter((s) => s.length > 1 && s.length < 40);
  }

  // ── Extract experience
  const experience: ParsedResumeData['experience'] = [];
  if (sectionMap.experience !== undefined) {
    const start = sectionMap.experience + 1;
    const nextSection = Object.values(sectionMap).filter((v) => v > sectionMap.experience).sort((a, b) => a - b)[0] || lines.length;
    const expLines = lines.slice(start, nextSection);
    
    let currentExp: ParsedResumeData['experience'][0] | null = null;
    for (const line of expLines) {
      const dateMatch = line.match(/(\w+ \d{4}|\d{4})\s*[-–—]\s*(\w+ \d{4}|\d{4}|present|current)/i);
      const isBullet = /^[•\-\*→]/.test(line);
      
      if (dateMatch && !isBullet) {
        if (currentExp) experience.push(currentExp);
        currentExp = {
          company: line.replace(dateMatch[0], '').trim().split('|')[0].split('—')[0].trim() || 'Company',
          title: 'Software Engineer',
          startDate: dateMatch[1],
          endDate: dateMatch[2],
          bullets: [],
        };
      } else if (currentExp && isBullet) {
        currentExp.bullets.push(line.replace(/^[•\-\*→]\s*/, '').trim());
      } else if (!isBullet && !dateMatch && currentExp && line.length > 5 && line.length < 80) {
        // Could be title or company name
        if (!currentExp.title || currentExp.title === 'Software Engineer') {
          currentExp.title = line;
        }
      }
    }
    if (currentExp) experience.push(currentExp);
  }

  // ── Extract education
  const education: ParsedResumeData['education'] = [];
  if (sectionMap.education !== undefined) {
    const start = sectionMap.education + 1;
    const nextSection = Object.values(sectionMap).filter((v) => v > sectionMap.education).sort((a, b) => a - b)[0] || lines.length;
    const eduLines = lines.slice(start, nextSection);
    
    let currentEdu: ParsedResumeData['education'][0] | null = null;
    for (const line of eduLines) {
      const dateMatch = line.match(/(\d{4})\s*[-–—]\s*(\d{4}|present)/i);
      const degreeMatch = /bachelor|master|b\.tech|m\.tech|b\.e|m\.e|phd|diploma|b\.sc|m\.sc|mba|be |me |bca|mca/i.test(line);
      
      if (degreeMatch || /university|college|institute|school of/i.test(line)) {
        if (currentEdu) education.push(currentEdu);
        const gradeMatch = line.match(/(\d+\.?\d*)\s*(cgpa|gpa|%|percent)/i);
        currentEdu = {
          school: line.split('|')[0].trim(),
          degree: '',
          field: '',
          startDate: '',
          endDate: '',
          grade: gradeMatch?.[1] || '',
        };
        if (dateMatch) { currentEdu.startDate = dateMatch[1]; currentEdu.endDate = dateMatch[2]; }
        if (degreeMatch) { currentEdu.degree = line.match(/bachelor[^,|]*/i)?.[0] || line.match(/master[^,|]*/i)?.[0] || line.match(/b\.tech[^,|]*/i)?.[0] || line.split('|')[0].trim(); }
      } else if (currentEdu && dateMatch) {
        currentEdu.startDate = dateMatch[1];
        currentEdu.endDate = dateMatch[2];
      }
    }
    if (currentEdu) education.push(currentEdu);
  }

  // ── Extract projects
  const projects: ParsedResumeData['projects'] = [];
  if (sectionMap.projects !== undefined) {
    const start = sectionMap.projects + 1;
    const nextSection = Object.values(sectionMap).filter((v) => v > sectionMap.projects).sort((a, b) => a - b)[0] || lines.length;
    const projLines = lines.slice(start, nextSection);
    
    let currentProj: ParsedResumeData['projects'][0] | null = null;
    for (const line of projLines) {
      const isBullet = /^[•\-\*→]/.test(line);
      if (!isBullet && line.length > 3 && line.length < 80) {
        if (currentProj) projects.push(currentProj);
        const techMatch = line.match(/\(([^)]+)\)/);
        const techStack = techMatch?.[1]?.split(/[,\/|]/).map((t) => t.trim()).filter(Boolean) || [];
        currentProj = {
          name: line.replace(/\([^)]+\)/, '').trim(),
          description: '',
          techStack,
          bullets: [],
        };
      } else if (currentProj && isBullet) {
        currentProj.bullets.push(line.replace(/^[•\-\*→]\s*/, '').trim());
      }
    }
    if (currentProj) projects.push(currentProj);
  }

  return {
    name: firstName,
    email,
    phone,
    linkedin,
    github,
    location: '',
    jobTitle,
    summary,
    skills: skills.slice(0, 30),
    experience: experience.slice(0, 5),
    education: education.slice(0, 3),
    projects: projects.slice(0, 6),
    certifications: [],
    rawText: text,
  };
}

// Convert parsed data into store sections
function buildSectionsFromParsed(parsed: ParsedResumeData): Omit<ResumeSection, 'id' | 'order'>[] {
  const sections: Omit<ResumeSection, 'id' | 'order'>[] = [];

  // Personal info
  sections.push({
    type: 'personal-info' as SectionType,
    title: 'Personal Information',
    visible: true,
    content: {
      name: parsed.name,
      email: parsed.email,
      phone: parsed.phone,
      linkedin: parsed.linkedin,
      github: parsed.github,
      location: parsed.location,
      jobTitle: parsed.jobTitle,
      website: '',
    },
  });

  // Summary
  if (parsed.summary) {
    sections.push({
      type: 'summary' as SectionType,
      title: 'Summary',
      visible: true,
      content: { value: parsed.summary },
    });
  }

  // Experience
  if (parsed.experience.length > 0) {
    sections.push({
      type: 'experience' as SectionType,
      title: 'Experience',
      visible: true,
      content: {
        items: parsed.experience.map((exp, i) => ({
          id: `exp-${i}`,
          company: exp.company,
          title: exp.title,
          location: '',
          workType: 'Onsite',
          startDate: exp.startDate,
          endDate: exp.endDate,
          bullets: exp.bullets.length > 0 ? exp.bullets : ['Contributed to key projects and deliverables'],
          tech: [],
        })),
      },
    });
  }

  // Education
  if (parsed.education.length > 0) {
    sections.push({
      type: 'education' as SectionType,
      title: 'Education',
      visible: true,
      content: {
        items: parsed.education.map((edu, i) => ({
          id: `edu-${i}`,
          school: edu.school,
          degree: edu.degree,
          field: edu.field,
          startDate: edu.startDate,
          endDate: edu.endDate,
          grade: edu.grade,
          location: '',
        })),
      },
    });
  }

  // Skills
  if (parsed.skills.length > 0) {
    sections.push({
      type: 'skills' as SectionType,
      title: 'Skills',
      visible: true,
      content: {
        groups: [
          {
            id: 'sg-0',
            heading: 'Technical Skills',
            items: parsed.skills,
          },
        ],
      },
    });
  }

  // Projects
  if (parsed.projects.length > 0) {
    sections.push({
      type: 'projects' as SectionType,
      title: 'Projects',
      visible: true,
      content: {
        items: parsed.projects.map((p, i) => ({
          id: `proj-${i}`,
          name: p.name,
          role: '',
          startDate: '',
          endDate: '',
          techStack: p.techStack,
          link: '',
          bullets: p.bullets.length > 0 ? p.bullets : [p.description].filter(Boolean),
        })),
      },
    });
  }

  return sections;
}

export function ImportResumeModal({ open, onOpenChange }: ImportResumeModalProps) {
  const router = useRouter();
  const store = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<ImportStep>('upload');
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedResumeData | null>(null);
  const [error, setError] = useState('');
  const [resumeName, setResumeName] = useState('');

  const reset = () => {
    setStep('upload');
    setSelectedFile(null);
    setParsed(null);
    setError('');
    setResumeName('');
  };

  const handleClose = () => { reset(); onOpenChange(false); };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragActive(true);
    else if (e.type === 'dragleave') setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (file) processFile(file);
  };

  const processFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) {
      setError('Unsupported format. Please use PDF, DOCX, DOC, or TXT.'); return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('File too large. Maximum size is 2 MB.'); return;
    }
    setSelectedFile(file);
    setStep('parsing');
    setError('');

    try {
      const result = await uploadDocument(file, 'resume');
      let text = result.extracted_text_preview || result.text || '';

      if (!text && result.document_id) {
        const { text: t } = await (await import('@/lib/api')).getDocumentText(result.document_id);
        text = t || '';
      }

      if (!text.trim()) {
        setError('Could not extract text from this file. Try PDF or TXT format.');
        setStep('upload');
        return;
      }

      const parsedData = parseResumeText(text);
      setParsed(parsedData);
      setResumeName(parsedData.name !== 'Your Name' ? `${parsedData.name}'s Resume` : file.name.replace(/\.[^.]+$/, ''));
      setStep('preview');
    } catch (err) {
      console.error(err);
      setError('Failed to parse the file. Please try again with a different file.');
      setStep('upload');
    }
  };

  const handleImportToEditor = () => {
    if (!parsed) return;
    const sections = buildSectionsFromParsed(parsed);
    const resumeId = store.createResume({ name: resumeName || 'Imported Resume', role: parsed.jobTitle || 'Professional' });
    if (!resumeId) return;
    const versions = store.getResumeVersions(resumeId);
    const versionId = versions[0]?.id;
    if (!versionId) return;

    // Add all parsed sections
    sections.forEach((section, index) => {
      if (index === 0) {
        // Update the personal info section that was created with the resume
        const existingSection = versions[0]?.sections.find((s) => s.type === 'personal-info');
        if (existingSection) {
          store.updateSectionContent(versionId, existingSection.id, section.content);
          return;
        }
      }
      store.addSection(versionId, section);
    });

    setStep('done');
    setTimeout(() => {
      handleClose();
      router.push(`/editor/${resumeId}`);
    }, 1200);
  };

  const handleSendToAiMode = () => {
    if (!parsed) return;
    // Store raw text in sessionStorage for AI mode to pick up
    try { sessionStorage.setItem('raga_import_text', parsed.rawText); sessionStorage.setItem('raga_import_name', resumeName); } catch { /* ignore */ }
    handleClose();
    router.push('/ai-mode');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Import Existing Resume
          </DialogTitle>
          <DialogDescription>
            Upload your resume PDF, DOCX, DOC, or TXT. We'll parse it and fill your editor automatically.
          </DialogDescription>
        </DialogHeader>

        {/* STEP: Upload */}
        {(step === 'upload' || step === 'parsing') && (
          <div className="space-y-4">
            <div
              onDragEnter={handleDrag} onDragLeave={handleDrag}
              onDragOver={handleDrag} onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-muted/30'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              {step === 'parsing' ? (
                <div className="space-y-3">
                  <Loader2 className="w-10 h-10 text-primary mx-auto animate-spin" />
                  <p className="text-sm font-medium text-foreground">Parsing resume…</p>
                  <p className="text-xs text-muted-foreground">Extracting your experience, skills, and education</p>
                </div>
              ) : selectedFile ? (
                <div className="space-y-2">
                  <FileText className="w-10 h-10 text-primary mx-auto" />
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <FileUp className="w-10 h-10 text-muted-foreground mx-auto" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Drag & drop your resume here</p>
                    <p className="text-xs text-muted-foreground mt-1">or click to browse files</p>
                  </div>
                  <div className="flex justify-center gap-2 pt-1">
                    {['PDF', 'DOCX', 'DOC', 'TXT'].map((fmt) => (
                      <span key={fmt} className="text-xs bg-muted border border-border rounded px-2 py-0.5">{fmt}</span>
                    ))}
                  </div>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleFileChange} className="hidden" />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="flex-1">Cancel</Button>
              <Button onClick={() => fileInputRef.current?.click()} disabled={step === 'parsing'} className="flex-1">
                <Upload className="w-4 h-4 mr-2" />Choose File
              </Button>
            </div>
          </div>
        )}

        {/* STEP: Preview */}
        {step === 'preview' && parsed && (
          <div className="space-y-4">
            {/* Resume name */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Resume Name</label>
              <input
                value={resumeName}
                onChange={(e) => setResumeName(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="My Resume"
              />
            </div>

            {/* Parsed preview */}
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="bg-muted/40 px-4 py-2 border-b border-border">
                <p className="text-xs font-semibold text-foreground">Extracted Fields</p>
              </div>
              <div className="p-4 space-y-3 max-h-64 overflow-y-auto text-sm">
                <Field label="Name" value={parsed.name} ok={parsed.name !== 'Your Name'} />
                <Field label="Email" value={parsed.email} ok={!!parsed.email} />
                <Field label="Phone" value={parsed.phone} ok={!!parsed.phone} />
                <Field label="Job Title" value={parsed.jobTitle} ok={!!parsed.jobTitle} />
                <Field label="LinkedIn" value={parsed.linkedin} ok={!!parsed.linkedin} />
                <Field label="Summary" value={parsed.summary ? `${parsed.summary.slice(0, 80)}…` : ''} ok={!!parsed.summary} />
                <Field label="Skills" value={`${parsed.skills.length} skills found`} ok={parsed.skills.length > 0} />
                <Field label="Experience" value={`${parsed.experience.length} position(s)`} ok={parsed.experience.length > 0} />
                <Field label="Education" value={`${parsed.education.length} entry/entries`} ok={parsed.education.length > 0} />
                <Field label="Projects" value={`${parsed.projects.length} project(s)`} ok={parsed.projects.length > 0} />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Missing fields will be created as empty sections — you can fill them in the editor.
            </p>

            {/* Action buttons */}
            <div className="space-y-2">
              <Button onClick={handleImportToEditor} className="w-full bg-primary hover:bg-primary/90">
                <FileText className="w-4 h-4 mr-2" />
                Open in Resume Editor
              </Button>
              <Button onClick={handleSendToAiMode} variant="outline" className="w-full">
                <Zap className="w-4 h-4 mr-2" />
                Send to AI Mode (RAGA)
              </Button>
              <Button variant="ghost" onClick={reset} className="w-full text-muted-foreground text-sm">
                Upload different file
              </Button>
            </div>
          </div>
        )}

        {/* STEP: Done */}
        {step === 'done' && (
          <div className="text-center py-8 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <p className="text-base font-semibold text-foreground">Resume imported!</p>
            <p className="text-sm text-muted-foreground">Opening in editor…</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <span className={`shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${ok ? 'bg-green-500/20 text-green-600' : 'bg-orange-500/20 text-orange-600'}`}>
        {ok ? '✓' : '?'}
      </span>
      <div className="flex-1 min-w-0">
        <span className="text-xs text-muted-foreground font-medium">{label}: </span>
        <span className="text-xs text-foreground">{value || 'Not detected'}</span>
      </div>
    </div>
  );
}
