'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import Navbar from '@/app/components/Navbar';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdminAndFetchUsers() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login'); // Redirect to login if not logged in
        return;
      }

      // Check if current user is an admin
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (roleError || roleData?.role !== 'admin') {
        alert('Access denied. Admins only.');
        router.push('/dashboard');
        return;
      }

      setIsAdmin(true);

      // Fetch all users and their roles
      const { data: profiles, error: profilesError } = await supabase
        .from('user_roles')
        .select('*');

      if (!profilesError && profiles) {
        setUsers(profiles);
      }
      setLoading(false);
    }

    checkAdminAndFetchUsers();
  }, [router]);

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const { error } = await supabase
      .from('user_roles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      alert('Failed to update role');
    } else {
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }
  };

  if (loading) {
    return <main className="min-h-screen bg-[#0b0e14] text-white p-8">Loading admin panel...</main>;
  }

  if (!isAdmin) return null;

  return (
    <main className="min-h-screen bg-[#0b0e14] text-zinc-200 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Navbar />
        <div className="bg-[#121620] border border-zinc-800 rounded-2xl p-8 shadow-xl">
          <h1 className="text-2xl font-black text-white mb-2">Admin Access Management</h1>
          <p className="text-xs text-zinc-400 mb-6">Manage who has permission to view or submit data to your website.</p>

          <div className="space-y-3">
            {users.map((u) => (
              <div key={u.id} className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
                <div>
                  <p className="text-sm font-bold text-white">{u.email}</p>
                  <p className="text-[10px] text-zinc-500 uppercase">ID: {u.id}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xs px-2.5 py-1 rounded font-bold uppercase ${u.role === 'admin' ? 'bg-[#ff79c6] text-black' : 'bg-zinc-800 text-zinc-400'}`}>
                    {u.role}
                  </span>
                  <button 
                    onClick={() => toggleRole(u.id, u.role)}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    Toggle Role
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}