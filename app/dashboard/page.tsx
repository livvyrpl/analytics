'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import Navbar from '@/app/components/Navbar';
import Link from 'next/link';

function getDisplayMap(mapField: any): string {
  if (!mapField) return 'Unknown Map';
  if (typeof mapField === 'object') {
    return mapField.name || 'Clubhouse';
  }
  if (typeof mapField === 'string') {
    if (mapField.startsWith('{')) {
      try {
        const parsed = JSON.parse(mapField);
        const nameVal = parsed.Name || parsed.name || '';
        if (nameVal.includes('413845419788')) return 'Clubhouse';
        return nameVal || 'Clubhouse';
      } catch {
        return mapField;
      }
    }
    if (mapField.includes('413845419788')) return 'Clubhouse';
    return mapField;
  }
  return 'Clubhouse';
}

export default function DashboardPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('date_played', { ascending: false });

      if (error) throw error;
      setMatches(data || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  const totalRoundsTracked = matches.reduce((acc, m) => acc + (m.total_rounds || 0), 0);

  return (
    <main className="min-h-screen bg-[#0b0e14] text-zinc-200 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <Navbar />

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#121620] border border-zinc-800 rounded-xl p-6 shadow-lg">
            <p className="text-[10px] font-black uppercase text-zinc-500 tracking-wider mb-2">Total Matches Logged</p>
            <p className="text-4xl font-black text-[#ff79c6]">{matches.length}</p>
          </div>
          <div className="bg-[#121620] border border-zinc-800 rounded-xl p-6 shadow-lg">
            <p className="text-[10px] font-black uppercase text-zinc-500 tracking-wider mb-2">Total Rounds Tracked</p>
            <p className="text-4xl font-black text-white">{totalRoundsTracked}</p>
          </div>
          <div className="bg-[#121620] border border-zinc-800 rounded-xl p-6 shadow-lg">
            <p className="text-[10px] font-black uppercase text-zinc-500 tracking-wider mb-2">Active Database Status</p>
            <p className="text-lg font-bold text-emerald-400 mt-2">Connected & Syncing</p>
          </div>
        </div>

        {/* Action Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/add-match"
            className="bg-[#121620] hover:border-[#ff79c6] border border-zinc-800 rounded-xl p-6 transition-all group shadow-lg flex items-start gap-4"
          >
            <div className="w-12 h-12 bg-[#ff79c6]/10 text-[#ff79c6] rounded-xl flex items-center justify-center font-black text-xl group-hover:scale-110 transition-transform">
              ＋
            </div>
            <div>
              <h3 className="text-base font-bold text-white group-hover:text-[#ff79c6] transition-colors">Add Match (Replay or Manual)</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Upload a `.rec` file to auto-parse data or manually input your score splits, map picks, and bans.
              </p>
            </div>
          </Link>

          <Link
            href="/match-library"
            className="bg-[#121620] hover:border-[#ff79c6] border border-zinc-800 rounded-xl p-6 transition-all group shadow-lg flex items-start gap-4"
          >
            <div className="w-12 h-12 bg-zinc-800 text-zinc-200 rounded-xl flex items-center justify-center font-black text-xl group-hover:scale-110 transition-transform">
              📋
            </div>
            <div>
              <h3 className="text-base font-bold text-white group-hover:text-[#ff79c6] transition-colors">Master Match Library</h3>
              <p className="text-xs text-zinc-400 mt-1">
                View, filter, and edit your master spreadsheet catalog of all scrims and official matches.
              </p>
            </div>
          </Link>
        </div>

        {/* Recent Game Feed */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-extrabold text-white">Recent Game Feed</h2>
            <Link href="/match-library" className="text-xs text-[#ff79c6] hover:underline font-bold">
              View All ↗
            </Link>
          </div>

          {loading ? (
            <div className="text-zinc-500 text-xs py-4">Loading feed...</div>
          ) : matches.length === 0 ? (
            <div className="bg-[#121620] border border-zinc-800 rounded-xl p-8 text-center text-zinc-500 text-xs">
              No matches recorded yet. Click <strong className="text-[#ff79c6]">"Add Match"</strong> above to get started!
            </div>
          ) : (
            <div className="space-y-3">
              {matches.slice(0, 3).map((m) => {
                const t1 = m.team_1 || m.team_a || 'Team 1';
                const t2 = m.team_2 || m.team_b || 'Team 2';
                const isWin = (m.win_loss || '').toLowerCase() === 'win';
                const cleanMap = getDisplayMap(m.map);

                return (
                  <div key={m.id} className="bg-[#121620] border border-zinc-800 rounded-xl p-5 flex flex-wrap justify-between items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 text-[10px] font-bold uppercase rounded">
                          {m.league || 'Scrim'}
                        </span>
                        <span className="text-zinc-500 text-[10px]">
                          {m.date_played ? new Date(m.date_played).toLocaleDateString() : ''}
                        </span>
                      </div>
                      <p className="text-sm font-black text-white">
                        {t1} <span className="text-[#ff79c6]">vs</span> {t2}
                      </p>
                      <p className="text-xs text-zinc-400">Map: <strong className="text-zinc-200">{cleanMap}</strong></p>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className={`px-2.5 py-1 rounded text-xs font-black uppercase ${
                        isWin ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'
                      }`}>
                        {m.win_loss || 'Loss'}
                      </span>
                      {m.vod_link && (
                        <a href={m.vod_link} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-[#ff79c6] hover:underline">
                          Watch VOD ↗
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}