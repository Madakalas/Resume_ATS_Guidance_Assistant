'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SectionType = 
  | 'personal-info' | 'summary' | 'skills' | 'experience'
  | 'projects' | 'education' | 'custom' | 'awards'
  | 'publications' | 'achievements' | 'languages' | 'volunteer' | 'links';

export interface SkillGroup { id: string; heading: string; items: string[]; }
export interface Project { id: string; name: string; role?: string; startDate?: string; endDate?: string; techStack: string[]; link?: string; bullets: string[]; }
export interface Certification { id: string; name: string; issuer: string; issueDate?: string; expiryDate?: string; credentialId?: string; credentialUrl?: string; }
export interface Experience { id: string; company: string; title: string; location?: string; workType?: 'Onsite' | 'Remote' | 'Hybrid'; startDate: string; endDate: string; bullets: string[]; tech?: string[]; }
export interface Education { id: string; school: string; degree: string; field?: string; startDate?: string; endDate?: string; grade?: string; location?: string; }
export interface ResumeSection { id: string; type: SectionType; title: string; visible: boolean; order: number; content: Record<string, any>; }

export interface DesignSettings {
  // Colors
  colorMode: 'basic' | 'advanced' | 'border';
  accentColor: string;
  accentApplyName: boolean;
  accentApplyJobTitle: boolean;
  accentApplyHeadings: boolean;
  accentApplyHeadingsLine: boolean;
  accentApplyHeaderIcons: boolean;
  accentApplyDots: boolean;
  accentApplyDates: boolean;
  accentApplyLinkIcons: boolean;
  // Font
  fontCategory: 'serif' | 'sans' | 'mono';
  fontFamily: string;
  // Section Headings
  sectionHeadingStyle: 'plain' | 'underline' | 'box' | 'filled' | 'line-left' | 'overline' | 'wavy';
  sectionHeadingCaps: 'capitalize' | 'uppercase';
  sectionHeadingSize: 's' | 'm' | 'l' | 'xl';
  sectionHeadingIcons: 'none' | 'outline' | 'filled';
  // Link Styling
  linkUnderline: boolean;
  linkBlueColor: boolean;
  linkIcon: boolean;
  linkIconStyle: 'chain' | 'external';
  // Header – Personal Details
  headerAlignment: 'left' | 'center' | 'right';
  headerArrangement: 'stacked' | 'inline' | 'split';
  headerContactStyle: 'icon' | 'bullet' | 'bar';
  headerIconStyle: number;
  headerSeparator: boolean;
  headerSeparatorStyle: 'bar' | 'none';
  // Header – Name
  nameSize: 'xs' | 's' | 'm' | 'l' | 'xl';
  nameBold: boolean;
  nameFont: 'body' | 'creative';
  // Header – Professional Title
  titleSize: 's' | 'm' | 'l';
  titlePlacement: 'same-line' | 'below';
  titleStyle: 'normal' | 'italic' | 'bold';
  // Photo
  showPhoto: boolean;
  photoUrl: string;
  photoShape: 'circle' | 'square' | 'rounded';
  photoSize: 'sm' | 'md' | 'lg';
  // Skills
  skillsLayout: 'grid' | 'level' | 'compact' | 'bubble' | 'bullet' | 'pipe' | 'newline' | 'comma';
  skillsColumns: 1 | 2 | 3 | 4;
  skillsSubinfo: 'dash' | 'colon' | 'bracket';
  skillsLevelStyle?: 'text' | 'dots' | 'bar';
  skillsCompactStyle?: 'bullet' | 'pipe' | 'newline' | 'comma';
  // Profile
  showProfileHeading: boolean;
  // Education
  educationOrder: 'degree-school' | 'school-degree';
  // Work Experience
  experienceOrder: 'title-company' | 'company-title';
  groupPromotions: boolean;
  // Footer
  showFooter: boolean;
  footerPageNumbers: boolean;
  footerEmail: boolean;
  footerName: boolean;
}

