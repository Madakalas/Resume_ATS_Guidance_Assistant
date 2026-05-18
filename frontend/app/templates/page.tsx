'use client';

import { useState, useRef } from 'react';
import Sidebar from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BackButton } from '@/components/back-button';
import { CheckCircle, X, ChevronRight } from 'lucide-react';
import { useStore } from '@/lib/store';
import ResumePreview from '@/components/resume-preview';
import { toastSettingsUpdated } from '@/lib/toast-helpers';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { ResumeVersion } from '@/lib/store';

// ── Sample data used to render template previews ─────────────────────────────
function buildSampleVersion(templateId: string, accentColor: string, headingStyle: string, fontFamily: string): ResumeVersion {
  const now = new Date().toISOString();
  return {
    id: `sample-${templateId}`,
    name: templateId,
    resumeId: `sample-resume-${templateId}`,
    createdAt: now,
    updatedAt: now,
    settings: {
      fontSize: 9,
      lineHeight: 1.15,
      paperSize: 'A4',
      template: templateId,
      atsSafeMode: false,
      layoutColumns: 'one',
      headerPosition: 'top',
      columnWidthLeft: 50,
      marginLeftRight: 12,
      marginTopBottom: 12,
      spaceBetweenEntries: 3,
      entryLayoutStyle: 1,
      titleSubtitleSize: 's',
      subtitleStyle: 'italic',
      subtitlePlacement: 'next-line',
      indentBody: true,
      listStyle: 'bullet',
      design: {
        colorMode: 'basic',
        accentColor,
        accentApplyName: true,
        accentApplyJobTitle: false,
        accentApplyHeadings: true,
        accentApplyHeadingsLine: true,
        accentApplyHeaderIcons: true,
        accentApplyDots: false,
        accentApplyDates: false,
        accentApplyLinkIcons: false,
        fontCategory: 'sans',
        fontFamily,
        sectionHeadingStyle: headingStyle as any,
        sectionHeadingCaps: 'uppercase',
        sectionHeadingSize: 'm',
        sectionHeadingIcons: 'none',
        linkUnderline: false,
        linkBlueColor: false,
        linkIcon: false,
        linkIconStyle: 'chain',
        headerAlignment: 'left',
        headerArrangement: 'stacked',
        headerContactStyle: 'icon',
        headerIconStyle: 1,
        headerSeparator: true,
        headerSeparatorStyle: 'bar',
        nameSize: 'l',
        nameBold: true,
        nameFont: 'body',
        titleSize: 'm',
        titlePlacement: 'below',
        titleStyle: 'normal',
        showPhoto: false,
        photoUrl: '',
        photoShape: 'circle',
        photoSize: 'md',
        skillsLayout: 'compact',
        skillsColumns: 2,
        skillsSubinfo: 'dash',
        skillsLevelStyle: 'dots',
        skillsCompactStyle: 'bullet',
        showProfileHeading: true,
        educationOrder: 'degree-school',
        experienceOrder: 'title-company',
        groupPromotions: false,
        showFooter: false,
        footerPageNumbers: false,
        footerEmail: false,
        footerName: false,
      },
    },
    sections: [
      {
        id: 'sec-pi', type: 'personal-info', title: 'Personal Info', visible: true, order: 0,
        content: {
          fullName: 'Aditya Sharma',
          jobTitle: 'Software Engineer',
          email: 'aditya.sharma@email.com',
          phone: '+91 98765 43210',
          location: 'Bangalore, India',
          linkedin: 'linkedin.com/in/adityasharma',
          github: 'github.com/adityasharma',
          website: '',
          summary: '',
        },
      },
      {
        id: 'sec-sum', type: 'summary', title: 'Summary', visible: true, order: 1,
        content: {
          text: 'Software Engineer with 3+ years of experience building scalable backend services and RESTful APIs. Passionate about clean code, system design, and delivering high-impact features in collaborative Agile teams.',
        },
      },
      {
        id: 'sec-exp', type: 'experience', title: 'Professional Experience', visible: true, order: 2,
        content: {
          roles: [
            {
              id: 'role-1',
              company: 'Razorpay',
              title: 'Software Engineer II',
              location: 'Bangalore',
              startDate: 'Jun 2022',
              endDate: 'Present',
              bullets: [
                'Engineered payment reconciliation service processing ₹500Cr+ monthly, reducing discrepancies by 40%',
                'Designed and implemented RESTful APIs serving 2M+ daily requests with 99.9% uptime',
                'Led migration of 3 microservices from monolith, improving deployment frequency by 3×',
                'Collaborated with product and design to ship checkout optimization reducing drop-off by 18%',
              ],
              tech: ['Java', 'Spring Boot', 'PostgreSQL', 'Kafka', 'Redis'],
            },
            {
              id: 'role-2',
              company: 'Infosys',
              title: 'Systems Engineer',
              location: 'Pune',
              startDate: 'Jul 2021',
              endDate: 'May 2022',
              bullets: [
                'Built ETL pipelines to process and normalize 10GB+ of client data daily',
                'Automated reporting workflows reducing manual effort by 60%',
              ],
              tech: ['Python', 'SQL', 'AWS Lambda'],
            },
          ],
        },
      },
      {
        id: 'sec-sk', type: 'skills', title: 'Technical Skills', visible: true, order: 3,
        content: {
          groups: [
            { id: 'sg-1', heading: 'Languages', items: ['Java', 'Python', 'JavaScript', 'SQL'] },
            { id: 'sg-2', heading: 'Frameworks', items: ['Spring Boot', 'Node.js', 'React', 'FastAPI'] },
            { id: 'sg-3', heading: 'Infrastructure', items: ['AWS', 'Docker', 'Kubernetes', 'PostgreSQL', 'Redis', 'Kafka'] },
            { id: 'sg-4', heading: 'Tools', items: ['Git', 'Jira', 'Postman', 'Datadog'] },
          ],
        },
      },
      {
        id: 'sec-proj', type: 'projects', title: 'Projects', visible: true, order: 4,
        content: {
          projects: [
            {
              id: 'proj-1',
              name: 'Distributed Rate Limiter',
              role: 'Solo Project',
              startDate: 'Jan 2024',
              endDate: 'Mar 2024',
              techStack: ['Go', 'Redis', 'Docker'],
              link: 'github.com/adityasharma/rate-limiter',
              bullets: [
                'Built token-bucket rate limiter supporting 100K req/s across distributed nodes',
                'Implemented sliding-window algorithm with Redis Lua scripts for atomicity',
              ],
            },
            {
              id: 'proj-2',
              name: 'Resume ATS Scorer',
              role: 'Full Stack',
              startDate: 'Sep 2023',
              endDate: 'Nov 2023',
              techStack: ['Python', 'FastAPI', 'React', 'OpenAI'],
              link: '',
              bullets: [
                'Created ATS scoring tool that compares resume to JD using NLP, used by 500+ job seekers',
              ],
            },
          ],
        },
      },
      {
        id: 'sec-edu', type: 'education', title: 'Education', visible: true, order: 5,
        content: {
          schools: [
            {
              id: 'edu-1',
              school: 'VIT University',
              degree: 'B.Tech Computer Science',
              field: 'Computer Science',
              startDate: '2017',
              endDate: '2021',
              grade: '8.9 CGPA',
              location: 'Vellore, India',
            },
          ],
        },
      },
    ],
  };
}

