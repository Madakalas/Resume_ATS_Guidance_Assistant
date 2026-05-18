'use client';

import { useState } from 'react';
import {
  FileText,
  Download,
  AlertCircle,
  CheckCircle,
  Loader,
} from 'lucide-react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface ExportOptionsCardProps {
  onExportSuccess: (fileName: string) => void;
}

const resumes = [
  { id: 'resume1', name: 'John Doe', roles: ['Backend Engineer', 'Senior Backend', 'Full Stack Dev'] },
];

const versions = {
  resume1: [
    { id: 'v1', name: 'v1 Base' },
    { id: 'v2', name: 'v2 Backend India' },
    { id: 'v3', name: 'v3 Full Stack' },
    { id: 'v4', name: 'v4 Startup Focused' },
  ],
};

export function ExportOptionsCard({ onExportSuccess }: ExportOptionsCardProps) {
  const { toast } = useToast();
  const [selectedResume, setSelectedResume] = useState('resume1');
  const [selectedVersion, setSelectedVersion] = useState('v3');
  const [selectedRole, setSelectedRole] = useState('Full Stack Dev');
  const [fileName, setFileName] = useState('John_Doe_Full_Stack_Dev');
  const [atsSafeMode, setAtsSafeMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const resumeData = resumes.find((r) => r.id === selectedResume);
  const resumeVersions = versions[selectedResume as keyof typeof versions] || [];
  const availableRoles = resumeData?.roles || [];

  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    const cleanedRole = role.replace(/\s+/g, '_');
    setFileName(`John_Doe_${cleanedRole}`);
  };

  const handleVersionChange = (versionId: string) => {
    setSelectedVersion(versionId);
  };

  const handleGeneratePDF = async () => {
    setIsLoading(true);
    setIsSuccess(false);

    // Simulate PDF generation
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);

      toast({
        title: 'Export successful!',
        description: `${fileName}.pdf has been generated.`,
        duration: 5000,
      });

      onExportSuccess(fileName + '.pdf');

      // Reset success state
      setTimeout(() => setIsSuccess(false), 3000);
    }, 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export Options
        </CardTitle>
        <CardDescription>
          Generate ATS-optimized PDF exports of your resume
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resume Selection */}
        <div>
          <Label htmlFor="resume-select" className="text-sm font-medium">
            Select Resume
          </Label>
          <Select value={selectedResume} onValueChange={setSelectedResume}>
            <SelectTrigger id="resume-select" className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {resumes.map((resume) => (
                <SelectItem key={resume.id} value={resume.id}>
                  {resume.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Version Selection */}
        <div>
          <Label htmlFor="version-select" className="text-sm font-medium">
            Select Version
          </Label>
          <Select value={selectedVersion} onValueChange={handleVersionChange}>
            <SelectTrigger id="version-select" className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {resumeVersions.map((version) => (
                <SelectItem key={version.id} value={version.id}>
                  {version.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Role Selection */}
        <div>
          <Label htmlFor="role-select" className="text-sm font-medium">
            Target Role
          </Label>
          <Select value={selectedRole} onValueChange={handleRoleChange}>
            <SelectTrigger id="role-select" className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableRoles.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Export Format */}
        <div>
          <Label htmlFor="format-select" className="text-sm font-medium">
            Export Format
          </Label>
          <div className="flex gap-3 mt-2">
            <Button
              variant="outline"
              className="flex-1 border-2 border-primary bg-primary/5"
              disabled
            >
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <div className="relative flex-1">
              <Button variant="outline" className="w-full opacity-50 cursor-not-allowed">
                DOCX
              </Button>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs bg-background px-2 rounded border border-border">
                  Phase 2
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* File Name Input */}
        <div>
          <Label htmlFor="filename" className="text-sm font-medium">
            File Name
          </Label>
          <div className="mt-2 flex gap-2">
            <Input
              id="filename"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="e.g., John_Doe_Backend"
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground py-2">.pdf</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Auto-suggested based on name and role
          </p>
        </div>

        {/* ATS Safe Mode Toggle */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-primary" />
            <div>
              <p className="text-sm font-medium">ATS Safe Mode</p>
              <p className="text-xs text-muted-foreground">
                Removes images, colors, and complex formatting
              </p>
            </div>
          </div>
          <button
            onClick={() => setAtsSafeMode(!atsSafeMode)}
            className={`w-12 h-6 rounded-full border-2 flex items-center transition-all ${
              atsSafeMode
                ? 'bg-primary border-primary'
                : 'bg-background border-border'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                atsSafeMode ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGeneratePDF}
          disabled={isLoading || isSuccess}
          className="w-full h-11 text-base"
          size="lg"
        >
          {isSuccess ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Exported Successfully
            </>
          ) : isLoading ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Generate PDF
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
