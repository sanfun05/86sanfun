import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Global error handlers to capture unhandled rejections and media/network noise
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    // Suppress media playback abort or benign DOM errors from console pollution
    const reason = event.reason?.message || String(event.reason || '');
    if (
      reason.includes('play() failed') ||
      reason.includes('user gesture') ||
      reason.includes('The play() request was interrupted') ||
      reason.includes('ResizeObserver loop')
    ) {
      event.preventDefault();
    }
  });

  window.addEventListener('error', (event) => {
    if (event.message && event.message.includes('ResizeObserver loop limit exceeded')) {
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallbackTitle="页面全局渲染保护">
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

