'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

interface MonthYearPickerProps {
  value: string; // YYYY-MM format
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  allowPresent?: boolean;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function MonthYearPicker({ value, onChange, placeholder = 'MM/YYYY', id, allowPresent = false }: MonthYearPickerProps) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => {
    if (value && value !== 'Present') {
      const parts = value.split('-');
      return parseInt(parts[0]) || new Date().getFullYear();
    }
    return new Date().getFullYear();
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value && value !== 'Present') {
      const parts = value.split('-');
      if (parts[0]) setViewYear(parseInt(parts[0]) || new Date().getFullYear());
    }
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const displayValue = () => {
    if (!value) return '';
    if (value === 'Present') return 'Present';
    const parts = value.split('-');
    if (parts.length === 2) {
      const month = parseInt(parts[1]) - 1;
      return `${MONTHS[month] || ''} ${parts[0]}`;
    }
    return value;
  };

  const selectedMonth = value && value !== 'Present' ? parseInt(value.split('-')[1]) - 1 : -1;
  const selectedYear = value && value !== 'Present' ? parseInt(value.split('-')[0]) : -1;

  const handleSelect = (month: number) => {
    const m = String(month + 1).padStart(2, '0');
    onChange(`${viewYear}-${m}`);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        id={id}
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-input bg-background text-sm hover:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
          {displayValue() || placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-64 bg-card border border-border rounded-xl shadow-xl p-3">
          {/* Year nav */}
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={() => setViewYear(y => y - 1)} className="p-1 rounded hover:bg-muted">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-sm">{viewYear}</span>
            <button type="button" onClick={() => setViewYear(y => y + 1)} className="p-1 rounded hover:bg-muted">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-3 gap-1">
            {MONTHS.map((m, i) => {
              const isSelected = selectedYear === viewYear && selectedMonth === i;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleSelect(i)}
                  className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-violet-600 text-white'
                      : 'hover:bg-muted text-foreground'
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>

          {allowPresent && (
            <button
              type="button"
              onClick={() => { onChange('Present'); setOpen(false); }}
              className={`mt-2 w-full py-1.5 rounded-lg text-xs font-medium transition-colors ${
                value === 'Present' ? 'bg-violet-600 text-white' : 'hover:bg-muted text-foreground border border-border'
              }`}
            >
              Present
            </button>
          )}

          {value && (
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); }}
              className="mt-1 w-full py-1 rounded-lg text-xs text-muted-foreground hover:bg-muted"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