export interface ResumeSettings {
  fontSize: number;
  lineHeight: number;
  paperSize: 'A4' | 'Letter';
  template: string;
  atsSafeMode: boolean;
  design: DesignSettings;
  // Layout
  layoutColumns: 'one' | 'two' | 'mix';
  headerPosition: 'top' | 'left' | 'right';
  columnWidthLeft: number;
  // Spacing (mm)
  marginLeftRight: number;
  marginTopBottom: number;
  spaceBetweenEntries: number;
  // Entry Layout
  entryLayoutStyle: 1 | 2 | 3 | 4;
  titleSubtitleSize: 's' | 'm' | 'l';
  subtitleStyle: 'normal' | 'bold' | 'italic';
  subtitlePlacement: 'same-line' | 'next-line';
  indentBody: boolean;
  listStyle: 'bullet' | 'hyphen';
}

export interface ResumeVersion { id: string; name: string; resumeId: string; createdAt: string; updatedAt: string; settings: ResumeSettings; sections: ResumeSection[]; }
export interface ExportRecord { id: string; resumeId: string; versionId: string; format: 'pdf' | 'docx'; exportedAt: string; fileName: string; }
export interface Resume { id: string; name: string; role: string; updatedAt: string; status: 'draft' | 'active'; }

interface StoreState {
  resumes: Resume[]; versions: ResumeVersion[]; exportHistory: ExportRecord[];
  selectedResumeId: string | null; selectedVersionId: string | null;
  editorSplitRatio: number; previewGridView: boolean;
  getSelectedResume: () => Resume | undefined;
  getSelectedVersion: () => ResumeVersion | undefined;
  getResumeVersions: (resumeId: string) => ResumeVersion[];
  getLastExports: (limit: number) => ExportRecord[];
  selectResume: (resumeId: string) => void;
  selectVersion: (versionId: string) => void;
  updateSettings: (versionId: string, settings: Partial<ResumeSettings>) => void;
  updateDesignSettings: (versionId: string, design: Partial<DesignSettings>) => void;
  toggleAtsSafeMode: (versionId: string) => void;
  reorderSections: (versionId: string, orderedSectionIds: string[]) => void;
  toggleSectionVisibility: (versionId: string, sectionId: string) => void;
  addSection: (versionId: string, section: Omit<ResumeSection, 'id' | 'order'>) => void;
  deleteSection: (versionId: string, sectionId: string) => void;
  updateSectionContent: (versionId: string, sectionId: string, content: Record<string, any>) => void;
  duplicateVersion: (resumeId: string, versionId: string) => void;
  renameVersion: (versionId: string, name: string) => void;
  deleteVersion: (versionId: string) => void;
  createResume: (payload: { name: string; role: string }) => string;
  renameResume: (resumeId: string, name: string) => void;
  deleteResume: (resumeId: string) => void;
  duplicateResume: (resumeId: string) => void;
  addExportRecord: (resumeId: string, versionId: string, format: 'pdf' | 'docx', fileName: string) => void;
  setSplitRatio: (ratio: number) => void;
  setPreviewGridView: (grid: boolean) => void;
  addSkillGroup: (versionId: string, heading: string) => void;
  updateSkillGroupHeading: (versionId: string, groupId: string, heading: string) => void;
  updateSkillGroupItems: (versionId: string, groupId: string, items: string[]) => void;
  removeSkillGroup: (versionId: string, groupId: string) => void;
  addSkillItem: (versionId: string, groupId: string, item: string) => void;
  removeSkillItem: (versionId: string, groupId: string, index: number) => void;
  addProject: (versionId: string, project: Omit<Project, 'id'>) => void;
  updateProject: (versionId: string, projectId: string, patch: Partial<Project>) => void;
  deleteProject: (versionId: string, projectId: string) => void;
  addCertification: (versionId: string, cert: Omit<Certification, 'id'>) => void;
  updateCertification: (versionId: string, certId: string, patch: Partial<Certification>) => void;
  deleteCertification: (versionId: string, certId: string) => void;
  addExperience: (versionId: string, exp: Omit<Experience, 'id'>) => void;
  updateExperience: (versionId: string, expId: string, patch: Partial<Experience>) => void;
  deleteExperience: (versionId: string, expId: string) => void;
  addEducation: (versionId: string, edu: Omit<Education, 'id'>) => void;
  updateEducation: (versionId: string, eduId: string, patch: Partial<Education>) => void;
  deleteEducation: (versionId: string, eduId: string) => void;
  reorderExperience: (versionId: string, orderedRoleIds: string[]) => void;
  reorderProjects: (versionId: string, orderedProjectIds: string[]) => void;
  reorderEducation: (versionId: string, orderedSchoolIds: string[]) => void;
  reorderSkillGroups: (versionId: string, orderedGroupIds: string[]) => void;
  reorderCertifications: (versionId: string, orderedCertIds: string[]) => void;
}

