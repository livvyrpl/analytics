'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '../../src/lib/supabase';
import Navbar from '@/app/components/Navbar';
import Link from 'next/link';

export default function DashboardPage() {
  const supabase = createClient();
  const [totalMatches, setTotalMatches] = useState(0);
  const [uniqueTeams, setUniqueTeams] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data, error } = await supabase.from('matches').select('*');
        if (error) throw error;

        if (data) {
          setTotalMatches(data.length);
          const teams = new Set(data.flatMap(m => [m.team_1, m.team_2, m.team_a, m.team_b]).filter(Boolean));
          setUniqueTeams(teams.size);
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [supabase]);

  // Descriptive navigation cards configuration
  const dashboardCards = [
    {
      title: 'Match Library',
      description: 'Comprehensive master catalog of all scrims and official game days with filtering capabilities.',
      href: '/match-library',
    },
    {
      title: 'Teams Atlas',
      description: 'Analyze statistics, maps, roster performance metrics, and tactical trends per team.',
      href: '/teams',
    },
    {
      title: 'Add New Match',
      description: 'Log new match data, round splits, map pick information, and operational VOD links.',
      href: '/add-match',
    },
    {
      title: 'Admin Control Panel',
      description: 'Manage platform database configurations, user accounts, and system-level permissions.',
      href: '/admin',
    },
  ];

  return (
    <main className="min-h-screen bg-[#0b0e14] text-zinc-200 p-4 md:p-6">
      <div className="max-w-[1700px] mx-auto space-y-6">
        <Navbar />

        {/* Overview Header */}
        <div className="space-y-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-[#ff79c6]">Overview</span>
          <h2 className="text-2xl font-black text-white">Dashboard</h2>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#121620] border border-zinc-800 rounded-xl p-5 shadow-xl">
            <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Total Matches Logged</span>
            <div className="text-3xl font-black text-white mt-1">
              {loading ? '...' : totalMatches}
            </div>
          </div>
          <div className="bg-[#121620] border border-zinc-800 rounded-xl p-5 shadow-xl">
            <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Unique Teams Tracked</span>
            <div className="text-3xl font-black text-white mt-1">
              {loading ? '...' : uniqueTeams}
            </div>
          </div>
        </div>

        {/* Clickable Navigation Boxes */}
        <div className="space-y-3 pt-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Quick Navigation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {dashboardCards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="bg-[#121620] border border-zinc-800 hover:border-[#ff79c6] rounded-xl p-5 transition-all duration-200 group flex flex-col justify-between shadow-lg hover:-translate-y-0.5"
              >
                <div className="space-y-2">
                  <h4 className="text-base font-bold text-white group-hover:text-[#ff79c6] transition-colors">
                    {card.title} →
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {card.description}
                  </p>
                </div>
                <div className="mt-6 text-[11px] font-bold text-zinc-500 group-hover:text-white transition-colors">
                  Access Portal
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}