// ── Template definitions ──────────────────────────────────────────────────────
const TEMPLATES = [
  {
    id: 'ATS Clean',
    name: 'ATS Clean',
    description: 'Maximum ATS compatibility. Single column, zero formatting risk.',
    tags: ['ATS', 'Minimal', 'Corporate'],
    atsScore: 99,
    accentColor: '#1d4ed8',
    headingStyle: 'underline',
    fontFamily: 'Inter',
    pros: ['99% ATS pass rate', 'Single column', 'Perfect for corporate & IT'],
    cons: ['Less visual appeal'],
    bestFor: 'TCS, Infosys, Wipro, Banking',
  },
  {
    id: 'Minimal Modern',
    name: 'Minimal Modern',
    description: 'Clean and contemporary with subtle accent colors.',
    tags: ['Modern', 'Balanced', 'Tech'],
    atsScore: 95,
    accentColor: '#7c3aed',
    headingStyle: 'line-left',
    fontFamily: 'DM Sans',
    pros: ['95% ATS pass rate', 'Strong visual hierarchy', 'Great for product & tech'],
    cons: ['Some older ATS may skip colors'],
    bestFor: 'Startups, Product companies, FAANG',
  },
  {
    id: 'Executive',
    name: 'Executive',
    description: 'Professional and authoritative. Ideal for senior roles.',
    tags: ['Senior', 'Professional', 'Leadership'],
    atsScore: 97,
    accentColor: '#1e3a5f',
    headingStyle: 'filled',
    fontFamily: 'Lato',
    pros: ['97% ATS pass rate', 'Authority feel', 'Great for senior/lead roles'],
    cons: ['May feel heavy for freshers'],
    bestFor: 'Senior Engineers, Tech Leads, Managers',
  },
  {
    id: 'Creative Tech',
    name: 'Creative Tech',
    description: 'Bold accent with clean structure. Stands out in tech.',
    tags: ['Creative', 'Bold', 'Modern'],
    atsScore: 88,
    accentColor: '#059669',
    headingStyle: 'box',
    fontFamily: 'Nunito',
    pros: ['Visually memorable', 'Great for design/frontend', 'Strong first impression'],
    cons: ['Lower ATS score with some parsers'],
    bestFor: 'Frontend, UI/UX, Creative roles',
  },
];