// New resume starts with zero sections — A4 sheet is blank until user adds sections via "Add Content"
function buildEmptySectionsForNewResume(): ResumeSection[] {
  return [];
}

const emptySections: ResumeSection[] = [
  { id: 'sec-personal-1', type: 'personal-info', title: 'Personal Info', visible: true, order: 0, content: { fullName: 'Siddu Reddy Madakala', headline: 'Software Developer', email: 'siddumadakala2001@gmail.com', phone: '6304944802', city: 'Bangalore', country: 'India', linkedin: 'LinkedIn', github: '', portfolio: 'Portfolio' } },
  { id: 'sec-summary-1', type: 'summary', title: 'Summary', visible: true, order: 1, content: { text: 'Full-Stack Developer with a strong focus on Python-based backend solutions, application troubleshooting, and performance optimization. Experienced in building and deploying scalable web applications using Python (Flask), JavaScript (React.js, Node.js), and cloud databases. Proven ability to monitor application health, resolve technical issues, and document processes in Agile environments.' } },
  { id: 'sec-exp-1', type: 'experience', title: 'Professional Experience', visible: true, order: 2, content: { roles: [{ id: 'exp-1', company: 'Must Play Games Pvt Ltd', title: 'Software Developer', location: 'Hyderabad, India', workType: 'Onsite', startDate: '06/2024', endDate: 'Present', bullets: ['Developed full-stack applications with Python (Flask) backend and React.js frontend, ensuring seamless integration and optimized user experience.', 'Provided technical troubleshooting for Python-based APIs and services, diagnosing and resolving runtime errors.', 'Monitored application performance using logs and error tracking, improving uptime and response times by 30%.', 'Collaborated with cross-functional teams to implement bug fixes, code enhancements, and feature upgrades under Agile development cycles.'], tech: [] }] } },
  { id: 'sec-projects-1', type: 'projects', title: 'Projects', visible: true, order: 3, content: { projects: [{ id: 'proj-1', name: 'Data Insights AI', role: '', startDate: '', endDate: '', techStack: [], link: '', bullets: ['Built a GenAI platform that lets users ask questions in natural language and get instant insights from structured data.', 'Integrated LLMs with Flask to generate SQL queries automatically, reducing the need for manual query writing.', 'Added AI features like auto-insights and data visualizations, cutting analysis time by 72% and effort by 40%.'] }, { id: 'proj-2', name: 'AI PDF Assistant', role: '', startDate: '', endDate: '', techStack: [], link: '', bullets: ['Built a system where users can ask questions to PDFs and get direct answers without reading through the files.', 'Used vector embeddings + similarity search with GPT-3.5 to enable contextual Q&A.', 'Designed the pipeline in Flask with real-time streaming for fast responses.'] }] } },
  { id: 'sec-skills-1', type: 'skills', title: 'Skills', visible: true, order: 4, content: { groups: [{ id: 'sg-1', heading: 'Languages', items: ['Python', 'Java', 'JavaScript', 'Node.js', 'HTML5'] }, { id: 'sg-2', heading: 'Technologies & Frameworks', items: ['Flask', 'React.js', 'CSS3', 'Bootstrap'] }, { id: 'sg-3', heading: 'AI-Tools', items: ['GPT-3.5', 'ChatGPT', 'LLMs', 'Agentic AI', 'Claude'] }, { id: 'sg-4', heading: 'Databases', items: ['SQL', 'NoSQL', 'Supabase'] }, { id: 'sg-5', heading: 'Tools', items: ['Git', 'Postman', 'VS Code'] }] } },
  { id: 'sec-edu-1', type: 'education', title: 'Education', visible: true, order: 5, content: { schools: [{ id: 'edu-1', school: 'Jawaharlal Nehru Technological University', degree: 'B.Tech in Computer Science & Engineering', field: '', startDate: '08/2019', endDate: '05/2023', grade: '', location: 'Eluru, India' }] } },
  { id: 'sec-certs-1', type: 'awards', title: 'Certifications', visible: true, order: 6, content: { certifications: [] } },
];

