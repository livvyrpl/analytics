'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import { supabase } from '@/src/lib/supabase';

type Match = Record<string, any>;
type Round = {
  map_name?: string;
  site?: string;
  team_1_side?: string;
  team_2_side?: string;
  team_1_operators?: string[];
  team_2_operators?: string[];
  winner?: string;
};

type Count = { name: string; count: number };
type TeamPlayer = { name: string; role: string };
type TeamStaff = { name: string; role: string };
type TeamProfile = { logo: string; players: TeamPlayer[]; staff: TeamStaff[]; notes: string; color: string };
const DEFAULT_PROFILE: TeamProfile = {
  logo: '',
  players: Array.from({ length: 5 }, () => ({ name: '', role: '' })),
  staff: Array.from({ length: 3 }, () => ({ name: '', role: '' })),
  notes: '',
  color: '#ff80ab',
};
const PLAYER_ROLES = ['IGL', 'Soft Support', 'Hard Support', 'Flex'];
const STAFF_ROLES = ['Head Coach', 'Assistant Coach', 'Analyst'];

function normalizeProfile(value: Partial<TeamProfile> | null): TeamProfile {
  const legacy = value as (Partial<TeamProfile> & { players?: unknown; staff?: unknown }) | null;
  const players = Array.isArray(legacy?.players)
    ? legacy.players.map((player: unknown) => typeof player === 'string' ? { name: player, role: '' } : { name: (player as TeamPlayer).name || '', role: (player as TeamPlayer).role || '' })
    : [];
  const staff = Array.isArray(legacy?.staff)
    ? legacy.staff.map((member: unknown) => typeof member === 'string' ? { name: member, role: '' } : { name: (member as TeamStaff).name || '', role: (member as TeamStaff).role || '' })
    : [];
  return {
    ...DEFAULT_PROFILE,
    ...value,
    players: [...players, ...DEFAULT_PROFILE.players].slice(0, 5),
    staff: [...staff, ...DEFAULT_PROFILE.staff].slice(0, 3),
  };
}
const ANALYTICS_MAPS = ['Bank', 'Border', 'Chalet', 'Clubhouse', 'Consulate', 'Coastline', 'Emerald Plains', 'Kafe Dostoyevsky', 'Lair', 'Nighthaven Labs', 'Oregon', 'Outback', 'Skyscraper', 'Theme Park', 'Villa'];

function raw(match: Match) {
  return typeof match.raw_data === 'string' ? JSON.parse(match.raw_data || '{}') : match.raw_data || {};
}

function addCount(target: Map<string, number>, values: unknown) {
  if (!Array.isArray(values)) return;
  values.filter(Boolean).forEach(value => target.set(String(value), (target.get(String(value)) || 0) + 1));
}

function topCounts(target: Map<string, number>, limit = 10): Count[] {
  return Array.from(target, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, limit);
}

function roundsFor(match: Match): Round[] {
  const data = raw(match);
  return Array.isArray(data.rounds_data) ? data.rounds_data : [];
}

function teamNames(match: Match) {
  return {
    team1: match.team_1 || match.team_a || 'Team 1',
    team2: match.team_2 || match.team_b || 'Team 2',
  };
}

function percentage(value: number, total: number) {
  return total ? `${Math.round((value / total) * 100)}%` : '0%';
}

function normalizeMap(value: unknown) {
  if (!value) return 'Unknown';
  if (typeof value === 'object' && value !== null) return (value as { name?: string }).name || 'Unknown';
  if (typeof value !== 'string') return String(value);
  if (value.startsWith('{')) {
    try {
      const parsed = JSON.parse(value);
      const parsedName = parsed.name || parsed.Name || 'Unknown';
      if (parsed.id === 413845419788 || parsedName === 'Map(413845419788)') return 'Kafe Dostoyevsky';
      return parsedName.replace(/Y\d+$/, '');
    } catch {
      return value;
    }
  }
  if (value === 'Map(413845419788)') return 'Kafe Dostoyevsky';
  return value.replace(/Y\d+$/, '');
}

