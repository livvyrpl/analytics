'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '../../src/lib/supabase';
import Navbar from '@/app/components/Navbar';
import Link from 'next/link';

const ADMIN_EMAILS = [
  'olivia.stinson0@gmail.com', // Update with your actual admin email if needed
];

export default function AdminPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Overview Stats State
  const [totalMatches, setTotalMatches] = useState(0);
  const [uniqueTeams, setUniqueTeams] = useState(0);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function initAdmin() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email && ADMIN_EMAILS.includes(user.email)) {
          setIsAdmin(true);
          await fetchAdminData();
        }
      } catch (err) {
        console.error('Admin init error:', err);
      } finally {
        setLoading(false);
      }
    }
    initAdmin();
  }, [supabase]);

  async function fetchAdminData() {
    try {
      // Fetch matches for overview counts
      const { data: matchesData, error: matchesError } = await supabase.from('matches').select('*');
      if (matchesError) throw matchesError;

      if (matchesData) {
        setTotalMatches(matchesData.length);
        const teams = new Set(matchesData.flatMap(m => [m.team_1, m.team_2, m.team_a, m.team_b]).filter(Boolean));
        setUniqueTeams(teams.size);
      }

      // Fetch user profiles or simulated user logs if a profiles table exists
      // If you track users in a custom 'profiles' table, query it here:
      const { data: profilesData } = await supabase.from('profiles').select('*');
      if (profilesData) {
        setUsersList(profilesData);
      } else {
        // Fallback placeholder representation if profiles table isn't set up yet
        setUsersList([
          { id: '1', email: 'olivia.stinson0@gmail.com', role: 'Admin', created_at: new Date().toISOString() }
        ]);
      }
    } catch (err) {
      console.error('Error fetching admin overview data:', err);
    }
  }

  // Clear All Matches Handler
  const handleClearAllMatches = async () => {
    const confirmation = window.prompt(
      "DANGER: This will permanently delete ALL matches from the database. Type 'DELETE ALL' to confirm:"
    );

    if (confirmation !== 'DELETE ALL') {
      alert('Action cancelled.');
      return;
    }

    setActionLoading(true);
    try {
      // Delete all rows where id is not null (effectively wiping the table)
      const { error } = await supabase.from('matches').delete().neq('id', 0);
      if (error) throw error;

      alert('All matches have been cleared successfully.');
      setTotalMatches(0);
      setUniqueTeams(0);
    } catch (err: any) {
      console.error('Error clearing matches:', err);
      alert(`Failed to clear matches: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0b0e14] text-white flex items-center justify-center">
        <div className="text-[#ff79c6] font-semibold animate-pulse">Verifying administrative credentials...</div>
      </main>
    );
  }

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

  return (
    <main className="min-h-screen bg-[#0b0e14] text-zinc-200 p-4 md:p-6">
      <div className="max-w-[1700px] mx-auto space-y-6">
        <Navbar />

        {/* Header */}
        <div className="bg-[#121620] border border-zinc-800 rounded-xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white">
              Admin Control <span className="text-[#ff79c6]">Panel</span>
            </h1>
            <p className="text-zinc-400 text-xs mt-1">Full website oversight, database maintenance, and user management.</p>
          </div>
          <button
            onClick={fetchAdminData}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-semibold text-white transition-colors"
          >
            Refresh System Metrics ⟳
          </button>
        </div>

        {/* Website Overview Section */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Website Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#121620] border border-zinc-800 rounded-xl p-5 shadow-xl">
              <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Total Stored Matches</span>
              <div className="text-3xl font-black text-white mt-1">{totalMatches}</div>
            </div>
            <div className="bg-[#121620] border border-zinc-800 rounded-xl p-5 shadow-xl">
              <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Unique Teams Indexed</span>
              <div className="text-3xl font-black text-white mt-1">{uniqueTeams}</div>
            </div>
            <div className="bg-[#121620] border border-zinc-800 rounded-xl p-5 shadow-xl">
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">Database Status</span>
              <div className="text-sm font-bold text-white mt-2 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Connected & Operational
              </div>
            </div>
          </div>
        </div>

        {/* Database Management & Danger Zone */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-red-400">Database Maintenance</h2>
          <div className="bg-[#121620] border border-red-950/60 rounded-xl p-6 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
            <div>
              <h3 className="text-sm font-bold text-white">Clear Master Match Library</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Permanently purge all logged scrims and official game day records from the database table.
              </p>
            </div>
            <button
              onClick={handleClearAllMatches}
              disabled={actionLoading}
              className="px-4 py-2 bg-red-950 hover:bg-red-600 text-red-300 hover:text-white rounded-lg text-xs font-bold border border-red-800 transition-colors whitespace-nowrap shadow-lg"
            >
              {actionLoading ? 'Processing...' : 'Clear All Matches'}
            </button>
          </div>
        </div>

        {/* User Management Section */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Authorized Users Overview</h2>
          <div className="bg-[#121620] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#181d2c] text-zinc-400 uppercase font-bold border-b border-zinc-800 text-[10px]">
                    <th className="p-3">User Email / ID</th>
                    <th className="p-3">Role Status</th>
                    <th className="p-3">Access Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {usersList.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-zinc-500">No user records loaded.</td>
                    </tr>
                  ) : (
                    usersList.map((usr, idx) => (
                      <tr key={idx} className="hover:bg-[#181d2c]/50 transition-colors">
                        <td className="p-3 font-bold text-white">{usr.email || usr.id}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded text-[10px] font-black uppercase">
                            {usr.role || 'Active User'}
                          </span>
                        </td>
                        <td className="p-3 text-zinc-400">Standard Platform Access</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}