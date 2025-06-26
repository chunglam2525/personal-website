import { useState, useCallback } from "react";
import { useScript } from "@/hooks/useScript";

const PYODIDE_VERSION = "0.25.0";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let globalPyodideInstance: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let globalInitializationPromise: Promise<any> | null = null;

export default function usePythonRunner() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pyodide, setPyodide] = useState<any | null>(globalPyodideInstance);
  const [isInitializing, setIsInitializing] = useState(false);
  
  const pyodideScriptStatus = useScript(
    `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/pyodide.js`,
  );

  const initializePyodide = useCallback(async () => {
    if (globalPyodideInstance) {
      setPyodide(globalPyodideInstance);
      return globalPyodideInstance;
    }

    if (globalInitializationPromise) {
      const instance = await globalInitializationPromise;
      setPyodide(instance);
      return instance;
    }

    if (pyodideScriptStatus !== "ready") {
      throw new Error("Pyodide script not ready");
    }

    setIsInitializing(true);
    
    globalInitializationPromise = (async () => {
      try {
        const loadedPyodide = await globalThis.loadPyodide({
          indexURL: `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`,
        });
        globalPyodideInstance = loadedPyodide;
        return loadedPyodide;
      } catch (error) {
        console.error('Failed to load Pyodide:', error);
        globalInitializationPromise = null;
        throw error;
      }
    })();

    try {
      const instance = await globalInitializationPromise;
      setPyodide(instance);
      return instance;
    } finally {
      setIsInitializing(false);
    }
  }, [pyodideScriptStatus]);

  return { 
    pyodide, 
    isInitializing, 
    initializePyodide: pyodideScriptStatus === "ready" ? initializePyodide : null 
  };
}