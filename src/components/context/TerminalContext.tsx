'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface TerminalEntry {
  command: string;
  output?: string;
}

interface TerminalContextType {
  entries: TerminalEntry[];
  addEntry: (entry: TerminalEntry) => void;
  clearEntries: () => void;
}

const TerminalContext = createContext<TerminalContextType | undefined>(undefined);

export function TerminalProvider({ children }: { children: ReactNode }) {
  const STORAGE_KEY = 'terminal-history';
  const [entries, setEntries] = useState<TerminalEntry[]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem(STORAGE_KEY);
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        if (Array.isArray(parsedHistory)) {
          setEntries(parsedHistory);
        }
      } catch (error) {
        console.error('Failed to parse terminal entries from localStorage:', error);
      }
    }
  }, []);

  const addEntry = (entry: TerminalEntry) => {
    setEntries(prev => [...prev, entry]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...entries]));
  };

  const clearEntries = () => {
    setEntries([]);
    localStorage.removeItem(STORAGE_KEY)
  };

  return (
    <TerminalContext.Provider value={{ entries, addEntry, clearEntries }}>
      {children}
    </TerminalContext.Provider>
  );
}

export function useTerminal() {
  const context = useContext(TerminalContext);
  if (context === undefined) {
    throw new Error('useTerminal must be used within a TerminalProvider');
  }
  return context;
}