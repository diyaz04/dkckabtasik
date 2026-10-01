import {StrictMode, Suspense, lazy} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { isNativeApp } from './native/platform';
import { installApiBase } from './native/apiBase';

installApiBase();

// Tampilan mobile dimuat terpisah supaya web biasa tidak ikut membawa kodenya.
const MobileApp = lazy(() => import('./native/MobileApp'));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isNativeApp ? (
      <Suspense fallback={null}>
        <MobileApp />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
);
