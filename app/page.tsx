'use client';

import React, { useState, useRef } from 'react';
import Navbar from '@/app/components/Navbar';

export default function Home() {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [league, setLeague] = useState('');
  const [phase, setPhase] = useState('');
  const [vodUrl, setVodUrl] = useState('');
  const [datePlayed, setDatePlayed] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(e.target.files);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!selectedFiles || selectedFiles.length === 0) {
      setError('Please select a folder containing replay round (.rec) files.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      for (let i = 0; i < selectedFiles.length; i++) {
        formData.append('files', selectedFiles[i]);
      }

      formData.append('teamA', teamA);
      formData.append('teamB', teamB);
      formData.append('league', league);
      formData.append('phase', phase);
      formData.append('vodUrl', vodUrl);
      formData.append('datePlayed', datePlayed);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process replay folder.');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during parsing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Reusable Navbar */}
        <Navbar />

        {/* Hero Banner */}
        <div className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-8 relative overflow-hidden shadow-2xl flex flex-col justify-between">
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
              <span className="text-[#ff79c6]">LIV</span> <span className="text-zinc-100">ANALYTICS</span>
            </h1>
            <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
              Log match details, map bans, operator bans, operators played, and round-by-round results.
            </p>
          </div>
          <div className="absolute right-[-20px] bottom-[-40px] opacity-10 pointer-events-none">
            <div className="w-64 h-64 border-8 border-zinc-700 rounded-full flex items-center justify-center">
              <div className="w-32 h-32 border-4 border-zinc-700 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Form Container Box */}
        <div className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-zinc-100 mb-6">
            Import Match Replay Folder
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-800 hover:border-[#ff79c6] bg-black/50 rounded-lg p-8 text-center cursor-pointer transition-colors"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                // @ts-ignore
                webkitdirectory=""
                directory=""
                multiple
              />
              {selectedFiles && selectedFiles.length > 0 ? (
                <p className="text-[#ff79c6] font-semibold text-lg">
                  {selectedFiles.length} file(s) selected
                </p>
              ) : (
                <div>
                  <p className="text-zinc-300 font-medium">Click to select match folder</p>
                  <p className="text-zinc-500 text-sm mt-1">Select the folder containing .rec round files</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Your Team / Team A</label>
                <input
                  type="text"
                  value={teamA}
                  onChange={(e) => setTeamA(e.target.value)}
                  placeholder="DZ"
                  className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-[#ff79c6]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Enemy Team / Team B</label>
                <input
                  type="text"
                  value={teamB}
                  onChange={(e) => setTeamB(e.target.value)}
                  placeholder="GK"
                  className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-[#ff79c6]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">League Name</label>
                <input
                  type="text"
                  value={league}
                  onChange={(e) => setLeague(e.target.value)}
                  placeholder="test"
                  className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-[#ff79c6]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Phase</label>
                <input
                  type="text"
                  value={phase}
                  onChange={(e) => setPhase(e.target.value)}
                  placeholder="Playdays / Playoffs"
                  className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-[#ff79c6]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Date Played</label>
                <input
                  type="date"
                  value={datePlayed}
                  onChange={(e) => setDatePlayed(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-[#ff79c6]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">VOD URL</label>
                <input
                  type="text"
                  value={vodUrl}
                  onChange={(e) => setVodUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-[#ff79c6]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#ff79c6] hover:bg-[#ff52b2] text-black font-bold rounded transition-colors disabled:opacity-50 shadow-lg shadow-[#ff79c6]/10"
            >
              {loading ? 'Processing Replay Data...' : 'Parse & Save Match Data'}
            </button>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-950/40 border border-red-500/50 rounded text-red-400 text-sm text-center font-mono break-words">
              Error: {error}
            </div>
          )}

          {success && (
            <div className="mt-6 p-4 bg-emerald-950/40 border border-emerald-500/50 rounded text-emerald-400 text-sm text-center font-semibold">
              Match replay processed and saved successfully!
            </div>
          )}
        </div>

      </div>
    </main>
  );
}