'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface CreateResumeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateResume?: (data: {
    name: string;
    role: string;
    template: string;
    countryMode: string;
  }) => void;
  defaultTemplate?: string;
}

export function CreateResumeModal({
  open,
  onOpenChange,
  onCreateResume,
  defaultTemplate,
}: CreateResumeModalProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [template, setTemplate] = useState(defaultTemplate || 'ats-clean');
  const [countryMode, setCountryMode] = useState('us');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedRole = role.trim();
    if (trimmedName && trimmedRole) {
      if (onCreateResume) {
        onCreateResume({
          name: trimmedName,
          role: trimmedRole,
          template,
          countryMode,
        });
      }
      setName('');
      setRole('');
      setTemplate(defaultTemplate || 'ats-clean');
      setCountryMode('us');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Resume</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new resume and start editing.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Resume Name */}
          <div className="space-y-2">
            <Label htmlFor="resume-name">Resume Name</Label>
            <Input
              id="resume-name"
              placeholder="e.g., Backend Engineer"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              A name to identify this resume
            </p>
          </div>

          {/* Target Role */}
          <div className="space-y-2">
            <Label htmlFor="target-role">Target Role</Label>
            <Input
              id="target-role"
              placeholder="e.g., Senior Backend Engineer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              The role you're applying for
            </p>
          </div>

          {/* Template */}
          <div className="space-y-2">
            <Label htmlFor="template">Template</Label>
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger id="template">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ats-clean">ATS Clean (Recommended)</SelectItem>
                <SelectItem value="modern-minimal">Modern Minimal</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose a template to start with
            </p>
          </div>

          {/* Country Mode */}
          <div className="space-y-2">
            <Label htmlFor="country">Country Mode</Label>
            <Select value={countryMode} onValueChange={setCountryMode}>
              <SelectTrigger id="country">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="us">US</SelectItem>
                <SelectItem value="india">India</SelectItem>
                <SelectItem value="eu">EU</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Adjusts date formats and regional expectations
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={!name.trim() || !role.trim()}
            >
              Create & Edit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
