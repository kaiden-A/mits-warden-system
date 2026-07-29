'use client';

import { useEffect, useRef, type ReactNode } from 'react';

export default function Modal({ open, onClose, children, wide }: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div ref={overlayRef}
      className="fixed inset-0 bg-black/45 flex items-center justify-center p-5 z-50"
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}>
      <div className={`bg-paper-raised rounded-lg shadow-lg w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 ${wide ? 'max-w-2xl' : 'max-w-lg'}`}>
        {children}
      </div>
    </div>
  );
}
