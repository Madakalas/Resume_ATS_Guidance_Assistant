'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PersonalInfo {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

export default function PersonalInfoSection({
  data,
  onChange,
}: {
  data: PersonalInfo;
  onChange: (data: PersonalInfo) => void;
}) {
  const handleChange = (field: keyof PersonalInfo, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm">
            Full Name *
          </Label>
          <Input
            id="name"
            value={data.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Alex Chen"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm">
            Professional Title *
          </Label>
          <Input
            id="title"
            value={data.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Backend Engineer"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm">
            Email *
          </Label>
          <Input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="your@email.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm">
            Phone *
          </Label>
          <Input
            id="phone"
            value={data.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="+1 (555) 123-4567"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location" className="text-sm">
          Location *
        </Label>
        <Input
          id="location"
          value={data.location}
          onChange={(e) => handleChange('location', e.target.value)}
          placeholder="San Francisco, CA"
        />
      </div>

      <div className="pt-2 border-t border-border">
        <p className="text-xs font-medium text-muted-foreground mb-3">
          Optional Links
        </p>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="linkedin" className="text-sm">
              LinkedIn
            </Label>
            <Input
              id="linkedin"
              value={data.linkedin || ''}
              onChange={(e) => handleChange('linkedin', e.target.value)}
              placeholder="linkedin.com/in/alexchen"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="github" className="text-sm">
              GitHub
            </Label>
            <Input
              id="github"
              value={data.github || ''}
              onChange={(e) => handleChange('github', e.target.value)}
              placeholder="github.com/alexchen"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="portfolio" className="text-sm">
              Portfolio
            </Label>
            <Input
              id="portfolio"
              value={data.portfolio || ''}
              onChange={(e) => handleChange('portfolio', e.target.value)}
              placeholder="alexchen.dev"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
