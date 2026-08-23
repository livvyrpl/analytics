'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '../../src/lib/supabase';

export default function Navbar() {
  const supabase = createClient();
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        // Extract the username part from the email for a clean greeting
        const name = user.email.split('@')[0];
        setUserEmail(name);
      }
    }
    getUser();
  }, [supabase]);

  const navLinks = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Match Library', href: '/match-library' },
    { name: 'Teams', href: '/teams' },
    { name: 'Admin', href: '/admin' }, // Added Admin tab here
  ];

  return (
    <nav className="bg-[#121620] border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
      <div>
        <h1 className="text-xl font-black tracking-tight text-white">
          LIV <span className="text-[#ff79c6]">ANALYTICS</span>
        </h1>
        <p className="text-zinc-400 text-xs mt-0.5">Track matches, map pools, scrims, and performance.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                isActive
                  ? 'bg-[#ff79c6] text-black font-bold'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
              }`}
            >
              {link.name}
            </Link>
          );
        })}

        {/* Welcome User text next to Add Match */}
        {userEmail && (
          <span className="text-xs text-zinc-400 hidden xl:inline">
            Welcome, <strong className="text-white capitalize">{userEmail}</strong>
          </span>
        )}

        <Link
          href="/add-match"
          className="px-4 py-1.5 bg-[#ff79c6] hover:bg-[#ff52b2] text-black rounded-lg text-xs font-bold transition-colors shadow-lg"
        >
          + Add Match
        </Link>
      </div>
    </nav>
  );
}