'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '../../src/lib/supabase';

// List of authorized admin email addresses
const ADMIN_EMAILS = [
  'olivia.stinson0@gmail.com', // Replace or add your admin emails here
  // 'another-admin@gmail.com'
];

export default function Navbar() {
  const supabase = createClient();
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
        // Check if user email is in the admin list
        if (ADMIN_EMAILS.includes(user.email)) {
          setIsAdmin(true);
        }
      }
    }
    getUser();
  }, [supabase]);

  // Base navigation links visible to everyone logged in
  const navLinks = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Match Library', href: '/match-library' },
    { name: 'Teams', href: '/teams' },
  ];

  // Conditionally add Admin link if the user is verified
  if (isAdmin) {
    navLinks.push({ name: 'Admin', href: '/admin' });
  }

  const cleanName = userEmail ? userEmail.split('@')[0] : '';

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
        {cleanName && (
          <span className="text-xs text-zinc-400 hidden xl:inline">
            Welcome, <strong className="text-white capitalize">{cleanName}</strong>
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