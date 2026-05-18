'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
}

export default function CertificationsSection({
  data,
  onChange,
}: {
  data: Certification[];
  onChange: (data: Certification[]) => void;
}) {
  const addCertification = () => {
    const newCert: Certification = {
      id: Date.now().toString(),
      name: '',
      issuer: '',
      date: '',
    };
    onChange([...data, newCert]);
  };

  const removeCertification = (id: string) => {
    onChange(data.filter((cert) => cert.id !== id));
  };

  const updateCertification = (id: string, updates: Partial<Certification>) => {
    onChange(
      data.map((cert) =>
        cert.id === id ? { ...cert, ...updates } : cert
      )
    );
  };

  return (
    <div className="space-y-4">
      <Accordion type="single" collapsible className="w-full">
        {data.map((certification, index) => (
          <AccordionItem key={certification.id} value={certification.id}>
            <div className="flex items-center justify-between">
              <AccordionTrigger className="flex-1">
                <div className="text-left">
                  <p className="font-medium text-sm">
                    {certification.name || `Certification ${index + 1}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {certification.issuer || 'No issuer'}
                  </p>
                </div>
              </AccordionTrigger>
              <button
                onClick={() => removeCertification(certification.id)}
                className="text-muted-foreground hover:text-foreground transition-colors ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <AccordionContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`name-${certification.id}`} className="text-sm">
                  Certification Name
                </Label>
                <Input
                  id={`name-${certification.id}`}
                  value={certification.name}
                  onChange={(e) =>
                    updateCertification(certification.id, { name: e.target.value })
                  }
                  placeholder="AWS Certified Solutions Architect"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`issuer-${certification.id}`} className="text-sm">
                  Issuing Organization
                </Label>
                <Input
                  id={`issuer-${certification.id}`}
                  value={certification.issuer}
                  onChange={(e) =>
                    updateCertification(certification.id, { issuer: e.target.value })
                  }
                  placeholder="Amazon Web Services"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`date-${certification.id}`} className="text-sm">
                  Date Obtained
                </Label>
                <Input
                  id={`date-${certification.id}`}
                  type="month"
                  value={certification.date}
                  onChange={(e) =>
                    updateCertification(certification.id, { date: e.target.value })
                  }
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <Button
        onClick={addCertification}
        variant="outline"
        className="w-full gap-1"
      >
        <Plus className="w-4 h-4" />
        Add Certification
      </Button>
    </div>
  );
}
