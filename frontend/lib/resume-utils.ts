/** Shape used by calculateCompleteness / estimatePages (editor form data) */
export interface ResumeFormData {
  personalInfo: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    title?: string;
    linkedin?: string;
  };
  summary: string;
  skills: Array<{ category: string; items: string[] }>;
  experience: Array<{ company: string; role: string; bullets: string[] }>;
  education: Array<{ school: string; degree: string }>;
  projects: Array<{ name: string; bullets: string[] }>;
  certifications: Array<{ name: string }>;
}

const ACTION_VERBS = [
  'Achieved',
  'Built',
  'Created',
  'Designed',
  'Developed',
  'Engineered',
  'Implemented',
  'Improved',
  'Increased',
  'Reduced',
  'Led',
  'Managed',
  'Optimized',
  'Architected',
  'Deployed',
  'Launched',
  'Migrated',
  'Enhanced',
  'Streamlined',
  'Accelerated',
];

export function hasActionVerb(text: string): boolean {
  const words = text.split(/\s+/);
  const firstWord = words[0];
  return ACTION_VERBS.some((verb) => verb.toLowerCase() === firstWord.toLowerCase());
}

export function validateBulletPoint(
  text: string,
): 'weak' | 'good' | 'strong' {
  if (!text || text.trim().length < 20) return 'weak';
  if (text.length < 50) return 'good';
  if (!hasActionVerb(text)) return 'good';
  if (text.includes('%') || text.includes('$') || /\d+x/.test(text)) {
    return 'strong';
  }
  return 'strong';
}

export function calculateCompleteness(resume: ResumeFormData): number {
  let completed = 0;
  let total = 0;
  const pi = resume.personalInfo || {};

  // Personal Info (6 required fields)
  total += 6;
  if (pi.name) completed++;
  if (pi.email) completed++;
  if (pi.phone) completed++;
  if (pi.location) completed++;
  if (pi.title) completed++;
  if (pi.linkedin) completed++;

  // Summary
  total += 1;
  if ((resume.summary || '').trim().length > 20) completed++;

  // Skills
  total += 1;
  if ((resume.skills || []).length > 0 && resume.skills.some((s) => (s.items || []).length > 0))
    completed++;

  // Experience
  total += 1;
  if ((resume.experience || []).length > 0) completed++;

  // Education
  total += 1;
  if ((resume.education || []).length > 0) completed++;

  return Math.round((completed / total) * 100);
}

export function estimatePages(resume: ResumeFormData): number {
  // Rough estimate: count characters and divide by typical page capacity
  let totalChars = 0;
  const pi = resume.personalInfo || {};

  totalChars += (pi.name || '').length;
  totalChars += (pi.title || '').length;
  totalChars += (resume.summary || '').length;

  (resume.skills || []).forEach((skill) => {
    totalChars += skill.category.length;
    skill.items.forEach((item) => {
      totalChars += item.length;
    });
  });

  (resume.experience || []).forEach((exp) => {
    totalChars += exp.company.length + exp.role.length;
    exp.bullets.forEach((bullet) => {
      totalChars += bullet.length;
    });
  });

  (resume.projects || []).forEach((proj) => {
    totalChars += proj.name.length;
    proj.bullets.forEach((bullet) => {
      totalChars += bullet.length;
    });
  });

  (resume.education || []).forEach((edu) => {
    totalChars += edu.school.length + edu.degree.length;
  });

  (resume.certifications || []).forEach((cert) => {
    totalChars += cert.name.length;
  });

  // Typical resume page has ~2000-2500 characters (accounting for formatting)
  return Math.ceil(totalChars / 2200);
}
