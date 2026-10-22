import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {AppState} from 'react-native';

interface PreviewContextType {
  previewId: string | null;
  startPreview: (id: string) => void;
  stopPreview: (id?: string) => void;
}

const PreviewContext = createContext<PreviewContextType | undefined>(undefined);

const FALLBACK: PreviewContextType = {
  previewId: null,
  startPreview: () => {},
  stopPreview: () => {},
};

export const PreviewProvider: React.FC<{children: ReactNode}> = ({children}) => {
  const [previewId, setPreviewId] = useState<string | null>(null);

  useEffect(() => {
    const sub = AppState.addEventListener('change', next => {
      if (next === 'background' || next === 'inactive') {
        setPreviewId(null);
      }
    });
    return () => sub?.remove();
  }, []);

  // Stable identities: only one preview at a time (setting a new id replaces the old one).
  const startPreview = useCallback((id: string) => setPreviewId(id), []);
  const stopPreview = useCallback((id?: string) => {
    setPreviewId(cur => (!id || cur === id ? null : cur));
  }, []);

  const value = useMemo(
    () => ({previewId, startPreview, stopPreview}),
    [previewId, startPreview, stopPreview],
  );

  return <PreviewContext.Provider value={value}>{children}</PreviewContext.Provider>;
};

export const usePreview = (): PreviewContextType => {
  const ctx = useContext(PreviewContext);
  if (!ctx) {
    if (__DEV__) {
      console.warn('usePreview used outside <PreviewProvider>: previews are disabled.');
    }
    return FALLBACK; // stable object, not a new one every render
  }
  return ctx;
};