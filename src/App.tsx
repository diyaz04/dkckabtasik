import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './components/LandingPage';
import NewsDetailPage from './components/NewsDetailPage';
import DkrDetailPage from './components/DkrDetailPage';
import SakaDetailPage from './components/SakaDetailPage';
import LoginPortal from './components/LoginPortal';
import PortalAdmin from './components/PortalAdmin';
import PortalDkr from './components/PortalDkr';
import PortalSaka from './components/PortalSaka';
import ValidasiPendaftaran from './components/ValidasiPendaftaran';

// Scroll to top or to hash element on route change
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 150);
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

// Layout for public pages containing standard Navbar and Footer
function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800 font-sans selection:bg-brand-orange selection:text-white">
      <Navbar />
      <div className="flex-grow pt-0">
        {children}
      </div>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        
        {/* Public Routes */}
        <Route 
          path="/" 
          element={
            <PublicLayout>
              <LandingPage />
            </PublicLayout>
          } 
        />
        
        <Route 
          path="/berita/:id" 
          element={
            <PublicLayout>
              <NewsDetailPage />
            </PublicLayout>
          } 
        />
        
        <Route 
          path="/dkr/:slug" 
          element={
            <PublicLayout>
              <DkrDetailPage />
            </PublicLayout>
          } 
        />

        <Route 
          path="/saka/:slug" 
          element={
            <PublicLayout>
              <SakaDetailPage />
            </PublicLayout>
          } 
        />

        <Route 
          path="/portal/login" 
          element={<LoginPortal />} 
        />

        {/* Private Dashboard Portal Routes */}
        <Route 
          path="/portal/admin" 
          element={<PortalAdmin />} 
        />

        <Route 
          path="/portal/dkr" 
          element={<PortalDkr />} 
        />

        <Route 
          path="/portal/saka" 
          element={<PortalSaka />} 
        />
        
        <Route 
          path="/validasi-pendaftaran/:id" 
          element={<ValidasiPendaftaran />} 
        />

      </Routes>
    </Router>
  );
}