export default function TemplatesPage() {
  const store = useStore();
  const [previewTemplate, setPreviewTemplate] = useState<typeof TEMPLATES[0] | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyTarget, setApplyTarget] = useState<typeof TEMPLATES[0] | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [selectedVersionId, setSelectedVersionId] = useState('');

  const versions = selectedResumeId ? store.getResumeVersions(selectedResumeId) : [];
  const selectedVersion = selectedVersionId ? versions.find(v => v.id === selectedVersionId) : null;

  const handleApplyTemplate = () => {
    if (selectedVersion && applyTarget) {
      store.updateSettings(selectedVersion.id, { template: applyTarget.id as any });
      toastSettingsUpdated();
      setShowApplyModal(false);
      setApplyTarget(null);
      setSelectedResumeId('');
      setSelectedVersionId('');
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <div className="w-64 border-r border-border bg-sidebar hidden md:block">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col overflow-auto">
        {/* Banner */}
        <div className="bg-primary/10 border-b border-border">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
            <p className="text-sm font-medium text-foreground">
              All templates are ATS-optimized. Pick visually — preview fills with your data automatically.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-10 w-full">
          <BackButton breadcrumb="Dashboard" />

          <div className="mb-10 mt-6">
            <h1 className="text-4xl font-bold text-foreground mb-2">Choose Your Template</h1>
            <p className="text-muted-foreground text-lg">Click any template to see a full preview before applying.</p>
          </div>

          {/* Template Grid — 2 columns, card = thumbnail left + info right */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {TEMPLATES.map(template => {
              const sampleVersion = buildSampleVersion(template.id, template.accentColor, template.headingStyle, template.fontFamily);
              return (
                <div
                  key={template.id}
                  className="border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:border-primary/40 transition-all duration-200 bg-card cursor-pointer group"
                  onClick={() => setPreviewTemplate(template)}
                >
                  {/* Thumbnail */}
                  <div className="relative bg-[#e8e5e0] border-b border-border overflow-hidden"
                    style={{ height: 280 }}>
                    <div
                      style={{
                        transform: 'scale(0.38)',
                        transformOrigin: 'top left',
                        width: `${100 / 0.38}%`,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      }}
                    >
                      <ResumePreview version={sampleVersion} />
                    </div>
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="bg-white/90 backdrop-blur-sm border border-border rounded-full px-4 py-2 flex items-center gap-2 text-sm font-medium text-foreground shadow">
                        <span>Click to preview</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg text-foreground">{template.name}</h3>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                      </div>
                      <Badge className="ml-3 shrink-0 bg-green-100 text-green-800 border-green-200">
                        {template.atsScore}% ATS
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {template.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>

                    <p className="text-xs text-muted-foreground mb-4">
                      <span className="font-medium text-foreground">Best for:</span> {template.bestFor}
                    </p>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={e => { e.stopPropagation(); setPreviewTemplate(template); }}
                      >
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={e => {
                          e.stopPropagation();
                          setApplyTarget(template);
                          setShowApplyModal(true);
                        }}
                      >
                        Use Template
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Full Preview Modal ─────────────────────────────────────────────── */}
      <Dialog open={!!previewTemplate} onOpenChange={open => { if (!open) setPreviewTemplate(null); }}>
        <DialogContent className="max-w-[900px] w-full max-h-[94vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl">{previewTemplate?.name}</DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">{previewTemplate?.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setApplyTarget(previewTemplate);
                    setPreviewTemplate(null);
                    setShowApplyModal(true);
                  }}
                >
                  Use This Template
                </Button>
              </div>
            </div>
            {previewTemplate && (
              <div className="flex flex-wrap gap-4 mt-3 text-xs">
                <div>
                  <span className="text-muted-foreground">ATS Score: </span>
                  <span className="font-semibold text-green-600">{previewTemplate.atsScore}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Best for: </span>
                  <span className="font-medium">{previewTemplate.bestFor}</span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {previewTemplate.pros.map(p => (
                    <span key={p} className="bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5">{p}</span>
                  ))}
                </div>
              </div>
            )}
          </DialogHeader>
          {/* 
            A4 paper = 210mm × 297mm = ~794px × 1123px at 96dpi
            Dialog content area ≈ 900px wide, minus 0 px padding = ~900px available
            Scale = 860 / 794 ≈ 1.08 — but we want slight breathing room, so 0.92
            This ensures full width shows without clipping.
          */}
          <div className="flex-1 overflow-auto bg-[#e8e5e0] flex justify-center py-8" style={{ minHeight: 0 }}>
            {previewTemplate && (
              <div style={{
                transform: 'scale(0.88)',
                transformOrigin: 'top center',
                width: `${100 / 0.88}%`,
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '-12%',
              }}>
                <ResumePreview version={buildSampleVersion(previewTemplate.id, previewTemplate.accentColor, previewTemplate.headingStyle, previewTemplate.fontFamily)} />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Apply to Resume Modal ──────────────────────────────────────────── */}
      <Dialog open={showApplyModal} onOpenChange={open => { if (!open) { setShowApplyModal(false); setApplyTarget(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Apply "{applyTarget?.name}" Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-sm mb-2 block">Select Resume</Label>
              <Select value={selectedResumeId} onValueChange={id => { setSelectedResumeId(id); setSelectedVersionId(''); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a resume…" />
                </SelectTrigger>
                <SelectContent>
                  {store.resumes.map(resume => (
                    <SelectItem key={resume.id} value={resume.id}>{resume.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedResumeId && versions.length > 0 && (
              <div>
                <Label className="text-sm mb-2 block">Select Version</Label>
                <Select value={selectedVersionId} onValueChange={setSelectedVersionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a version…" />
                  </SelectTrigger>
                  <SelectContent>
                    {versions.map(version => (
                      <SelectItem key={version.id} value={version.id}>{version.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <p className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              This will update the template style only — your resume content stays the same.
            </p>

            <Button
              onClick={handleApplyTemplate}
              disabled={!selectedVersion}
              className="w-full"
              size="lg"
            >
              Apply Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
