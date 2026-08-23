'use client';

import React, { useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
          alert(error.message);
        } else {
          if (data.user) {
            await supabase.from('user_roles').insert([
              { id: data.user.id, email: data.user.email, role: 'user' }
            ]);
          }
          alert('Signup successful! Please log in.');
          setIsSignUp(false);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          alert(error.message);
        } else {
          // Force a hard navigation to bypass router cache and trigger middleware with the new cookie
          window.location.href = '/admin';
        }
      }
    } catch (err: any) {
      alert(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0b0e14] text-zinc-200 flex items-center justify-center p-4">
      <div className="bg-[#121620] border border-zinc-800 rounded-2xl p-8 shadow-xl w-full max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-black text-white">{isSignUp ? 'Create Account' : 'Welcome Back'}</h1>
          <p className="text-xs text-zinc-400 mt-1">Sign in to access the Rainbow Six Siege Analyst platform.</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-sm text-white" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-sm text-white" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-[#ff79c6] text-black font-black text-sm rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Log In')}
          </button>
        </form>

        <div className="text-center">
          <button 
            type="button" 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-zinc-400 hover:text-white underline"
          >
            {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </main>
  );
}