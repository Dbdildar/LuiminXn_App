import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {AppState} from 'react-native';

type PreviewValue = {
  /** The ONE video that is previewing right now (or null). */
  previewId: string | null;
  startPreview: (id: string) => void;
  /** With an id: stops only if that video is the one previewing. */
  stopPreview: (id?: string) => void;
};

const noop = () => {};
const PreviewContext = createContext<PreviewValue>({
  previewId: null,
  startPreview: noop,
  stopPreview: noop,
});

/**
 * Holds a single "who is previewing" id, so two previews can never run at once:
 * starting a new one simply replaces the old one. Also stops when the app goes
 * to the background.
 */
export function PreviewProvider({children}: {children: ReactNode}) {
  const [previewId, setPreviewId] = useState<string | null>(null);

  const startPreview = useCallback((id: string) => setPreviewId(id), []);
  const stopPreview = useCallback(
    (id?: string) =>
      setPreviewId(current => (id === undefined || current === id ? null : current)),
    [],
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', next => {
      if (next !== 'active') {
        setPreviewId(null);
      }
    });
    return () => sub.remove();
  }, []);

  const value = useMemo(
    () => ({previewId, startPreview, stopPreview}),
    [previewId, startPreview, stopPreview],
  );
  return <PreviewContext.Provider value={value}>{children}</PreviewContext.Provider>;
}

export function usePreview(): PreviewValue {
  return useContext(PreviewContext);
}
