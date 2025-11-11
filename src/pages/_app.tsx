import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import '@/styles/globals.css';
import '@/components/PianoChordDisplay.css';
import { registerServiceWorker } from '@/utils/serviceWorker';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ThemeProvider } from '@/contexts/ThemeContext';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Register service worker for PWA (only in production)
    if (process.env.NODE_ENV === 'production') {
      registerServiceWorker();
    }
  }, []);

  return (
    <ThemeProvider>
      <ErrorBoundary>
        <Component {...pageProps} />
      </ErrorBoundary>
    </ThemeProvider>
  );
}

