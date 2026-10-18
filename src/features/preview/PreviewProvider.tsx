import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState } from 'react-native';

interface PreviewContextType {
  previewId: string | null;
  startPreview: (id: string) => void;
  stopPreview: (id?: string) => void;
}

// 1. Initialize context with undefined so we can cleanly detect missing providers
const PreviewContext = createContext<PreviewContextType | undefined>(undefined);

export const PreviewProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [previewId, setPreviewId] = useState<string | null>(null);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        setPreviewId(null);
      }
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  const startPreview = (id: string) => {
    setPreviewId(id);
  };

  const stopPreview = (id?: string) => {
    setPreviewId((current) => {
      if (!id || current === id) {
        return null;
      }
      return current;
    });
  };

  return (
    <PreviewContext.Provider value={{ previewId, startPreview, stopPreview }}>
      {children}
    </PreviewContext.Provider>
  );
};

export const usePreview = (): PreviewContextType => {
  const context = useContext(PreviewContext);

  // 2. If no provider is present, return a fresh, isolated no-op object every time
  if (!context) {
    return {
      previewId: null,
      startPreview: () => {},
      stopPreview: () => {},
    };
  }

  return context;
};