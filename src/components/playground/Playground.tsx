'use client';

import { useState, useRef } from 'react';
import usePythonRunner from '@/hooks/usePythonRunner';

type Language = 'javascript' | 'python';

interface LanguageConfig {
    name: string;
    defaultCode: string;
    placeholder: string;
    icon: string;
}

const languageConfigs: Record<Language, LanguageConfig> = {
    javascript: {
        name: 'JavaScript',
        defaultCode: `console.log("Hello, World!");`,
        placeholder: 'Write your JavaScript code here...',
        icon: 'JS'
    },
    python: {
        name: 'Python',
        defaultCode: `print("Hello, World!")`,
        placeholder: 'Write your Python code here...',
        icon: 'PY'
    }
};

export default function Playground({className}: {className?: string}) {
    const [language, setLanguage] = useState<Language>('javascript');
    const [code, setCode] = useState(languageConfigs.javascript.defaultCode);
    const [output, setOutput] = useState<string[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    
    const { pyodide, isInitializing, initializePyodide } = usePythonRunner();
    
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleLanguageChange = (newLanguage: Language) => {
        setLanguage(newLanguage);
        setCode(languageConfigs[newLanguage].defaultCode);
        setOutput([]);
        
        if (newLanguage === 'python' && !pyodide && !isInitializing && initializePyodide) {
            initializePyodide().catch(console.error);
        }
    };

    const captureConsole = () => {
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;
        const logs: string[] = [];

        console.log = (...args) => {
            logs.push(`${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ')}`);
        };

        console.error = (...args) => {
            logs.push(`ERROR: ${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ')}`);
        };

        console.warn = (...args) => {
            logs.push(`WARN: ${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ')}`);
        };

        return {
            logs,
            restore: () => {
                console.log = originalLog;
                console.error = originalError;
                console.warn = originalWarn;
            }
        };
    };

    const runJavaScript = async () => {
        const { logs, restore } = captureConsole();

        try {
            const userFunction = new Function(code);
            const result = userFunction();
            
            if (result !== undefined) {
                logs.push(`RETURN: ${typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)}`);
            }
        } catch (error) {
            logs.push(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            restore();
        }

        return logs;
    };

    const runPython = async () => {
        const logs: string[] = [];

        if (!pyodide && initializePyodide) {
            logs.push('⏳ Initializing Python environment...');
            try {
                await initializePyodide();
            } catch (error) {
                logs.push(`ERROR: Failed to initialize Python environment: ${error instanceof Error ? error.message : String(error)}`);
                return logs;
            }
        }

        if (!pyodide) {
            logs.push('ERROR: Python environment is not available. Please try again.');
            return logs;
        }

        try {
            pyodide.runPython(`
                import sys
                from io import StringIO
                import contextlib

                @contextlib.contextmanager
                def capture_output():
                    stdout = StringIO()
                    stderr = StringIO()
                    old_stdout, old_stderr = sys.stdout, sys.stderr
                    try:
                        sys.stdout, sys.stderr = stdout, stderr
                        yield stdout, stderr
                    finally:
                        sys.stdout, sys.stderr = old_stdout, old_stderr
            `);

            const result = pyodide.runPython(`
                with capture_output() as (stdout, stderr):
                    try:
                ${code.split('\n').map(line => `        ${line}`).join('\n')}
                    except Exception as e:
                        print(f"ERROR: {e}", file=sys.stderr)

                stdout_content = stdout.getvalue()
                stderr_content = stderr.getvalue()
                (stdout_content, stderr_content)
            `);

            const [stdout, stderr] = result.toJs();
            
            if (stdout) {
                stdout.split('\n').filter((line: string) => line.trim()).forEach((line: string) => {
                    logs.push(`OUTPUT: ${line}`);
                });
            }
            
            if (stderr) {
                stderr.split('\n').filter((line: string) => line.trim()).forEach((line: string) => {
                    logs.push(`ERROR: ${line}`);
                });
            }

            if (!stdout && !stderr) {
                logs.push('Code executed successfully (no output)');
            }

        } catch (error) {
            logs.push(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
        }

        return logs;
    };

    const runCode = async () => {
        setIsRunning(true);
        setOutput([]);

        let logs: string[] = [];

        try {
            switch (language) {
                case 'javascript':
                    logs = await runJavaScript();
                    break;
                case 'python':
                    logs = await runPython();
                    break;
                default:
                    logs = ['ERROR: Unsupported language'];
            }
        } catch (error) {
            logs = [`ERROR: ${error instanceof Error ? error.message : String(error)}`];
        } finally {
            setOutput(logs);
            setIsRunning(false);
        }
    };

    const clearOutput = () => {
        setOutput([]);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            runCode();
        }
        
        if (e.key === 'Tab') {
            e.preventDefault();
            const textarea = textareaRef.current;
            if (textarea) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const newValue = code.substring(0, start) + '  ' + code.substring(end);
                setCode(newValue);
                setTimeout(() => {
                    textarea.selectionStart = textarea.selectionEnd = start + 2;
                }, 0);
            }
        }
    };

    return (
        <div className={className}>
            <div className="relative z-10 w-full h-full">
                <div className="rounded-lg overflow-hidden flex flex-col h-full border border-gray-800">
                    <div className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-800">
                        <div className="text-gray-300 text-sm">
                            Playground
                        </div>
                    </div>

                    <div className="flex-1 flex">
                        <div className="flex-1 flex flex-col">
                            <div className="px-4 py-2 bg-gray-900 text-gray-400 text-xs border-b border-gray-700 flex items-center justify-between">
                                <span>Code Editor</span>
                                <div className="flex gap-2 mr-0">
                                    <button
                                        onClick={runCode}
                                        disabled={isRunning}
                                        className="cursor-pointer hover:bg-gray-700 rounded transition-colors"
                                        title="Run (Ctrl+Enter)"
                                    >
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z"/>
                                            </svg>
                                                                            </button>
                                    <button
                                        onClick={clearOutput}
                                        className="cursor-pointer hover:bg-gray-700 rounded transition-colors"
                                        title="Clear Output"
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                        </svg>
                                    </button>

                                    {Object.entries(languageConfigs).map(([lang, config]) => (
                                        <button
                                            key={lang}
                                            onClick={() => handleLanguageChange(lang as Language)}
                                            className={`cursor-pointer px-2 text-xs rounded transition-colors ${
                                                language === lang
                                                    ? 'bg-orange-500 text-white'
                                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            }`}
                                        >
                                            {config.icon}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <textarea
                                ref={textareaRef}
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="flex-1 bg-gray-900 text-green-400 p-4 font-mono text-sm resize-none outline-none"
                                placeholder={languageConfigs[language].placeholder}
                                spellCheck={false}
                            />
                        </div>

                        <div className="flex-1 flex flex-col border-l border-gray-700">
                            <div className="px-4 py-2 bg-gray-900 text-gray-400 text-xs border-b border-gray-700">
                                Output
                            </div>
                            <div className="flex-1 bg-black/60 backdrop-blur-sm overflow-y-auto p-4 text-green-400 text-sm">
                                {output.length === 0 ? (
                                    <div className="text-gray-500 italic">
                                        Output will appear here when you run your code...
                                        {language === 'python' && (!pyodide || isInitializing) && (
                                            <div className="mt-2 text-yellow-400">
                                                ⏳ {isInitializing ? 'Initializing' : 'Loading'} Python environment...
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {output.map((line, index) => (
                                            <div 
                                                key={index} 
                                                className={`font-mono whitespace-pre-wrap ${
                                                    line.startsWith('ERROR:') ? 'text-red-400' :
                                                    line.startsWith('WARN:') ? 'text-yellow-400' :
                                                    line.startsWith('RETURN:') ? 'text-blue-400' :
                                                    line.startsWith('OUTPUT:') ? 'text-green-400' :
                                                    line.startsWith('INFO:') ? 'text-cyan-400' :
                                                    'text-green-400'
                                                }`}
                                            >
                                                {line}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}