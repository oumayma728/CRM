import React, { useState, useEffect } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CallProvider } from '../contexts/CallContext';
import { Toaster } from 'react-hot-toast';

export function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAdmin } = useAuth();
  const location = useLocation();

  const isChatbot = location.pathname === "/chatbot";
  const isMessages = location.pathname.endsWith("/messages");

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">

      <Toaster position="top-right" toastOptions={{ duration: 2800 }} />

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in-scale"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar — always visible on lg+, overlay on mobile */}
      <div className={`
        shrink-0 z-50
        lg:relative lg:z-auto
        ${mobileMenuOpen ? 'fixed inset-y-0 left-0' : 'hidden lg:block'}
      `}>
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden relative min-w-0">
        <CallProvider>
          {/* Navbar — passes mobile menu toggle */}
          <Navbar onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} mobileMenuOpen={mobileMenuOpen} />

          {/* CONTENT */}
          <main className={`flex-1 flex flex-col ${isChatbot || isMessages ? 'overflow-hidden min-h-0' : 'overflow-y-auto p-3 sm:p-4 md:p-6'} scrollbar-crm`}>

            {isChatbot || isMessages ? (
              <div className="flex flex-1 min-h-0 overflow-hidden">
                <Outlet />
              </div>
            ) : (
              <div key={location.pathname} className="max-w-7xl mx-auto w-full animate-fade-in-up">
                <Outlet />
              </div>
            )}

          </main>
        </CallProvider>
      </div>
    </div>
  );
}