const defaultDesign: DesignSettings = {
  colorMode: 'basic', accentColor: '#374151',
  accentApplyName: true, accentApplyJobTitle: true, accentApplyHeadings: true, accentApplyHeadingsLine: true,
  accentApplyHeaderIcons: false, accentApplyDots: false, accentApplyDates: false, accentApplyLinkIcons: false,
  fontCategory: 'sans', fontFamily: 'Source Sans Pro',
  sectionHeadingStyle: 'underline', sectionHeadingCaps: 'uppercase', sectionHeadingSize: 's', sectionHeadingIcons: 'none',
  linkUnderline: false, linkBlueColor: false, linkIcon: true, linkIconStyle: 'chain',
  headerAlignment: 'left', headerArrangement: 'inline', headerContactStyle: 'icon', headerIconStyle: 0,
  headerSeparator: false, headerSeparatorStyle: 'bar',
  nameSize: 'xl', nameBold: true, nameFont: 'body',
  titleSize: 'm', titlePlacement: 'same-line', titleStyle: 'italic',
  showPhoto: false, photoUrl: '', photoShape: 'circle', photoSize: 'md',
  skillsLayout: 'bubble', skillsColumns: 1, skillsSubinfo: 'dash', skillsLevelStyle: 'text', skillsCompactStyle: 'bullet',
  showProfileHeading: true,
  educationOrder: 'school-degree',
  experienceOrder: 'title-company', groupPromotions: false,
  showFooter: false, footerPageNumbers: false, footerEmail: false, footerName: false,
};

const defaultSettings: ResumeSettings = {
  fontSize: 9, lineHeight: 1.15, paperSize: 'A4', template: 'ATS Clean', atsSafeMode: false,
  design: defaultDesign,
  layoutColumns: 'one', headerPosition: 'top', columnWidthLeft: 50,
  marginLeftRight: 12, marginTopBottom: 12, spaceBetweenEntries: 3,
  entryLayoutStyle: 1, titleSubtitleSize: 's', subtitleStyle: 'italic',
  subtitlePlacement: 'next-line', indentBody: true, listStyle: 'bullet',
};

