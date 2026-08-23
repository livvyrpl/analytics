'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import { createClient } from '../../src/lib/supabase';

export default function DashboardPage() {
  const supabase = createClient();

  const [totalMatches, setTotalMatches] = useState(0);
  const [teamsCount, setTeamsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const { data, error } = await supabase.from('matches').select('*');
      if (!error && data) {
        setTotalMatches(data.length);
        const uniqueTeams = new Set(data.flatMap((m: any) => [m.team_1, m.team_2].filter(Boolean)));
        setTeamsCount(uniqueTeams.size);
      }
      setLoading(false);
    }
    loadData();
  }, [supabase]);

  return (
    <main className="min-h-screen bg-[#0b0e14] text-zinc-200 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Navbar />
        <div>
          <p className="text-xs uppercase font-black tracking-widest text-[#ff79c6]">Overview</p>
          <h1 className="text-3xl font-black text-white mt-1">Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#121620] border border-zinc-800 rounded-xl p-5">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-black">Total Matches Logged</p>
            <p className="text-3xl font-black text-white mt-2">{loading ? '...' : totalMatches}</p>
          </div>
          <div className="bg-[#121620] border border-zinc-800 rounded-xl p-5">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-black">Unique Teams Tracked</p>
            <p className="text-3xl font-black text-white mt-2">{loading ? '...' : teamsCount}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Link href="/teams" className="px-4 py-2 bg-[#ff79c6] text-black font-bold rounded-lg text-xs">
            View Teams Atlas
          </Link>
          <Link href="/match-library" className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold rounded-lg text-xs">
            Match Library
          </Link>
        </div>
      </div>
    </main>
  );
}