'use client';

import { useState } from 'react';
import { SECTIONS_CONFIG } from '@/app/lib/constants';
import { RatingTableEditable, RatingTableReadOnly } from './RatingTable';

interface SectionConfig {
  id: string;
  title: string;
}

export function SectionAccordionEditable({ section, data, onRatingChange, defaultOpen }: {
  section: SectionConfig;
  data?: Record<string, string>;
  onRatingChange: (key: string, value: string) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen || false);
  const config = SECTIONS_CONFIG.find(s => s.id === section.id);
  if (!config) return null;

  return (
    <div>
      <button type="button" onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full py-3 sm:py-2.5 px-1 text-left border-b border-paper-line hover:bg-paper rounded-sm transition-colors min-h-[44px]">
        <span className={`text-xs font-mono text-dim-text transition-transform duration-300 ${open ? 'rotate-90' : ''}`}>&#9654;</span>
        <h4 className="text-sm font-heading font-semibold flex-1">{config.title}</h4>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-[2500px]' : 'max-h-0'}`}>
        <div className="py-2.5">
          <RatingTableEditable items={config.items} data={data} onRatingChange={onRatingChange} />
        </div>
      </div>
    </div>
  );
}

export function SectionAccordionReadOnly({ section, data }: {
  section: SectionConfig;
  data?: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);
  const config = SECTIONS_CONFIG.find(s => s.id === section.id);
  if (!config) return null;

  return (
    <div>
      <button type="button" onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full py-3 sm:py-2.5 px-1 text-left border-b border-paper-line hover:bg-paper rounded-sm transition-colors min-h-[44px]">
        <span className={`text-xs font-mono text-dim-text transition-transform duration-300 ${open ? 'rotate-90' : ''}`}>&#9654;</span>
        <h4 className="text-sm font-heading font-semibold flex-1">{config.title}</h4>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-[2500px]' : 'max-h-0'}`}>
        <div className="py-2.5">
          <RatingTableReadOnly items={config.items} data={data} />
        </div>
      </div>
    </div>
  );
}
