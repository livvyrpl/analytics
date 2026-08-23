'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '../../src/lib/supabase';
import Navbar from '@/app/components/Navbar';
import Link from 'next/link';

export default function MatchLibraryPage() {
  // Initialize Supabase client inside the component using the factory pattern
  const supabase = createClient();

  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit / Add Modal State
  const [editingMatch, setEditingMatch] = useState<any | null>(null);
  const [form, setForm] = useState({
    date_played: '',
    team_1: '',
    team_2: '',
    map: '',
    league: '',
    phase: '',
    match_type: 'Scrim',
    starting_side: 'Attack',
    map_picked_by: '',
    team_1_atk_ban: '',
    team_1_def_ban: '',
    team_2_atk_ban: '',
    team_2_def_ban: '',
    split_1: '',
    total_rounds: 0,
    ot_starting_side: 'N/A',
    win_loss: 'Win',
    vod_link: '',
  });

  // Filters matching the sheet sidebar
  const [selectedTeam, setSelectedTeam] = useState('ALL');
  const [selectedMap, setSelectedMap] = useState('ALL');

  useEffect(() => {
    fetchMatches();
  }, [supabase]);

  async function fetchMatches() {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('date_played', { ascending: false });

      if (error) throw error;
      setMatches(data || []);
    } catch (err) {
      console.error('Error fetching matches:', err);
    } finally {
      setLoading(false);
    }
  }

  const openEditModal = (match: any) => {
    setEditingMatch(match);
    setForm({
      date_played: match.date_played ? match.date_played.split('T')[0] : '',
      team_1: match.team_1 || match.team_a || '',
      team_2: match.team_2 || match.team_b || '',
      map: match.map || '',
      league: match.league || match.league_name || '',
      phase: match.phase || '',
      match_type: match.match_type || 'Scrim',
      starting_side: match.starting_side || 'Attack',
      map_picked_by: match.map_picked_by || '',
      team_1_atk_ban: match.team_1_atk_ban || '',
      team_1_def_ban: match.team_1_def_ban || '',
      team_2_atk_ban: match.team_2_atk_ban || '',
      team_2_def_ban: match.team_2_def_ban || '',
      split_1: match.split_1 || '',
      total_rounds: match.total_rounds || 0,
      ot_starting_side: match.ot_starting_side || 'N/A',
      win_loss: match.win_loss || 'Win',
      vod_link: match.vod_link || match.vod_url || '',
    });
  };

  const handleDelete = async (match: any) => {
    if (!window.confirm(`Delete ${match.team_1 || match.team_a || 'Team 1'} vs ${match.team_2 || match.team_b || 'Team 2'}?`)) return;

    const { error } = await supabase.from('matches').delete().eq('id', match.id);
    if (error) {
      alert(`Failed to delete match: ${error.message}`);
      return;
    }
    setMatches(current => current.filter(item => item.id !== match.id));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMatch) return;

    try {
      const { error } = await supabase
        .from('matches')
        .update(form)
        .eq('id', editingMatch.id);

      if (error) throw error;
      setEditingMatch(null);
      fetchMatches();
    } catch (err) {
      console.error('Error saving match:', err);
      alert('Failed to update match.');
    }
  };

  // Unique dropdown options for filters
  const allTeams = Array.from(
    new Set(matches.flatMap((m) => [m.team_1, m.team_2, m.team_a, m.team_b]).filter(Boolean))
  );
  const allMaps = Array.from(new Set(matches.map((m) => m.map).filter(Boolean)));

  const filteredMatches = matches.filter((m) => {
    const t1 = m.team_1 || m.team_a || '';
    const t2 = m.team_2 || m.team_b || '';
    const mapName = m.map || '';

    const teamMatch = selectedTeam === 'ALL' || t1 === selectedTeam || t2 === selectedTeam;
    const mapMatch = selectedMap === 'ALL' || mapName === selectedMap;

    return teamMatch && mapMatch;
  });

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0b0e14] text-white flex items-center justify-center">
        <div className="text-[#ff79c6] font-semibold animate-pulse">Loading Master Catalog...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0e14] text-zinc-200 p-4 md:p-6">
      <div className="max-w-[1700px] mx-auto space-y-6">
        <Navbar />

        {/* Header Title */}
        <div className="bg-[#121620] border border-zinc-800 rounded-xl p-6 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Master Catalog — <span className="text-[#ff79c6]">Match Library</span>
            </h1>
            <p className="text-zinc-400 text-xs mt-1">Detailed breakdown of team scrims and official game days.</p>
          </div>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-semibold text-zinc-200 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Main Content Layout (Sidebar Filters + Data Table) */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* Sidebar Controls matching Google Sheet */}
          <div className="lg:col-span-1 bg-[#121620] border border-zinc-800 rounded-xl p-5 space-y-6 h-fit">
            <div>
              <label className="block text-[11px] font-black uppercase text-[#ff79c6] tracking-wider mb-2">
                Select Team
              </label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full bg-[#0b0e14] border border-zinc-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#ff79c6]"
              >
                <option value="ALL">ALL TEAMS</option>
                {allTeams.map((team, idx) => (
                  <option key={idx} value={team}>{team}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-[#ff79c6] tracking-wider mb-2">
                Select Map
              </label>
              <select
                value={selectedMap}
                onChange={(e) => setSelectedMap(e.target.value)}
                className="w-full bg-[#0b0e14] border border-zinc-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#ff79c6]"
              >
                <option value="ALL">ALL MAPS</option>
                {allMaps.map((map, idx) => (
                  <option key={idx} value={map}>{map}</option>
                ))}
              </select>
            </div>

            <div className="pt-4 border-t border-zinc-800 text-xs text-zinc-400 space-y-2">
              <p>💡 Click <strong className="text-white">"Edit"</strong> on any row entry to update score splits, bans, and VOD links.</p>
            </div>
          </div>

          {/* Spreadsheet Data Table */}
          <div className="lg:col-span-4 bg-[#121620] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead>
                  <tr className="bg-[#181d2c] text-zinc-400 uppercase font-bold border-b border-zinc-800 text-[10px]">
                    <th className="p-3">Action</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Team 1</th>
                    <th className="p-3">Team 2</th>
                    <th className="p-3">Map</th>
                    <th className="p-3">League</th>
                    <th className="p-3">Phase</th>
                    <th className="p-3">Tag</th>
                    <th className="p-3">Starting Side</th>
                    <th className="p-3">Map Picked By</th>
                    <th className="p-3">Team 1 ATK Ban</th>
                    <th className="p-3">Team 1 DEF Ban</th>
                    <th className="p-3">Team 2 ATK Ban</th>
                    <th className="p-3">Team 2 DEF Ban</th>
                    <th className="p-3">Split 1</th>
                    <th className="p-3">Total Rounds</th>
                    <th className="p-3">OT Starting Side</th>
                    <th className="p-3">Win/Loss</th>
                    <th className="p-3">VOD Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-medium">
                  {filteredMatches.length === 0 ? (
                    <tr>
                      <td colSpan={19} className="p-12 text-center text-zinc-500">
                        No match entries found. Add data or clear filters.
                      </td>
                    </tr>
                  ) : (
                    filteredMatches.map((m) => {
                      const t1 = m.team_1 || m.team_a || 'Team 1';
                      const t2 = m.team_2 || m.team_b || 'Team 2';
                      const isWin = (m.win_loss || '').toLowerCase() === 'win';

                      return (
                        <tr key={m.id} className="hover:bg-[#181d2c]/50 transition-colors">
                          <td className="p-3">
                            <button
                              onClick={() => openEditModal(m)}
                              className="px-2 py-1 bg-zinc-800 hover:bg-[#ff79c6] hover:text-black rounded text-[10px] font-bold transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(m)}
                              className="ml-2 px-2 py-1 bg-red-950 text-red-300 hover:bg-red-500 hover:text-white rounded text-[10px] font-bold transition-colors"
                            >
                              Delete
                            </button>
                          </td>
                          <td className="p-3 text-zinc-300">
                            {m.date_played ? new Date(m.date_played).toLocaleDateString() : '-'}
                          </td>
                          <td className="p-3 font-bold text-white">{t1}</td>
                          <td className="p-3 font-bold text-white">{t2}</td>
                          <td className="p-3 text-zinc-200">{m.map || '-'}</td>
                          <td className="p-3 text-zinc-300">{m.league || '-'}</td>
                          <td className="p-3 text-zinc-300">{m.phase || '-'}</td>
                          <td className="p-3 text-zinc-300">{m.match_type || 'Scrim'}</td>
                          <td className="p-3 text-zinc-300">{m.starting_side || '-'}</td>
                          <td className="p-3 text-zinc-300">{m.map_picked_by || '-'}</td>
                          <td className="p-3 text-zinc-400">{m.team_1_atk_ban || '-'}</td>
                          <td className="p-3 text-zinc-400">{m.team_1_def_ban || '-'}</td>
                          <td className="p-3 text-zinc-400">{m.team_2_atk_ban || '-'}</td>
                          <td className="p-3 text-zinc-400">{m.team_2_def_ban || '-'}</td>
                          <td className="p-3 text-zinc-300 text-center">{m.split_1 || '-'}</td>
                          <td className="p-3 text-white font-bold text-center">{m.total_rounds || '-'}</td>
                          <td className="p-3 text-zinc-300">{m.ot_starting_side || 'N/A'}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              isWin ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'
                            }`}>
                              {m.win_loss || 'Loss'}
                            </span>
                          </td>
                          <td className="p-3">
                            {m.vod_link ? (
                              <a
                                href={m.vod_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#ff79c6] hover:underline font-bold"
                              >
                                VOD ↗
                              </a>
                            ) : (
                              <span className="text-zinc-600">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {/* EDIT MODAL */}
      {editingMatch && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#121620] border border-zinc-800 rounded-2xl p-6 w-full max-w-3xl space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
              <h3 className="text-lg font-bold text-white">Edit Match Entry</h3>
              <button onClick={() => setEditingMatch(null)} className="text-zinc-400 hover:text-white font-bold">✕</button>
            </div>

            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-400 uppercase mb-1">Date</label>
                <input
                  type="date"
                  value={form.date_played}
                  onChange={(e) => setForm({ ...form, date_played: e.target.value })}
                  className="w-full bg-[#0b0e14] border border-zinc-700 rounded p-2 text-white"
                />
              </div>
              <div>
                <label className="block font-bold text-zinc-400 uppercase mb-1">Team 1</label>
                <input
                  type="text"
                  value={form.team_1}
                  onChange={(e) => setForm({ ...form, team_1: e.target.value })}
                  className="w-full bg-[#0b0e14] border border-zinc-700 rounded p-2 text-white"
                />
              </div>
              <div>
                <label className="block font-bold text-zinc-400 uppercase mb-1">Team 2</label>
                <input
                  type="text"
                  value={form.team_2}
                  onChange={(e) => setForm({ ...form, team_2: e.target.value })}
                  className="w-full bg-[#0b0e14] border border-zinc-700 rounded p-2 text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-400 uppercase mb-1">Map</label>
                <input
                  type="text"
                  value={form.map}
                  onChange={(e) => setForm({ ...form, map: e.target.value })}
                  className="w-full bg-[#0b0e14] border border-zinc-700 rounded p-2 text-white"
                />
              </div>
              <div>
                <label className="block font-bold text-zinc-400 uppercase mb-1">League</label>
                <input
                  type="text"
                  value={form.league}
                  onChange={(e) => setForm({ ...form, league: e.target.value })}
                  className="w-full bg-[#0b0e14] border border-zinc-700 rounded p-2 text-white"
                />
              </div>
              <div>
                <label className="block font-bold text-zinc-400 uppercase mb-1">Phase</label>
                <input
                  type="text"
                  value={form.phase}
                  onChange={(e) => setForm({ ...form, phase: e.target.value })}
                  className="w-full bg-[#0b0e14] border border-zinc-700 rounded p-2 text-white"
                />
              </div>
              <div>
                <label className="block font-bold text-zinc-400 uppercase mb-1">Match Tag</label>
                <select
                  value={form.match_type}
                  onChange={(e) => setForm({ ...form, match_type: e.target.value })}
                  className="w-full bg-[#0b0e14] border border-zinc-700 rounded p-2 text-white"
                >
                  <option value="Scrim">Scrim</option>
                  <option value="Gameday">Gameday</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-zinc-400 uppercase mb-1">Starting Side</label>
                <input
                  type="text"
                  value={form.starting_side}
                  onChange={(e) => setForm({ ...form, starting_side: e.target.value })}
                  className="w-full bg-[#0b0e14] border border-zinc-700 rounded p-2 text-white"
                />
              </div>
              <div>
                <label className="block font-bold text-zinc-400 uppercase mb-1">Map Picked By</label>
                <input
                  type="text"
                  value={form.map_picked_by}
                  onChange={(e) => setForm({ ...form, map_picked_by: e.target.value })}
                  className="w-full bg-[#0b0e14] border border-zinc-700 rounded p-2 text-white"
                />
              </div>
              <div>
                <label className="block font-bold text-zinc-400 uppercase mb-1">Win / Loss</label>
                <select
                  value={form.win_loss}
                  onChange={(e) => setForm({ ...form, win_loss: e.target.value })}
                  className="w-full bg-[#0b0e14] border border-zinc-700 rounded p-2 text-white"
                >
                  <option value="Win">Win</option>
                  <option value="Loss">Loss</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-zinc-400 uppercase mb-1">Team 1 ATK Ban</label>
                <input
                  type="text"
                  value={form.team_1_atk_ban}
                  onChange={(e) => setForm({ ...form, team_1_atk_ban: e.target.value })}
                  className="w-full bg-[#0b0e14] border border-zinc-700 rounded p-2 text-white"
                />
              </div>
              <div>
                <label className="block font-bold text-zinc-400 uppercase mb-1">Team 1 DEF Ban</label>
                <input
                  type="text"
                  value={form.team_1_def_ban}
                  onChange={(e) => setForm({ ...form, team_1_def_ban: e.target.value })}
                  className="w-full bg-[#0b0e14] border border-zinc-700 rounded p-2 text-white"
                />
              </div>
              <div>
                <label className="block font-bold text-zinc-400 uppercase mb-1">Team 2 ATK Ban</label>
                <input
                  type="text"
                  value={form.team_2_atk_ban}
                  onChange={(e) => setForm({ ...form, team_2_atk_ban: e.target.value })}
                  className="w-full bg-[#0b0e14] border border-zinc-700 rounded p-2 text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-400 uppercase mb-1">Team 2 DEF Ban</label>
                <input
                  type="text"
                  value={form.team_2_def_ban}
                  onChange={(e) => setForm({ ...form, team_2_def_ban: e.target.value })}
                  className="w-full bg-[#0b0e14] border border-zinc-700 rounded p-2 text-white"
                />
              </div>
              <div>
                <label className="block font-bold text-zinc-400 uppercase mb-1">Split 1 (e.g. 1-5)</label>
                <input
                  type="text"
                  value={form.split_1}
                  onChange={(e) => setForm({ ...form, split_1: e.target.value })}
                  className="w-full bg-[#0b0e14] border border-zinc-700 rounded p-2 text-white"
                />
              </div>
              <div>
                <label className="block font-bold text-zinc-400 uppercase mb-1">Total Rounds</label>
                <input
                  type="number"
                  value={form.total_rounds}
                  onChange={(e) => setForm({ ...form, total_rounds: parseInt(e.target.value) || 0 })}
                  className="w-full bg-[#0b0e14] border border-zinc-700 rounded p-2 text-white"
                />
              </div>
              <div>
                <label className="block font-bold text-zinc-400 uppercase mb-1">OT Starting Side</label>
                <input
                  type="text"
                  value={form.ot_starting_side}
                  onChange={(e) => setForm({ ...form, ot_starting_side: e.target.value })}
                  className="w-full bg-[#0b0e14] border border-zinc-700 rounded p-2 text-white"
                />
              </div>
              <div>
                <label className="block font-bold text-zinc-400 uppercase mb-1">VOD Link</label>
                <input
                  type="text"
                  value={form.vod_link}
                  onChange={(e) => setForm({ ...form, vod_link: e.target.value })}
                  className="w-full bg-[#0b0e14] border border-zinc-700 rounded p-2 text-white"
                />
              </div>

              <div className="md:col-span-3 flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingMatch(null)}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#ff79c6] text-black font-bold rounded hover:bg-[#ff52b2]"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}