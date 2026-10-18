/**
 * Tiny stateful stand-in for src/features/preview.
 *
 * Wired globally via jest.setup.ts:
 *   jest.mock('./src/features/preview',
 *     () => require('./__tests__/helpers/previewMock').previewModule);
 *
 * previewModule MUST mirror every named export of
 * src/features/preview/index.tsx (PreviewProvider, usePreview,
 * PreviewLoader, PreviewPlayer), otherwise React sees `undefined`
 * and throws "Element type is invalid".
 */
import * as React from 'react';
import { Pressable, View } from 'react-native';

type Listener = (id: string | null) => void;
const listeners = new Set<Listener>();
let current: string | null = null;

function set(id: string | null) {
  current = id;
  listeners.forEach(l => l(id));
}

const startSpy = jest.fn();
const stopSpy = jest.fn();

export const previewMock = {
  startSpy,
  stopSpy,
  start: (id: string) => {
    startSpy(id);
    set(id);
  },
  stop: (id?: string) => {
    stopSpy(id);
    if (id === undefined || current === id) {
      set(null);
    }
  },
  reset() {
    current = null;
    listeners.clear();
    startSpy.mockClear();
    stopSpy.mockClear();
  },
};

export const previewModule = {
  PreviewProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  usePreview: () => {
    const [previewId, setActive] = React.useState<string | null>(current);
    React.useEffect(() => {
      listeners.add(setActive);
      return () => {
        listeners.delete(setActive);
      };
    }, []);
    return {
      previewId,
      startPreview: previewMock.start,
      stopPreview: previewMock.stop,
    };
  },
  PreviewPlayer: ({
    onReady,
    _onError,
  }: {
    onReady?: () => void;
    _onError?: () => void;
  }) => <Pressable testID="preview-player" onPress={onReady} />,
  PreviewLoader: () => <View testID="preview-loader" />,
};

// Safety net: __tests__/helpers/ → ../.. = repo root
const real = jest.requireActual<Record<string, unknown>>(
  '../../src/features/preview',
);
for (const key of Object.keys(real)) {
  if (!(key in previewModule)) {
    throw new Error(
      `previewMock is missing export "${key}" from src/features/preview`,
    );
  }
}