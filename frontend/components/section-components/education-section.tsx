'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { MonthYearPicker } from '@/components/ui/month-year-picker';

interface Education {
  id: string;
  school: string;
  degree: string;
  startDate: string;
  endDate: string;
  gpa?: string;
}

export default function EducationSection({
  data,
  onChange,
}: {
  data: Education[];
  onChange: (data: Education[]) => void;
}) {
  const addEducation = () => {
    const newEdu: Education = {
      id: Date.now().toString(),
      school: '',
      degree: '',
      startDate: '',
      endDate: '',
      gpa: '',
    };
    onChange([...data, newEdu]);
  };

  const removeEducation = (id: string) => {
    onChange(data.filter((edu) => edu.id !== id));
  };

  const updateEducation = (id: string, updates: Partial<Education>) => {
    onChange(
      data.map((edu) => (edu.id === id ? { ...edu, ...updates } : edu))
    );
  };

  return (
    <div className="space-y-4">
      <Accordion type="single" collapsible className="w-full">
        {data.map((education, index) => (
          <AccordionItem key={education.id} value={education.id}>
            <div className="flex items-center justify-between">
              <AccordionTrigger className="flex-1">
                <div className="text-left">
                  <p className="font-medium text-sm">
                    {education.degree || `Education ${index + 1}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {education.school || 'No school'}
                  </p>
                </div>
              </AccordionTrigger>
              <button
                onClick={() => removeEducation(education.id)}
                className="text-muted-foreground hover:text-foreground transition-colors ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <AccordionContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`school-${education.id}`} className="text-sm">
                  School / University
                </Label>
                <Input
                  id={`school-${education.id}`}
                  value={education.school}
                  onChange={(e) =>
                    updateEducation(education.id, { school: e.target.value })
                  }
                  placeholder="University of California"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`degree-${education.id}`} className="text-sm">
                  Degree
                </Label>
                <Input
                  id={`degree-${education.id}`}
                  value={education.degree}
                  onChange={(e) =>
                    updateEducation(education.id, { degree: e.target.value })
                  }
                  placeholder="BS Computer Science"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`startDate-${education.id}`} className="text-sm">
                    Start Date
                  </Label>
                  <MonthYearPicker
                    id={`startDate-${education.id}`}
                    value={education.startDate}
                    onChange={(v) => updateEducation(education.id, { startDate: v })}
                    placeholder="Select start date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`endDate-${education.id}`} className="text-sm">
                    End Date
                  </Label>
                  <MonthYearPicker
                    id={`endDate-${education.id}`}
                    value={education.endDate}
                    onChange={(v) => updateEducation(education.id, { endDate: v })}
                    placeholder="Select end date"
                    allowPresent={true}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`gpa-${education.id}`} className="text-sm">
                  GPA (Optional)
                </Label>
                <Input
                  id={`gpa-${education.id}`}
                  value={education.gpa || ''}
                  onChange={(e) =>
                    updateEducation(education.id, { gpa: e.target.value })
                  }
                  placeholder="3.8"
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <Button
        onClick={addEducation}
        variant="outline"
        className="w-full gap-1"
      >
        <Plus className="w-4 h-4" />
        Add Education
      </Button>
    </div>
  );
}
