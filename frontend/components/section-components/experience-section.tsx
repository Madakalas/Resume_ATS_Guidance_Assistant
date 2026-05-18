'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, Plus, Zap } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { validateBulletPoint } from '@/lib/resume-utils';
import { MonthYearPicker } from '@/components/ui/month-year-picker';

interface Experience {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

export default function ExperienceSection({
  data,
  onChange,
}: {
  data: Experience[];
  onChange: (data: Experience[]) => void;
}) {
  const addExperience = () => {
    const newExp: Experience = {
      id: Date.now().toString(),
      company: '',
      role: '',
      location: '',
      startDate: '',
      endDate: '',
      bullets: [],
    };
    onChange([...data, newExp]);
  };

  const removeExperience = (id: string) => {
    onChange(data.filter((exp) => exp.id !== id));
  };

  const updateExperience = (id: string, updates: Partial<Experience>) => {
    onChange(
      data.map((exp) => (exp.id === id ? { ...exp, ...updates } : exp))
    );
  };

  const addBullet = (expId: string) => {
    onChange(
      data.map((exp) =>
        exp.id === expId ? { ...exp, bullets: [...exp.bullets, ''] } : exp
      )
    );
  };

  const removeBullet = (expId: string, bulletIndex: number) => {
    onChange(
      data.map((exp) =>
        exp.id === expId
          ? {
              ...exp,
              bullets: exp.bullets.filter((_, i) => i !== bulletIndex),
            }
          : exp
      )
    );
  };

  const updateBullet = (expId: string, bulletIndex: number, value: string) => {
    onChange(
      data.map((exp) =>
        exp.id === expId
          ? {
              ...exp,
              bullets: exp.bullets.map((b, i) => (i === bulletIndex ? value : b)),
            }
          : exp
      )
    );
  };

  return (
    <div className="space-y-4">
      <Accordion type="single" collapsible className="w-full">
        {data.map((experience, index) => (
          <AccordionItem key={experience.id} value={experience.id}>
            <div className="flex items-center justify-between">
              <AccordionTrigger className="flex-1">
                <div className="text-left">
                  <p className="font-medium text-sm">
                    {experience.role || `Experience ${index + 1}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {experience.company || 'No company'}
                  </p>
                </div>
              </AccordionTrigger>
              <button
                onClick={() => removeExperience(experience.id)}
                className="text-muted-foreground hover:text-foreground transition-colors ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <AccordionContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`company-${experience.id}`} className="text-sm">
                    Company
                  </Label>
                  <Input
                    id={`company-${experience.id}`}
                    value={experience.company}
                    onChange={(e) =>
                      updateExperience(experience.id, { company: e.target.value })
                    }
                    placeholder="TechCorp"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`role-${experience.id}`} className="text-sm">
                    Role
                  </Label>
                  <Input
                    id={`role-${experience.id}`}
                    value={experience.role}
                    onChange={(e) =>
                      updateExperience(experience.id, { role: e.target.value })
                    }
                    placeholder="Senior Software Engineer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`startDate-${experience.id}`} className="text-sm">
                    Start Date
                  </Label>
                  <MonthYearPicker
                    id={`startDate-${experience.id}`}
                    value={experience.startDate}
                    onChange={(v) => updateExperience(experience.id, { startDate: v })}
                    placeholder="Select start date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`endDate-${experience.id}`} className="text-sm">
                    End Date
                  </Label>
                  <MonthYearPicker
                    id={`endDate-${experience.id}`}
                    value={experience.endDate}
                    onChange={(v) => updateExperience(experience.id, { endDate: v })}
                    placeholder="Select end date"
                    allowPresent={true}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`location-${experience.id}`} className="text-sm">
                  Location
                </Label>
                <Input
                  id={`location-${experience.id}`}
                  value={experience.location}
                  onChange={(e) =>
                    updateExperience(experience.id, { location: e.target.value })
                  }
                  placeholder="San Francisco, CA"
                />
              </div>

              <div className="pt-2 border-t border-border">
                <p className="text-sm font-medium mb-3">Achievements</p>
                <div className="space-y-3">
                  {experience.bullets.map((bullet, bulletIndex) => {
                    const strength = validateBulletPoint(bullet);
                    return (
                      <div key={bulletIndex} className="space-y-1">
                        <div className="flex items-start gap-2">
                          <Textarea
                            value={bullet}
                            onChange={(e) =>
                              updateBullet(experience.id, bulletIndex, e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.shiftKey) {
                                e.preventDefault();
                                addBullet(experience.id);
                              }
                            }}
                            placeholder="Started with action verb: Achieved, Built, Created, etc."
                            className="min-h-12 resize-none flex-1 text-sm"
                          />
                          <button
                            onClick={() => removeBullet(experience.id, bulletIndex)}
                            className="text-muted-foreground hover:text-foreground transition-colors mt-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <Zap
                            className={`w-3 h-3 ${
                              strength === 'strong'
                                ? 'text-green-600 dark:text-green-400'
                                : strength === 'good'
                                  ? 'text-yellow-600 dark:text-yellow-400'
                                  : 'text-gray-400'
                            }`}
                          />
                          <span
                            className={`text-xs ${
                              strength === 'strong'
                                ? 'text-green-600 dark:text-green-400'
                                : strength === 'good'
                                  ? 'text-yellow-600 dark:text-yellow-400'
                                  : 'text-gray-400'
                            }`}
                          >
                            {strength === 'strong'
                              ? 'Strong'
                              : strength === 'good'
                                ? 'Good'
                                : 'Weak'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addBullet(experience.id)}
                  className="mt-3 gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Achievement
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <Button
        onClick={addExperience}
        variant="outline"
        className="w-full gap-1"
      >
        <Plus className="w-4 h-4" />
        Add Experience
      </Button>
    </div>
  );
}
