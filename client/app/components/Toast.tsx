'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface ToastContextType {
  showToast: (msg: string) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState('');
  const [visible, setVisible] = useState(false);
  let timer: ReturnType<typeof setTimeout>;

  const showToast = useCallback((message: string) => {
    setMsg(message);
    setVisible(true);
    clearTimeout(timer);
    timer = setTimeout(() => setVisible(false), 2200);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className={`fixed bottom-20 md:bottom-5 left-1/2 -translate-x-1/2 bg-ink text-paper px-4 py-2.5 rounded text-sm shadow-lg z-80 transition-all duration-200 pointer-events-none ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
        {msg}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
