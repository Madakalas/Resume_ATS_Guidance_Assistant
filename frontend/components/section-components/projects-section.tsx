'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, Plus } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface Project {
  id: string;
  name: string;
  techStack: string[];
  bullets: string[];
  link?: string;
}

export default function ProjectsSection({
  data,
  onChange,
}: {
  data: Project[];
  onChange: (data: Project[]) => void;
}) {
  const addProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      name: '',
      techStack: [],
      bullets: [],
      link: '',
    };
    onChange([...data, newProject]);
  };

  const removeProject = (id: string) => {
    onChange(data.filter((proj) => proj.id !== id));
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    onChange(
      data.map((proj) => (proj.id === id ? { ...proj, ...updates } : proj))
    );
  };

  const addBullet = (projId: string) => {
    onChange(
      data.map((proj) =>
        proj.id === projId ? { ...proj, bullets: [...proj.bullets, ''] } : proj
      )
    );
  };

  const removeBullet = (projId: string, bulletIndex: number) => {
    onChange(
      data.map((proj) =>
        proj.id === projId
          ? {
              ...proj,
              bullets: proj.bullets.filter((_, i) => i !== bulletIndex),
            }
          : proj
      )
    );
  };

  const updateBullet = (projId: string, bulletIndex: number, value: string) => {
    onChange(
      data.map((proj) =>
        proj.id === projId
          ? {
              ...proj,
              bullets: proj.bullets.map((b, i) => (i === bulletIndex ? value : b)),
            }
          : proj
      )
    );
  };

  const addTech = (projId: string, tech: string) => {
    if (tech.trim()) {
      onChange(
        data.map((proj) =>
          proj.id === projId
            ? { ...proj, techStack: [...proj.techStack, tech.trim()] }
            : proj
        )
      );
    }
  };

  const removeTech = (projId: string, techIndex: number) => {
    onChange(
      data.map((proj) =>
        proj.id === projId
          ? {
              ...proj,
              techStack: proj.techStack.filter((_, i) => i !== techIndex),
            }
          : proj
      )
    );
  };

  return (
    <div className="space-y-4">
      <Accordion type="single" collapsible className="w-full">
        {data.map((project, index) => (
          <AccordionItem key={project.id} value={project.id}>
            <div className="flex items-center justify-between">
              <AccordionTrigger className="flex-1">
                <div className="text-left">
                  <p className="font-medium text-sm">
                    {project.name || `Project ${index + 1}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {project.techStack.slice(0, 3).join(', ') || 'No tech stack'}
                  </p>
                </div>
              </AccordionTrigger>
              <button
                onClick={() => removeProject(project.id)}
                className="text-muted-foreground hover:text-foreground transition-colors ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <AccordionContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`name-${project.id}`} className="text-sm">
                  Project Name
                </Label>
                <Input
                  id={`name-${project.id}`}
                  value={project.name}
                  onChange={(e) =>
                    updateProject(project.id, { name: e.target.value })
                  }
                  placeholder="My Awesome Project"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`link-${project.id}`} className="text-sm">
                  Link (GitHub, Demo, etc.)
                </Label>
                <Input
                  id={`link-${project.id}`}
                  value={project.link || ''}
                  onChange={(e) =>
                    updateProject(project.id, { link: e.target.value })
                  }
                  placeholder="github.com/username/project"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`tech-${project.id}`} className="text-sm">
                  Tech Stack
                </Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {project.techStack.map((tech, techIndex) => (
                    <div
                      key={techIndex}
                      className="flex items-center gap-2 bg-muted px-3 py-1 rounded-full text-sm"
                    >
                      <span>{tech}</span>
                      <button
                        onClick={() => removeTech(project.id, techIndex)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    id={`tech-${project.id}`}
                    placeholder="e.g., Python, React, AWS"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTech(project.id, e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-border">
                <p className="text-sm font-medium mb-3">Key Contributions</p>
                <div className="space-y-3">
                  {project.bullets.map((bullet, bulletIndex) => (
                    <div key={bulletIndex} className="flex items-start gap-2">
                      <Textarea
                        value={bullet}
                        onChange={(e) =>
                          updateBullet(project.id, bulletIndex, e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.shiftKey) {
                            e.preventDefault();
                            addBullet(project.id);
                            // Focus the new textarea after render
                            setTimeout(() => {
                              const textareas = document.querySelectorAll<HTMLTextAreaElement>(
                                `[data-proj="${project.id}"] textarea`
                              );
                              textareas[textareas.length - 1]?.focus();
                            }, 50);
                          }
                        }}
                        placeholder="Describe what you built and the impact"
                        className="min-h-12 resize-none flex-1 text-sm"
                        data-proj={project.id}
                      />
                      <button
                        onClick={() => removeBullet(project.id, bulletIndex)}
                        className="text-muted-foreground hover:text-foreground transition-colors mt-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addBullet(project.id)}
                  className="mt-3 gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Contribution
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <Button
        onClick={addProject}
        variant="outline"
        className="w-full gap-1"
      >
        <Plus className="w-4 h-4" />
        Add Project
      </Button>
    </div>
  );
}
