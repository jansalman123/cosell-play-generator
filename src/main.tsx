import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import React from 'react';

class RootErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = {hasError: false};
  }

  static getDerivedStateFromError() {
    return {hasError: true};
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f5f3ee', padding: '24px'}}>
          <div style={{maxWidth: '640px', border: '1px solid rgba(12,38,70,0.12)', background: 'white', borderRadius: '24px', padding: '24px'}}>
            <h1 style={{margin: 0, color: '#0c2646'}}>AI-Pulse Prospector</h1>
            <p style={{marginTop: '12px', color: '#364152', lineHeight: 1.6}}>
              The app hit a browser-side loading issue. Refresh once, and if the problem continues, your saved browser storage may be corrupted or blocked.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>,
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Keep the app functional even when service worker registration fails.
    });
  });
}
