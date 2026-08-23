'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-[#121620] border border-zinc-800 rounded-2xl px-6 py-5 flex flex-wrap justify-between items-center gap-4 shadow-xl">
      <div className="space-y-1">
        <span className="font-black tracking-wider text-lg block">
          <span className="text-[#ff79c6]">LIV</span> <span className="text-white">ANALYTICS</span>
        </span>
        <p className="text-xs text-zinc-400">
          Track matches, map pools, scrims, operator bans, and round-by-round performance for Rainbow Six Siege.
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Link
          href="/dashboard"
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
            isActive('/dashboard') ? 'bg-[#ff79c6] text-black' : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
          }`}
        >
          Dashboard
        </Link>
        <Link
          href="/match-library"
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
            isActive('/match-library') ? 'bg-[#ff79c6] text-black' : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
          }`}
        >
          Match Library
        </Link>
        <Link
          href="/teams"
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
            isActive('/teams') ? 'bg-[#ff79c6] text-black' : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
          }`}
        >
          Teams
        </Link>
        <Link
          href="/add-match"
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
            isActive('/add-match') ? 'bg-[#ff79c6] text-black' : 'bg-zinc-900 text-[#ff79c6] border border-[#ff79c6]/30 hover:bg-zinc-800'
          }`}
        >
          <span>＋</span> Add Match
        </Link>
      </div>
    </nav>
  );
}