function StatTable({ title, columns, rows }: { title: string; columns: string[]; rows: string[][] }) {
  return (
    <section className="bg-[#121620] border border-zinc-800 rounded-xl overflow-hidden">
      <div className="bg-zinc-800 px-3 py-1.5"><h2 className="text-xs font-black uppercase text-white">{title}</h2></div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead><tr className="bg-zinc-700 text-[10px] uppercase text-zinc-200">{columns.map(column => <th key={column} className="p-1.5">{column}</th>)}</tr></thead>
          <tbody className="divide-y divide-zinc-800/70">{rows.length ? rows.map((row, index) => <tr key={`${title}-${index}`} className="text-zinc-300">{row.map((cell, cellIndex) => <td key={cellIndex} className={`p-3 ${cellIndex === 0 ? 'font-bold text-white' : ''}`}>{cell}</td>)}</tr>) : <tr><td colSpan={columns.length} className="p-5 text-zinc-500">No uploaded data for this view.</td></tr>}</tbody>
        </table>
      </div>
    </section>
  );
}

function MatrixTable({ title, columns, rows }: { title: string; columns: string[]; rows: string[][] }) {
  return (
    <section className="bg-[#121620] border border-zinc-800 rounded-xl overflow-hidden">
      <div className="bg-zinc-800 px-3 py-1.5"><h2 className="text-xs font-black uppercase text-white">{title}</h2></div>
      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-center text-[10px]">
          <thead><tr className="bg-zinc-700 text-zinc-200 uppercase">{columns.map(column => <th key={column} className="p-1.5 border-r border-zinc-600">{column}</th>)}</tr></thead>
          <tbody className="divide-y divide-zinc-800">{rows.map((row, index) => <tr key={`${title}-${index}`} className="text-zinc-200">{row.map((cell, cellIndex) => <td key={cellIndex} className={`p-1.5 border-r border-zinc-800 ${cellIndex === 0 ? 'bg-[#181d2c] font-bold text-[#cda6ff]' : ''}`}>{cell || '-'}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}

export default function TeamsPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [profile, setProfile] = useState<TeamProfile>(DEFAULT_PROFILE);
  const [editingProfile, setEditingProfile] = useState(false);
  const [selectedSiteMap, setSelectedSiteMap] = useState('ALL');
  const [selectedSideMap, setSelectedSideMap] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMatches() {
      const { data, error } = await supabase.from('matches').select('*').order('date_played', { ascending: false });
      if (!error) {
        const loaded = data || [];
        setMatches(loaded);
        const first = loaded[0] ? teamNames(loaded[0]).team1 : '';
        setSelectedTeam(first);
      }
      setLoading(false);
    }
    loadMatches();
  }, []);

  useEffect(() => {
    if (!selectedTeam) return;
    const saved = localStorage.getItem(`team-profile:${selectedTeam}`);
    setProfile(saved ? normalizeProfile(JSON.parse(saved)) : DEFAULT_PROFILE);
    setEditingProfile(false);
  }, [selectedTeam]);

  const saveProfile = () => {
    localStorage.setItem(`team-profile:${selectedTeam}`, JSON.stringify(profile));
    setEditingProfile(false);
  };

  const deleteTeamProfile = async () => {
    if (!window.confirm(`Delete ${selectedTeam} and all uploaded matches for this team?`)) return;
    const teamMatches = matches.filter(match => {
      const names = teamNames(match);
      return names.team1 === selectedTeam || names.team2 === selectedTeam;
    });
    const { error } = teamMatches.length
      ? await supabase.from('matches').delete().in('id', teamMatches.map(match => match.id))
      : { error: null };
    if (error) {
      alert(`Failed to delete team: ${error.message}`);
      return;
    }
    localStorage.removeItem(`team-profile:${selectedTeam}`);
    setMatches(current => current.filter(match => !teamMatches.some(deleted => deleted.id === match.id)));
    setSelectedTeam('');
    setProfile(DEFAULT_PROFILE);
    setEditingProfile(false);
  };

  const teams = useMemo(() => Array.from(new Set(matches.flatMap(match => {
    const names = teamNames(match);
    return [names.team1, names.team2];
  }))).sort(), [matches]);

  const stats = useMemo(() => {
    const selectedMatches = matches.filter(match => {
      const names = teamNames(match);
      return names.team1 === selectedTeam || names.team2 === selectedTeam;
    });
    const mapRows = new Map<string, { games: number; wins: number; losses: number }>();
    const banRows = new Map<string, { banned: number; firstTwo: number; against: number; picked: number; enemyPicked: number }>();
    const sideRows = new Map<string, { rounds: number; wins: number }>();
    const sideMapRows = new Map<string, { rounds: number; wins: number }>();
    const played = new Map<string, Map<string, number>>();
    const banned = new Map<string, Map<string, number>>();
    const bannedByMap = new Map<string, Map<string, number>>();
    const sitePlayed = new Map<string, number>();
    let wins = 0;
    let rounds = 0;

    for (const match of selectedMatches) {
      const names = teamNames(match);
      const teamNumber = names.team1 === selectedTeam ? 1 : 2;
      const matchRounds = roundsFor(match);
      const currentMap = normalizeMap(match.map || match.map_name || matchRounds[0]?.map_name || 'Unknown');
      const mapStat = mapRows.get(currentMap) || { games: 0, wins: 0, losses: 0 };
      mapStat.games += 1;
      const matchWins = matchRounds.filter(round => round.winner === `Team ${teamNumber}`).length;
      const matchLosses = matchRounds.filter(round => round.winner && round.winner !== `Team ${teamNumber}`).length;
      const won = match.win_loss?.toLowerCase() === 'win' || matchWins > matchLosses;
      if (won) { mapStat.wins += 1; wins += 1; } else { mapStat.losses += 1; }
      mapRows.set(currentMap, mapStat);

      const data = raw(match);
      const mapPicks = data.map_picks || {};
      const mapBans = data.map_bans || {};
      const operatorBans = data.operator_bans || {};
      const teamBans = teamNumber === 1 ? mapBans.team1MapBans : mapBans.team2MapBans;
      const enemyBans = teamNumber === 1 ? mapBans.team2MapBans : mapBans.team1MapBans;
      const teamPick = teamNumber === 1 ? mapPicks.team1MapPick : mapPicks.team2MapPick;
      const enemyPick = teamNumber === 1 ? mapPicks.team2MapPick : mapPicks.team1MapPick;
      for (const [side, values] of [['Attack', teamNumber === 1 ? operatorBans.team1AtkBans : operatorBans.team2AtkBans], ['Defense', teamNumber === 1 ? operatorBans.team1DefBans : operatorBans.team2DefBans]] as [string, unknown][]) {
        const mapBanCounts = bannedByMap.get(`${currentMap}|${side}`) || new Map<string, number>();
        addCount(mapBanCounts, values);
        bannedByMap.set(`${currentMap}|${side}`, mapBanCounts);
        const overallBanCounts = banned.get(side === 'Attack' ? 'atk' : 'def') || new Map<string, number>();
        addCount(overallBanCounts, values);
        banned.set(side === 'Attack' ? 'atk' : 'def', overallBanCounts);
      }
      for (const map of Array.from(new Set([...(teamBans || []), ...(enemyBans || []), teamPick, enemyPick].filter(Boolean)))) {
        const row = banRows.get(String(map)) || { banned: 0, firstTwo: 0, against: 0, picked: 0, enemyPicked: 0 };
        if (teamBans?.includes(map)) { row.banned += 1; if (teamBans.indexOf(map) < 2) row.firstTwo += 1; }
        if (enemyBans?.includes(map)) row.against += 1;
        if (teamPick === map) row.picked += 1;
        if (enemyPick === map) row.enemyPicked += 1;
        banRows.set(String(map), row);
      }

      for (const round of matchRounds) {
        const side = teamNumber === 1 ? round.team_1_side : round.team_2_side;
        const operators = teamNumber === 1 ? round.team_1_operators : round.team_2_operators;
        const enemyOperators = teamNumber === 1 ? round.team_2_operators : round.team_1_operators;
        const sideKey = side || 'Unknown';
        const sideStat = sideRows.get(sideKey) || { rounds: 0, wins: 0 };
        sideStat.rounds += 1;
        if (round.winner === `Team ${teamNumber}`) sideStat.wins += 1;
        sideRows.set(sideKey, sideStat);
        rounds += 1;
        const mapKey = normalizeMap(round.map_name || currentMap);
        const sideMapStat = sideMapRows.get(`${mapKey}|${sideKey}`) || { rounds: 0, wins: 0 };
        sideMapStat.rounds += 1;
        if (round.winner === `Team ${teamNumber}`) sideMapStat.wins += 1;
        sideMapRows.set(`${mapKey}|${sideKey}`, sideMapStat);
        const playedKey = `${mapKey}|${sideKey}`;
        const mapPlayed = played.get(playedKey) || new Map<string, number>();
        addCount(mapPlayed, operators);
        played.set(playedKey, mapPlayed);
        for (const operator of operators || []) sitePlayed.set(`${mapKey}|${round.site || 'Unknown'}|${sideKey}|${operator}`, (sitePlayed.get(`${mapKey}|${round.site || 'Unknown'}|${sideKey}|${operator}`) || 0) + 1);
        void enemyOperators;
      }
    }

    const filterMap = (_name: string) => true;
    const mapStats = ANALYTICS_MAPS.map(name => [name, mapRows.get(name) || { games: 0, wins: 0, losses: 0 }] as const);
    const mapBanStats = ANALYTICS_MAPS.map(name => [name, banRows.get(name) || { banned: 0, firstTwo: 0, against: 0, picked: 0, enemyPicked: 0 }] as const);
    const topPlayed = (side: string, map?: string) => {
      const counts = new Map<string, number>();
      for (const [key, values] of played) {
        const [name, playedSide] = key.split('|');
        if ((!map || name === map) && playedSide === side) addCount(counts, Array.from(values.entries()).flatMap(([operator, count]) => Array(count).fill(operator)));
      }
      return topCounts(counts);
    };
    const matrixFor = (source: Map<string, Map<string, number>>, side: string) => {
      const names = ANALYTICS_MAPS;
      const rows = Array.from({ length: 10 }, (_, rank) => names.map(name => {
        const values = source.get(`${name}|${side}`);
        const item = values ? topCounts(values, 10)[rank] : undefined;
        return item ? `${item.name} (${item.count})` : '';
      }));
      return { names, rows };
    };
    const bannedMatrixFor = (side: string) => {
      const source = new Map<string, Map<string, number>>();
      for (const [key, values] of bannedByMap) if (key.endsWith(`|${side}`)) source.set(key, values);
      return matrixFor(source, side);
    };
    const siteMaps = selectedSiteMap === 'ALL' ? ANALYTICS_MAPS : [selectedSiteMap];
    const siteKeys = Array.from(new Set(Array.from(sitePlayed.keys()).map(key => key.split('|').slice(1, 3).join('|')))).sort();
    const siteMatrixRows = siteKeys.map(siteKey => [siteKey.replace('|', ' / '), ...siteMaps.map(map => {
      const values = new Map<string, number>();
      for (const [key, count] of sitePlayed) {
        const [keyMap, keySite, keySide, operator] = key.split('|');
        if (keyMap === map && `${keySite}|${keySide}` === siteKey) values.set(operator, count);
      }
      return topCounts(values, 3).map(item => `${item.name} (${item.count})`).join(', ');
    })]);
    const siteRows = Array.from(sitePlayed, ([key, count]) => { const [map, site, side, operator] = key.split('|'); return { map, site, side, operator, count }; }).filter(row => filterMap(row.map)).sort((a, b) => b.count - a.count).slice(0, 20);
    return { selectedMatches, mapStats, mapBanStats, mapRows, sideRows, sideMapRows, topPlayed, played, matrixFor, bannedMatrixFor, banned, siteRows, siteMaps, siteMatrixRows, wins, rounds };
  }, [matches, selectedTeam, selectedSiteMap]);

  if (loading) return <main className="min-h-screen bg-[#0b0e14] text-white flex items-center justify-center">Loading team analytics...</main>;

  return (
    <main className="min-h-screen bg-[#0b0e14] text-zinc-200 p-4 md:p-8">
      <div className="max-w-[1700px] mx-auto space-y-6">
        <Navbar />
        <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-end">
          <div><p className="text-xs uppercase font-black tracking-widest text-[#ff79c6]">Team Intelligence</p><h1 className="text-3xl font-black text-white mt-1">Performance Atlas</h1><p className="text-sm text-zinc-400 mt-1">Every result below is calculated from uploaded matches and round breakdowns.</p></div>
          <Link href="/match-library" className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-bold text-zinc-300">Match Library</Link>
        </div>
        <section className="bg-[#121620] border border-zinc-800 rounded-xl p-5">
          <p className="text-[10px] uppercase tracking-widest text-[#ff80ab] font-black mb-3">Teams</p>
          <div className="flex flex-wrap gap-2">{teams.map(team => <button key={team} onClick={() => setSelectedTeam(team)} className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${selectedTeam === team ? 'bg-[#ff80ab] text-black border-[#ff80ab]' : 'bg-[#0b0e14] text-zinc-300 border-zinc-700 hover:border-[#ff80ab]'}`}>{team}</button>)}</div>
        </section>
        {!selectedTeam ? <div className="bg-[#121620] border border-zinc-800 rounded-xl p-10 text-center text-zinc-500">Upload a match to choose a team.</div> : <>
          <section className="bg-[#121620] border border-zinc-800 rounded-xl p-5">
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-center gap-4">
                {profile.logo ? <img src={profile.logo} alt={`${selectedTeam} logo`} className="w-16 h-16 object-contain rounded-lg bg-white" /> : <div className="w-16 h-16 rounded-lg bg-[#ff80ab]/15 border border-[#ff80ab]/40 flex items-center justify-center text-2xl font-black text-[#ff80ab]">{selectedTeam.slice(0, 1)}</div>}
                <div><p className="text-[10px] uppercase tracking-widest text-zinc-500 font-black">Team Profile</p><h2 className="text-2xl font-black" style={{ color: profile.color }}>{selectedTeam}</h2></div>
              </div>
              <div className="flex gap-2"><button onClick={() => setEditingProfile(!editingProfile)} className="px-3 py-2 bg-zinc-800 text-xs font-bold text-white rounded">{editingProfile ? 'Close Edit' : 'Edit Team'}</button><button onClick={deleteTeamProfile} className="px-3 py-2 bg-red-950 text-red-300 text-xs font-bold rounded">Delete Team</button></div>
            </div>
            {editingProfile && <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5 pt-5 border-t border-zinc-800">
              <label className="text-xs text-zinc-400">Team Color<input type="color" value={profile.color} onChange={event => setProfile({ ...profile, color: event.target.value })} className="block mt-1 w-12 h-8 bg-transparent" /></label>
              <label className="text-xs text-zinc-400">Logo<input type="file" accept="image/*" onChange={event => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setProfile(current => ({ ...current, logo: String(reader.result) })); reader.readAsDataURL(file); }} className="block mt-1 text-xs" /></label>
              <div className="md:col-span-2"><p className="text-xs text-zinc-400 mb-1">Players (5)</p><div className="space-y-2">{profile.players.map((player, index) => <div key={`player-${index}`} className="grid grid-cols-[1fr_160px] gap-2"><input value={player.name} onChange={event => setProfile({ ...profile, players: profile.players.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item) })} placeholder={`Player ${index + 1} name`} className="bg-[#0b0e14] border border-zinc-700 rounded p-2 text-white" /><select value={player.role} onChange={event => setProfile({ ...profile, players: profile.players.map((item, itemIndex) => itemIndex === index ? { ...item, role: event.target.value } : item) })} className="bg-[#0b0e14] border border-zinc-700 rounded p-2 text-white"><option value="">Choose role</option>{PLAYER_ROLES.map(role => <option key={role} value={role}>{role}</option>)}</select></div>)}</div></div>
              <div className="md:col-span-2"><p className="text-xs text-zinc-400 mb-1">Staff (3)</p><div className="space-y-2">{profile.staff.map((member, index) => <div key={`staff-${index}`} className="grid grid-cols-[1fr_160px] gap-2"><input value={member.name} onChange={event => setProfile({ ...profile, staff: profile.staff.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item) })} placeholder={`Staff ${index + 1} name`} className="bg-[#0b0e14] border border-zinc-700 rounded p-2 text-white" /><select value={member.role} onChange={event => setProfile({ ...profile, staff: profile.staff.map((item, itemIndex) => itemIndex === index ? { ...item, role: event.target.value } : item) })} className="bg-[#0b0e14] border border-zinc-700 rounded p-2 text-white"><option value="">Choose role</option>{STAFF_ROLES.map(role => <option key={role} value={role}>{role}</option>)}</select></div>)}</div></div>
              <label className="text-xs text-zinc-400">Notes<textarea value={profile.notes} onChange={event => setProfile({ ...profile, notes: event.target.value })} className="block w-full mt-1 bg-[#0b0e14] border border-zinc-700 rounded p-2 text-white" rows={3} /></label>
              <button onClick={saveProfile} className="md:col-span-2 px-4 py-2 bg-[#ff80ab] text-black font-bold rounded text-sm">Save Team Profile</button>
            </div>}
            {!editingProfile && <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5 pt-5 border-t border-zinc-800 text-sm"><div><p className="text-[10px] uppercase text-zinc-500 font-black">Players</p><div className="text-zinc-300 mt-1">{profile.players.filter(player => player.name).map(player => <p key={player.name}>{player.name}{player.role ? ` - ${player.role}` : ''}</p>)}</div></div><div><p className="text-[10px] uppercase text-zinc-500 font-black">Staff</p><div className="text-zinc-300 mt-1">{profile.staff.filter(member => member.name).map(member => <p key={member.name}>{member.name}{member.role ? ` - ${member.role}` : ''}</p>)}</div></div><div><p className="text-[10px] uppercase text-zinc-500 font-black">Notes</p><p className="whitespace-pre-line text-zinc-300 mt-1">{profile.notes || 'No notes added.'}</p></div></div>}
          </section>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[['Win Rate', percentage(stats.wins, stats.selectedMatches.length)], ['Matches', stats.selectedMatches.length], ['Rounds Played', stats.rounds], ['Roster Size', profile.players.filter(player => player.name).length]].map(([label, value]) => <div key={String(label)} className="bg-[#121620] border border-zinc-800 rounded-xl p-4"><p className="text-[10px] uppercase text-zinc-500 font-black">{label}</p><p className="text-2xl font-black text-white mt-1">{value}</p></div>)}</div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <section className="bg-[#121620] border border-zinc-800 rounded-xl overflow-hidden"><div className="bg-zinc-800 px-3 py-1.5"><h2 className="text-xs font-black uppercase text-white">Recent Matches</h2></div><div className="divide-y divide-zinc-800">{stats.selectedMatches.slice(0, 5).map(match => { const names = teamNames(match); const opponent = names.team1 === selectedTeam ? names.team2 : names.team1; const won = String(match.win_loss || '').toLowerCase() === 'win'; return <div key={match.id} className="flex items-center justify-between gap-3 px-3 py-2 text-xs"><span className="text-emerald-400 font-bold">{won ? 'W' : 'L'}</span><span className="font-bold text-white truncate">{opponent}</span><span className="text-zinc-500">{normalizeMap(match.map || match.map_name)}</span><span className="text-zinc-500">{match.match_type || 'Scrim'}</span></div>; })}</div></section>
            <section className="bg-[#121620] border border-zinc-800 rounded-xl overflow-hidden"><div className="bg-zinc-800 px-3 py-1.5"><h2 className="text-xs font-black uppercase text-white">Most Banned Operators</h2></div><div className="divide-y divide-zinc-800">{topCounts(new Map([...Array.from(stats.banned.get('atk') || new Map()), ...Array.from(stats.banned.get('def') || new Map())].map(([name, count]) => [name, (stats.banned.get('atk')?.get(name) || 0) + (stats.banned.get('def')?.get(name) || 0)]))).slice(0, 6).map(item => <div key={item.name} className="flex items-center justify-between px-3 py-2 text-xs"><span className="font-bold text-white">{item.name}</span><span className="text-zinc-400">{item.count} bans</span><span className="w-24 h-1 bg-zinc-700"><span className="block h-1 bg-cyan-400" style={{ width: `${Math.min(item.count * 12, 100)}%` }} /></span></div>)}</div></section>
          </div>
          <StatTable title="Overall Map Results" columns={['Map', 'Games', 'Wins', 'Losses', 'Win %']} rows={stats.mapStats.map(([map, stat]) => [map, String(stat.games), String(stat.wins), String(stat.losses), percentage(stat.wins, stat.games)])} />
          <StatTable title="Map Ban And Pick Stats" columns={['Map', 'Banned', 'First 2', 'First 2 %', 'Against', 'Picked', 'Pick %', 'Enemy Picked']} rows={stats.mapBanStats.map(([map, stat]) => [map, String(stat.banned), String(stat.firstTwo), percentage(stat.firstTwo, stat.banned), String(stat.against), String(stat.picked), percentage(stat.picked, stats.mapRows.get(map)?.games || 0), String(stat.enemyPicked)])} />
          <section className="space-y-2"><div className="flex items-center justify-between gap-3"><h2 className="text-xs font-black uppercase text-white">Side Performance - Overall And By Map</h2><select value={selectedSideMap} onChange={event => setSelectedSideMap(event.target.value)} className="bg-[#121620] border border-zinc-700 rounded px-2 py-1 text-xs text-white"><option value="ALL">All maps</option>{ANALYTICS_MAPS.map(map => <option key={map} value={map}>{map}</option>)}</select></div><StatTable title="Side Performance" columns={['Map', 'Side', 'Rounds Played', 'Wins', 'Win %']} rows={[...Array.from(stats.sideRows, ([side, stat]) => ['Overall', side, String(stat.rounds), String(stat.wins), percentage(stat.wins, stat.rounds)]), ...Array.from(stats.sideMapRows, ([key, stat]) => { const [map, side] = key.split('|'); return [map, side, String(stat.rounds), String(stat.wins), percentage(stat.wins, stat.rounds)]; }).filter(row => selectedSideMap === 'ALL' || row[0] === selectedSideMap)]} /></section>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{['Attack', 'Defense'].map(side => <StatTable key={side} title={`Top 10 Operators Played Overall - ${side}`} columns={['Operator', 'Rounds']} rows={stats.topPlayed(side).map(item => [item.name, String(item.count)])} />)}</div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{['atk', 'def'].map(side => <StatTable key={side} title={`Top 10 Operators Banned Overall - ${side === 'atk' ? 'Attack' : 'Defense'}`} columns={['Operator', 'Bans']} rows={topCounts(stats.banned.get(side) || new Map()).map(item => [item.name, String(item.count)])} />)}</div>
          {['Attack', 'Defense'].map(side => { const matrix = stats.matrixFor(stats.played, side); return <MatrixTable key={side} title={`Top 10 Operators Played - ${side} By Map`} columns={matrix.names} rows={matrix.rows} />; })}
          {['Attack', 'Defense'].map(side => { const matrix = stats.bannedMatrixFor(side); return <MatrixTable key={side} title={`Top 10 Operators Banned - ${side} By Map`} columns={matrix.names} rows={matrix.rows} />; })}
          <section className="space-y-2"><div className="flex items-center justify-between gap-3"><h2 className="text-xs font-black uppercase text-white">Top Operators By Site, Map, And Side</h2><select value={selectedSiteMap} onChange={event => setSelectedSiteMap(event.target.value)} className="bg-[#121620] border border-zinc-700 rounded px-2 py-1 text-xs text-white"><option value="ALL">All maps</option>{ANALYTICS_MAPS.map(map => <option key={map} value={map}>{map}</option>)}</select></div><MatrixTable title="Site Operator Breakdown" columns={['Site / Side', ...stats.siteMaps]} rows={stats.siteMatrixRows} /></section>
        </>}
      </div>
    </main>
  );
}
