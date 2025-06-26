'use client';

import { useTerminal } from '@/components/context/TerminalContext';
import { useState, useRef, FormEvent, KeyboardEvent } from 'react';

export default function Terminal({className}: {className?: string}) {
  const { entries, addEntry, clearEntries } = useTerminal();
  const [currentInput, setCurrentInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!currentInput.trim()) return;

    const command = currentInput.trim();
    
    // Add to command history
    setCommandHistory(prev => [...prev, command]);
    setHistoryIndex(-1);
    
    if (command.toLowerCase() === 'clear') {
      clearEntries();
      setCurrentInput('');
      return;
    }

    addEntry({
      command,
      output: `command not found: "${command}"`
    });

    setCurrentInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit(e as unknown as FormEvent);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 
          ? commandHistory.length - 1 
          : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCurrentInput('');
        } else {
          setHistoryIndex(newIndex);
          setCurrentInput(commandHistory[newIndex]);
        }
      }
    }
  };

  const handleTerminalClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div className={className}>
      <div className="relative z-10 w-full h-full">
        <div className="rounded-lg overflow-hidden flex flex-col h-full border border-gray-800">
          <div className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-800">
            <div className="text-gray-300 text-sm">Terminal</div>
          </div>
          
          <div 
            className="flex-1 bg-black/60 backdrop-blur-sm overflow-y-auto p-4 text-green-400 text-sm cursor-text"
            onClick={handleTerminalClick}
          >
            <div className="space-y-2">
              <div>
                <div className="ml-2 text-orange-400 whitespace-pre-wrap">
                  <span className="font-mono">
{`     ██╗ ██████╗ ███████╗     ██╗   ██╗██╗██████╗ 
     ██║██╔═══██╗██╔════╝     ╚██╗ ██╔╝██║██╔══██╗
     ██║██║   ██║█████╗        ╚████╔╝ ██║██████╔╝
██   ██║██║   ██║██╔══╝         ╚██╔╝  ██║██╔═══╝ 
╚█████╔╝╚██████╔╝███████╗        ██║   ██║██║     
 ╚════╝  ╚═════╝ ╚══════╝        ╚═╝   ╚═╝╚═╝     
`}               
                  </span>
                  This is a terminal emulator. You can type commands here.
                  <br />
                  Type &apos;clear&apos; to clear the terminal.
                </div>
              </div>
              {entries.map((entry: { command: string; output?: string }, index: number) => (
                <div key={index}>
                  {entry.command && (
                    <div className="flex">
                      <span className="text-blue-400">root@127.0.0.1:~$</span>
                      <span className="ml-2">{entry.command}</span>
                    </div>
                  )}
                  {entry.output && (
                    <div className="ml-2 text-gray-300 whitespace-pre-wrap">
                      {entry.output}
                    </div>
                  )}
                </div>
              ))}
              
              <form onSubmit={handleSubmit} className="flex">
                <span className="text-blue-400">root@127.0.0.1:~$</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="ml-2 bg-transparent outline-none flex-1 text-green-400"
                  autoFocus
                />
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
