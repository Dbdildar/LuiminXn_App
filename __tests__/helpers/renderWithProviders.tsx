import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {render} from '@testing-library/react-native';
import type {ReactElement} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';


export function renderWithProviders(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: {
      queries: {retry: false, gcTime: 0, refetchOnMount: false},
    },
  });
  
  return render(
    <SafeAreaProvider>
      <QueryClientProvider client={client}>
        {ui}
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
}