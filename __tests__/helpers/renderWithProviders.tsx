import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {render} from '@testing-library/react-native';
import type {ReactElement} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {PreviewProvider} from '../../src/features/preview';

export function renderWithProviders(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: {
      queries: {retry: false, gcTime: 0, refetchOnMount: false},
    },
  });
  
  return render(
    <SafeAreaProvider>
      <QueryClientProvider client={client}>
        <PreviewProvider>{ui}</PreviewProvider>
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
}