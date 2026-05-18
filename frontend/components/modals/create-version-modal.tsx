'use client';

import { useState } from 'react';
import { Version } from '@/app/versions/page';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CreateVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (version: Omit<Version, 'id' | 'status' | 'createdAt' | 'sections'>) => void;
  existingVersions: Version[];
}

export default function CreateVersionModal({
  isOpen,
  onClose,
  onCreate,
  existingVersions,
}: CreateVersionModalProps) {
  const [cloneFromId, setCloneFromId] = useState<string>('');
  const [versionName, setVersionName] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (versionName.trim() && targetRole.trim()) {
      setIsSubmitting(true);
      setTimeout(() => {
        onCreate({
          name: versionName.trim(),
          targetRole: targetRole.trim(),
          notes: cloneFromId ? `Cloned from ${existingVersions.find(v => v.id === cloneFromId)?.name}` : '',
        });
        setVersionName('');
        setTargetRole('');
        setCloneFromId('');
        setIsSubmitting(false);
      }, 300);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Version</DialogTitle>
          <DialogDescription>
            Create a new version by cloning from an existing one or starting fresh.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Clone From */}
          <div className="space-y-2">
            <Label htmlFor="clone-from">Clone from existing version (optional)</Label>
            <Select value={cloneFromId} onValueChange={setCloneFromId}>
              <SelectTrigger id="clone-from">
                <SelectValue placeholder="Select a version to clone from..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Start with empty template</SelectItem>
                {existingVersions.map((version) => (
                  <SelectItem key={version.id} value={version.id}>
                    {version.name} ({version.targetRole})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Selecting a version will copy all its sections and content.
            </p>
          </div>

          {/* Version Name */}
          <div className="space-y-2">
            <Label htmlFor="version-name">Version name*</Label>
            <Input
              id="version-name"
              placeholder="e.g., v5 European Tech"
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Use a clear naming pattern like v1, v2, v3, etc.
            </p>
          </div>

          {/* Target Role */}
          <div className="space-y-2">
            <Label htmlFor="target-role">Target role*</Label>
            <Input
              id="target-role"
              placeholder="e.g., Senior Backend Engineer"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              The job title this version is optimized for.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !versionName.trim() || !targetRole.trim()}>
              {isSubmitting ? 'Creating...' : 'Create Version'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
