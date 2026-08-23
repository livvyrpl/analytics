'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '../../src/lib/supabase';
import Navbar from '@/app/components/Navbar';
import Link from 'next/link';

const ADMIN_EMAILS = [
  'olivia.stinson0@gmail.com', // Match the same admin list here
];

export default function AdminPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email && ADMIN_EMAILS.includes(user.email)) {
          setIsAdmin(true);
        }
      } catch (err) {
        console.error('Auth error:', err);
      } finally {
        setLoading(false);
      }
    }
    checkAdmin();
  }, [supabase]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0b0e14] text-white flex items-center justify-center">
        <div className="text-[#ff79c6] font-semibold animate-pulse">Verifying credentials...</div>
      </main>
    );
  }

  // If user is not an admin, show access denied view
  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-[#0b0e14] text-zinc-200 p-4 md:p-6">
        <div className="max-w-[1700px] mx-auto space-y-6">
          <Navbar />
          <div className="bg-[#121620] border border-red-900/50 rounded-xl p-12 text-center space-y-4 shadow-xl">
            <h2 className="text-2xl font-black text-red-400">Access Denied</h2>
            <p className="text-zinc-400 text-xs max-w-md mx-auto">
              You do not have administrative privileges required to view the system control panel.
            </p>
            <div>
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-semibold text-white transition-colors"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Render Admin Panel for authorized users
  return (
    <main className="min-h-screen bg-[#0b0e14] text-zinc-200 p-4 md:p-6">
      <div className="max-w-[1700px] mx-auto space-y-6">
        <Navbar />

        <div className="bg-[#121620] border border-zinc-800 rounded-xl p-6 shadow-xl">
          <h1 className="text-2xl font-black text-white">
            Admin Control <span className="text-[#ff79c6]">Panel</span>
          </h1>
          <p className="text-zinc-400 text-xs mt-1">Manage database records and platform settings.</p>
        </div>

        {/* Add your admin management tools / controls here */}
        <div className="bg-[#121620] border border-zinc-800 rounded-xl p-6 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">System Status</h3>
          <p className="text-xs text-zinc-400">Database connection active. Row Level Security policies enforced.</p>
        </div>
      </div>
    </main>
  );
}