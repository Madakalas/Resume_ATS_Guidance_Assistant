'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X, Plus } from 'lucide-react';

interface Skill {
  category: string;
  items: string[];
}

export default function SkillsSection({
  data,
  onChange,
}: {
  data: Skill[];
  onChange: (data: Skill[]) => void;
}) {
  const [newSkillInputs, setNewSkillInputs] = useState<Record<string, string>>({});

  const addSkill = (categoryIndex: number) => {
    const category = data[categoryIndex];
    const inputValue = newSkillInputs[categoryIndex] || '';

    if (inputValue.trim()) {
      const updated = [...data];
      updated[categoryIndex] = {
        ...category,
        items: [...category.items, inputValue.trim()],
      };
      onChange(updated);
      setNewSkillInputs({ ...newSkillInputs, [categoryIndex]: '' });
    }
  };

  const removeSkill = (categoryIndex: number, itemIndex: number) => {
    const updated = [...data];
    updated[categoryIndex] = {
      ...updated[categoryIndex],
      items: updated[categoryIndex].items.filter((_, i) => i !== itemIndex),
    };
    onChange(updated);
  };

  const updateCategory = (index: number, value: string) => {
    const updated = [...data];
    updated[index] = { ...updated[index], category: value };
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      {data.map((skillGroup, categoryIndex) => (
        <div key={categoryIndex} className="space-y-3 pb-4 border-b border-border last:border-0">
          <div className="space-y-2">
            <Label className="text-sm">Category</Label>
            <Input
              value={skillGroup.category}
              onChange={(e) => updateCategory(categoryIndex, e.target.value)}
              placeholder="e.g., Languages, Frameworks"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Skills</Label>
            <div className="flex flex-wrap gap-2">
              {skillGroup.items.map((skill, itemIndex) => (
                <div
                  key={itemIndex}
                  className="flex items-center gap-2 bg-muted px-3 py-1 rounded-full text-sm"
                >
                  <span>{skill}</span>
                  <button
                    onClick={() => removeSkill(categoryIndex, itemIndex)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              value={newSkillInputs[categoryIndex] || ''}
              onChange={(e) =>
                setNewSkillInputs({
                  ...newSkillInputs,
                  [categoryIndex]: e.target.value,
                })
              }
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSkill(categoryIndex);
                }
              }}
              placeholder="Add a skill..."
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => addSkill(categoryIndex)}
              className="gap-1"
            >
              <Plus className="w-3 h-3" />
              Add
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
