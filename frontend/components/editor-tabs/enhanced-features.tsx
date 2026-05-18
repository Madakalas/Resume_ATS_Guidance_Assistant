'use client';

import { useStore } from '@/lib/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

export default function EnhancedFeaturesTab() {
  const store = useStore();
  const version = store.getSelectedVersion();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  if (!version) return null;

  return (
    <div className="space-y-6">
      {/* Experience Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>💼</span> Work Experience
          </CardTitle>
          <CardDescription>Add your professional roles and achievements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Company Name</Label>
                <Input placeholder="Tech Corp Inc." />
              </div>
              <div>
                <Label>Job Title</Label>
                <Input placeholder="Senior Engineer" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Date</Label>
                <Input type="month" />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="month" />
              </div>
            </div>
            <div>
              <Label>Location</Label>
              <Input placeholder="San Francisco, CA" />
            </div>
            <div>
              <Label>Description</Label>
              <textarea className="w-full border rounded p-2 text-sm" rows={3} placeholder="What did you accomplish?" />
            </div>
            <Button className="w-full">Add Experience</Button>
          </div>
        </CardContent>
      </Card>

      {/* Education Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🎓</span> Education
          </CardTitle>
          <CardDescription>Your academic background and degrees</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>School/University</Label>
                <Input placeholder="Stanford University" />
              </div>
              <div>
                <Label>Degree</Label>
                <Input placeholder="Bachelor of Science" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Field of Study</Label>
                <Input placeholder="Computer Science" />
              </div>
              <div>
                <Label>Graduation Date</Label>
                <Input type="month" />
              </div>
            </div>
            <div>
              <Label>Grade/GPA (Optional)</Label>
              <Input placeholder="3.8" />
            </div>
            <Button className="w-full">Add Education</Button>
          </div>
        </CardContent>
      </Card>

      {/* Skills Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>⭐</span> Skills & Expertise
          </CardTitle>
          <CardDescription>Group your skills by category</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <Label>Skill Category</Label>
              <Input placeholder="e.g., Programming Languages, Frontend, DevOps" />
            </div>
            <div>
              <Label>Skills (comma-separated)</Label>
              <Input placeholder="React, TypeScript, Next.js, Node.js" />
            </div>
            <Button className="w-full">Add Skill Group</Button>
          </div>
        </CardContent>
      </Card>

      {/* Projects Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🚀</span> Projects & Portfolio
          </CardTitle>
          <CardDescription>Showcase your best work</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <Label>Project Name</Label>
              <Input placeholder="E-commerce Platform" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Your Role</Label>
                <Input placeholder="Full-Stack Engineer" />
              </div>
              <div>
                <Label>Date Range</Label>
                <Input placeholder="Jan 2023 - Dec 2023" />
              </div>
            </div>
            <div>
              <Label>Technologies Used</Label>
              <Input placeholder="React, Node.js, MongoDB, AWS" />
            </div>
            <div>
              <Label>Project Link (Optional)</Label>
              <Input placeholder="github.com/yourproject" />
            </div>
            <div>
              <Label>Description</Label>
              <textarea className="w-full border rounded p-2 text-sm" rows={3} placeholder="Describe the project and impact" />
            </div>
            <Button className="w-full">Add Project</Button>
          </div>
        </CardContent>
      </Card>

      {/* Certifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🏆</span> Certifications & Awards
          </CardTitle>
          <CardDescription>Professional credentials and recognition</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Certification Name</Label>
                <Input placeholder="AWS Certified Solutions Architect" />
              </div>
              <div>
                <Label>Issuing Organization</Label>
                <Input placeholder="Amazon Web Services" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Issue Date</Label>
                <Input type="month" />
              </div>
              <div>
                <Label>Expiry Date (if applicable)</Label>
                <Input type="month" />
              </div>
            </div>
            <div>
              <Label>Credential ID (Optional)</Label>
              <Input placeholder="XXXXXX-XXXXXX" />
            </div>
            <div>
              <Label>Credential URL (Optional)</Label>
              <Input placeholder="https://example.com/verify" />
            </div>
            <Button className="w-full">Add Certification</Button>
          </div>
        </CardContent>
      </Card>

      {/* Additional Sections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📝</span> Additional Sections
          </CardTitle>
          <CardDescription>Languages, Publications, Volunteer Work, etc.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="w-full flex items-center gap-2">
              <span>🌍</span> Languages
            </Button>
            <Button variant="outline" className="w-full flex items-center gap-2">
              <span>📚</span> Publications
            </Button>
            <Button variant="outline" className="w-full flex items-center gap-2">
              <span>🤝</span> Volunteer
            </Button>
            <Button variant="outline" className="w-full flex items-center gap-2">
              <span>🔗</span> Links
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
