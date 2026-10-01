import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { installAuthFetch } from './utils/authFetch';

// Semua request /api otomatis membawa token login + refresh otomatis.
// Sesi habis → kembali ke halaman login portal.
installAuthFetch({ onExpired: () => { window.location.hash = '#/portal/login'; } });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);