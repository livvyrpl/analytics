'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/app/components/Navbar';
import { createClient } from '../../src/lib/supabase';

export default function AdminPage() {
  const supabase = createClient();

  const [matchesCount, setMatchesCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const { count, error } = await supabase.from('matches').select('*', { count: 'exact', head: true });
      if (!error) {
        setMatchesCount(count);
      }
      setLoading(false);
    }
    loadStats();
  }, [supabase]);

  const nukeDatabase = async () => {
    if (!window.confirm('WARNING: This will delete ALL matches in the database. Are you sure?')) return;
    const { error } = await supabase.from('matches').delete().neq('id', 0);
    if (error) {
      alert(`Error clearing database: ${error.message}`);
    } else {
      alert('Database cleared successfully.');
      setMatchesCount(0);
    }
  };

  return (
    <main className="min-h-screen bg-[#0b0e14] text-zinc-200 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Navbar />
        <div>
          <p className="text-xs uppercase font-black tracking-widest text-[#ff79c6]">System Administration</p>
          <h1 className="text-3xl font-black text-white mt-1">Admin Panel</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#121620] border border-zinc-800 rounded-xl p-5">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-black">Total Matches Stored</p>
            <p className="text-3xl font-black text-white mt-2">{loading ? '...' : matchesCount}</p>
          </div>

          <div className="bg-[#121620] border border-zinc-800 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-red-400 font-black">Danger Zone</p>
              <p className="text-xs text-zinc-400 mt-1">Permanently remove all match records from the database.</p>
            </div>
            <button
              onClick={nukeDatabase}
              className="mt-4 px-4 py-2 bg-red-950 border border-red-800 text-red-300 font-bold rounded-lg text-xs hover:bg-red-900 transition-colors"
            >
              Clear All Matches
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}