const defaultResumes: Resume[] = [{ id: 'resume-1', name: 'My Resume', role: '', updatedAt: new Date().toISOString(), status: 'draft' }];
const defaultVersions: ResumeVersion[] = [{ id: 'v-1-1', name: 'v1 – Initial', resumeId: 'resume-1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), settings: defaultSettings, sections: emptySections }];

const updateVersionSections = (versions: ResumeVersion[], versionId: string, updater: (sections: ResumeSection[]) => ResumeSection[]) =>
  versions.map(v => v.id !== versionId ? v : { ...v, updatedAt: new Date().toISOString(), sections: updater(v.sections) });

const updateSkillSection = (sections: ResumeSection[], updater: (groups: SkillGroup[]) => SkillGroup[]) =>
  sections.map(s => s.type !== 'skills' ? s : { ...s, content: { ...s.content, groups: updater(s.content.groups || []) } });

function reorderByIds<T extends { id: string }>(arr: T[], orderedIds: string[]): T[] {
  const byId = new Map(arr.map(item => [item.id, item]));
  const result: T[] = [];
  for (const id of orderedIds) {
    const item = byId.get(id);
    if (item) result.push(item);
  }
  for (const item of arr) {
    if (!orderedIds.includes(item.id)) result.push(item);
  }
  return result;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      resumes: defaultResumes, versions: defaultVersions, exportHistory: [],
      selectedResumeId: 'resume-1', selectedVersionId: 'v-1-1',
      editorSplitRatio: 0.5, previewGridView: false,

      getSelectedResume: () => get().resumes.find(r => r.id === get().selectedResumeId),
      getSelectedVersion: () => get().versions.find(v => v.id === get().selectedVersionId),
      getResumeVersions: (rid) => get().versions.filter(v => v.resumeId === rid),
      getLastExports: (limit) => get().exportHistory.slice(-limit).reverse(),

      selectResume: (resumeId) => set({ selectedResumeId: resumeId }),
      selectVersion: (versionId) => set({ selectedVersionId: versionId }),

      updateSettings: (versionId, settings) =>
        set(s => ({ versions: s.versions.map(v => v.id !== versionId ? v : { ...v, settings: { ...v.settings, ...settings }, updatedAt: new Date().toISOString() }) })),

      updateDesignSettings: (versionId, design) =>
        set(s => ({ versions: s.versions.map(v => v.id !== versionId ? v : { ...v, settings: { ...v.settings, design: { ...v.settings.design, ...design } }, updatedAt: new Date().toISOString() }) })),

      toggleAtsSafeMode: (versionId) =>
        set(s => ({ versions: s.versions.map(v => v.id !== versionId ? v : { ...v, settings: { ...v.settings, atsSafeMode: !v.settings.atsSafeMode } }) })),

      reorderSections: (versionId, ids) =>
        set(s => ({ versions: updateVersionSections(s.versions, versionId, secs => ids.map((id, i) => ({ ...secs.find(x => x.id === id)!, order: i }))) })),

      toggleSectionVisibility: (versionId, sectionId) =>
        set(s => ({ versions: updateVersionSections(s.versions, versionId, secs => secs.map(x => x.id !== sectionId ? x : { ...x, visible: !x.visible })) })),

      addSection: (versionId, section) =>
        set(s => ({ versions: updateVersionSections(s.versions, versionId, secs => [...secs, { ...section, id: `sec-${Date.now()}`, order: Math.max(...secs.map(x => x.order), 0) + 1 }]) })),

      deleteSection: (versionId, sectionId) =>
        set(s => ({ versions: updateVersionSections(s.versions, versionId, secs => secs.filter(x => x.id !== sectionId)) })),

      updateSectionContent: (versionId, sectionId, content) =>
        set(s => ({ versions: updateVersionSections(s.versions, versionId, secs => secs.map(x => x.id !== sectionId ? x : { ...x, content: { ...x.content, ...content } })) })),

      duplicateVersion: (resumeId, versionId) =>
        set(s => { const v = s.versions.find(x => x.id === versionId); if (!v) return s; return { versions: [...s.versions, { ...v, id: `v-${Date.now()}`, name: `${v.name} (Copy)`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }] }; }),

      renameVersion: (versionId, name) =>
        set(s => ({ versions: s.versions.map(v => v.id !== versionId ? v : { ...v, name }) })),

      deleteVersion: (versionId) =>
        set(s => ({ versions: s.versions.filter(v => v.id !== versionId) })),

      createResume: ({ name, role }) => {
        const rid = `resume-${Date.now()}`;
        const vid = `v-${Date.now()}`;
        const now = new Date().toISOString();
        set(s => ({
          resumes: [...s.resumes, { id: rid, name, role, updatedAt: now, status: 'draft' }],
          versions: [...s.versions, { id: vid, name: 'v1 – Initial', resumeId: rid, createdAt: now, updatedAt: now, settings: defaultSettings, sections: buildEmptySectionsForNewResume() }],
        }));
        return rid;
      },

      renameResume: (resumeId, newName) =>
        set(s => ({ resumes: s.resumes.map(r => r.id !== resumeId ? r : { ...r, name: newName.trim() || r.name, updatedAt: new Date().toISOString() }) })),

      deleteResume: (resumeId) =>
        set(s => ({ resumes: s.resumes.filter(r => r.id !== resumeId), versions: s.versions.filter(v => v.resumeId !== resumeId) })),

      duplicateResume: (resumeId) =>
        set(s => { const r = s.resumes.find(x => x.id === resumeId); if (!r) return s; const nid = `resume-${Date.now()}`; const nv = s.versions.filter(v => v.resumeId === resumeId).map(v => ({ ...v, id: `v-${Date.now()}-${Math.random()}`, resumeId: nid, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })); return { resumes: [...s.resumes, { ...r, id: nid, name: `${r.name} (Copy)`, updatedAt: new Date().toISOString() }], versions: [...s.versions, ...nv] }; }),

      addExportRecord: (resumeId, versionId, format, fileName) =>
        set(s => ({ exportHistory: [...s.exportHistory, { id: `exp-${Date.now()}`, resumeId, versionId, format, exportedAt: new Date().toISOString(), fileName }] })),

      setSplitRatio: (ratio) => set({ editorSplitRatio: ratio }),
      setPreviewGridView: (grid) => set({ previewGridView: grid }),

      // Skill group
      addSkillGroup: (versionId, heading) =>
        set(s => ({ versions: updateVersionSections(s.versions, versionId, secs => updateSkillSection(secs, gs => [...gs, { id: `sg-${Date.now()}`, heading, items: [] }])) })),

      updateSkillGroupHeading: (versionId, groupId, heading) =>
        set(s => ({ versions: updateVersionSections(s.versions, versionId, secs => updateSkillSection(secs, gs => gs.map(g => g.id !== groupId ? g : { ...g, heading }))) })),

      updateSkillGroupItems: (versionId, groupId, items) =>
        set(s => ({ versions: updateVersionSections(s.versions, versionId, secs => updateSkillSection(secs, gs => gs.map(g => g.id !== groupId ? g : { ...g, items }))) })),

      removeSkillGroup: (versionId, groupId) =>
        set(s => ({ versions: updateVersionSections(s.versions, versionId, secs => updateSkillSection(secs, gs => gs.filter(g => g.id !== groupId))) })),

      addSkillItem: (versionId, groupId, item) =>
        set(s => ({ versions: updateVersionSections(s.versions, versionId, secs => updateSkillSection(secs, gs => gs.map(g => g.id !== groupId ? g : { ...g, items: [...g.items, item] }))) })),

      removeSkillItem: (versionId, groupId, index) =>
        set(s => ({ versions: updateVersionSections(s.versions, versionId, secs => updateSkillSection(secs, gs => gs.map(g => g.id !== groupId ? g : { ...g, items: g.items.filter((_: string, i: number) => i !== index) }))) })),

      // Projects
      addProject: (versionId, project) =>
        set(s => ({ versions: updateVersionSections(s.versions, versionId, secs => secs.map(x => x.type !== 'projects' ? x : { ...x, content: { ...x.content, projects: [...(x.content.projects || []), { ...project, id: `proj-${Date.now()}` }] } })) })),

      updateProject: (versionId, projectId, patch) =>
        set(s => ({ versions: updateVersionSections(s.versions, versionId, secs => secs.map(x => x.type !== 'projects' ? x : { ...x, content: { ...x.content, projects: x.content.projects.map((p: Project) => p.id !== projectId ? p : { ...p, ...patch }) } })) })),

      deleteProject: (versionId, projectId) =>
        set(s => ({ versions: updateVersionSections(s.versions, versionId, secs => secs.map(x => x.type !== 'projects' ? x : { ...x, content: { ...x.content, projects: x.content.projects.filter((p: Project) => p.id !== projectId) } })) })),

      // Certifications
      addCertification: (versionId, cert) =>
        set(s => ({ versions: updateVersionSections(s.versions, versionId, secs => secs.map(x => x.type !== 'awards' ? x : { ...x, content: { ...x.content, certifications: [...(x.content.certifications || []), { ...cert, id: `cert-${Date.now()}` }] } })) })),

      updateCertification: (versionId, certId, patch) =>
        set(s => ({ versions: updateVersionSections(s.versions, versionId, secs => secs.map(x => x.type !== 'awards' ? x : { ...x, content: { ...x.content, certifications: x.content.certifications.map((c: Certification) => c.id !== certId ? c : { ...c, ...patch }) } })) })),

      deleteCertification: (versionId, certId) =>
        set(s => ({ versions: updateVersionSections(s.versions, versionId, secs => secs.map(x => x.type !== 'awards' ? x : { ...x, content: { ...x.content, certifications: x.content.certifications.filter((c: Certification) => c.id !== certId) } })) })),

      // Experience
      addExperience: (versionId, exp) =>
        set(s => ({ versions: updateVersionSections(s.versions, versionId, secs => secs.map(x => x.type !== 'experience' ? x : { ...x, content: { ...x.content, roles: [...(x.content.roles || []), { ...exp, id: `exp-${Date.now()}` }] } })) })),

      updateExperience: (versionId, expId, patch) =>
        set(s => ({ versions: updateVersionSections(s.versions, versionId, secs => secs.map(x => x.type !== 'experience' ? x : { ...x, content: { ...x.content, roles: x.content.roles.map((r: Experience) => r.id !== expId ? r : { ...r, ...patch }) } })) })),

      deleteExperience: (versionId, expId) =>
        set(s => ({ versions: updateVersionSections(s.versions, versionId, secs => secs.map(x => x.type !== 'experience' ? x : { ...x, content: { ...x.content, roles: x.content.roles.filter((r: Experience) => r.id !== expId) } })) })),

      // Education
      addEducation: (versionId, edu) =>
        set(s => ({ versions: updateVersionSections(s.versions, versionId, secs => secs.map(x => x.type !== 'education' ? x : { ...x, content: { ...x.content, schools: [...(x.content.schools || []), { ...edu, id: `edu-${Date.now()}` }] } })) })),

      updateEducation: (versionId, eduId, patch) =>
        set(s => ({ versions: updateVersionSections(s.versions, versionId, secs => secs.map(x => x.type !== 'education' ? x : { ...x, content: { ...x.content, schools: x.content.schools.map((e: Education) => e.id !== eduId ? e : { ...e, ...patch }) } })) })),

      deleteEducation: (versionId, eduId) =>
        set(s => ({ versions: updateVersionSections(s.versions, versionId, secs => secs.map(x => x.type !== 'education' ? x : { ...x, content: { ...x.content, schools: x.content.schools.filter((e: Education) => e.id !== eduId) } })) })),

      reorderExperience: (versionId, orderedRoleIds) =>
        set(s => ({ versions: updateVersionSections(s.versions, versionId, secs => secs.map(x => x.type !== 'experience' ? x : { ...x, content: { ...x.content, roles: reorderByIds(x.content.roles || [], orderedRoleIds) } })) })),

      reorderProjects: (versionId, orderedProjectIds) =>
        set(s => ({ versions: updateVersionSections(s.versions, versionId, secs => secs.map(x => x.type !== 'projects' ? x : { ...x, content: { ...x.content, projects: reorderByIds(x.content.projects || [], orderedProjectIds) } })) })),

      reorderEducation: (versionId, orderedSchoolIds) =>
        set(s => ({ versions: updateVersionSections(s.versions, versionId, secs => secs.map(x => x.type !== 'education' ? x : { ...x, content: { ...x.content, schools: reorderByIds(x.content.schools || [], orderedSchoolIds) } })) })),

      reorderSkillGroups: (versionId, orderedGroupIds) =>
        set(s => ({ versions: updateVersionSections(s.versions, versionId, secs => updateSkillSection(secs, gs => reorderByIds(gs, orderedGroupIds))) })),

      reorderCertifications: (versionId, orderedCertIds) =>
        set(s => ({ versions: updateVersionSections(s.versions, versionId, secs => secs.map(x => x.type !== 'awards' ? x : { ...x, content: { ...x.content, certifications: reorderByIds(x.content.certifications || [], orderedCertIds) } })) })),
    }),
    { name: 'resume-editor-store-v6', partialize: (s: StoreState) => ({ resumes: s.resumes, versions: s.versions, selectedResumeId: s.selectedResumeId, selectedVersionId: s.selectedVersionId }) }
  )
);
