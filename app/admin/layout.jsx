"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ApnaNotify from "@/components/utils/ApnaNotify";

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const originalFetch = window.fetch;
    
    window.fetch = async function (resource, config = {}) {
      if (typeof resource === 'string' && resource.startsWith('/api/')) {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers = config.headers || {};
          
          // Check if Authorization header already exists (case-insensitive)
          const hasAuth = Object.keys(config.headers).some(
            key => key.toLowerCase() === 'authorization'
          );
          
          if (!hasAuth) {
            config.headers = {
              ...config.headers,
              Authorization: `Bearer ${token}`
            };
          }
        }
      }
      return originalFetch(resource, config);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="h-screen flex bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white transition-colors duration-300 overflow-hidden">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
          {/* Header */}
          <Header onMenuClick={() => setSidebarOpen(true)} />

          {/* Page content */}
          <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-950">
            <div className="h-full text-gray-900 dark:text-white transition-colors duration-300">
              {children}
            </div>
          </main>
          <div className="mt-3 py-3 border-t border-gray-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm">
            <p className="text-center text-xs text-gray-500 dark:text-white/60">
              © 2025 CCIC. All rights reserved.
            </p>
          </div>
        </div>

        {/* Notification System */}
        <ApnaNotify />
      </div>
    </ProtectedRoute>
  );
}
