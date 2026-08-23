'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '../../src/lib/supabase';
import Navbar from '@/app/components/Navbar';
import { useRouter } from 'next/navigation';

const ATTACKERS = [
  'Ace', 'Amaru', 'Ash', 'Blackbeard', 'Blitz', 'Brava', 'Buck', 'Capitão', 
  'Deimos', 'Dokkaebi', 'Finka', 'Flores', 'Fuze', 'Glaz', 'Grim', 'Hibana', 
  'Iana', 'IQ', 'Jackal', 'Kali', 'Lion', 'Maverick', 'Montagne', 'Nomad', 
  'Gridlock', 'Nokk', 'Osa', 'Rauora', 'Ram', 'Sens', 'Sledge', 'Solid Snake', 'Striker', 'Thatcher', 'Thermite', 'Twitch', 'Ying', 'Zero', 'Zofia'
];

const DEFENDERS = [
  'Alibi', 'Aruni', 'Azami', 'Bandit', 'Castle', 'Caveira', 
  'Clash', 'Doc', 'Echo', 'Ela', 'Fenrir', 'Frost', 'Goyo', 'Jäger', 
  'Denari', 'Kaid', 'Kaïd', 'Kapkan', 'Lesion', 'Maestro', 'Melusi', 'Mira', 'Mozzie', 
  'Mute', 'Oryx', 'Pulse', 'Rook', 'Sentry', 'Skopos', 'Solis', 'Smoke', 'Tachanka', 
  'Thorn', 'Thunderbird', 'Valkyrie', 'Vigil', 'Wamai', 'Warden'
];

const MAP_POOL = [
  'Bank', 'Border', 'Chalet', 'Clubhouse', 'Consulate', 
  'Kafe Dostoyevsky', 'Lab', 'Nighthaven Labs', 'Oregon', 
  'Skyscraper', 'Theme Park', 'Villa'
];

const MAP_ID_TO_NAME: Record<number, string> = {
  837214085: 'Clubhouse',
  1378191338: 'Kafe Dostoyevsky',
  1460220617: 'Kanal',
  1767965020: 'Yacht',
  2609218856: 'Presidential Plane',
  2609221242: 'Consulate',
  2697268122: 'Bartlett University',
  42090092951: 'Coastline',
  53627213396: 'Tower',
  88107330328: 'Villa',
  126196841359: 'Fortress',
  127951053400: 'Hereford Base',
  199824623654: 'Theme Park',
  231702797556: 'Oregon',
  237873412352: 'House',
  259816839773: 'Chalet',
  276279025182: 'Skyscraper',
  305979357167: 'Border',
  329867321446: 'Favela',
  355496559878: 'Bank',
  362605108559: 'Outback',
  365284490964: 'Emerald Plains',
  270063334510: 'Stadium Bravo',
  378595635123: 'Nighthaven Labs',
  379218689149: 'Consulate',
  388073319671: 'Lair',
  405306299908: 'Stadium 2020',
  413779563590: 'Bank',
  407987100456: 'Border',
  407558616688: 'Chalet',
  407193663917: 'Clubhouse',
  413845419788: 'Kafe Dostoyevsky',
  417890697769: 'Lair',
  418119057546: 'Nighthaven Labs',
  418126004176: 'Consulate',
};

const MAP_SITES: Record<string, string[]> = {
  Bank: ['Archives / Tellers', 'CCTV / Server', 'Open Area / Staff Room', 'Executive Lounge / CEO Office'],
  Border: ['Archives / Offices', 'CCTV / Server', 'Bathroom / Tellers', 'Workshop / Ventilation'],
  Chalet: ['Kitchen / Trophy', 'Bar / Gaming', 'Master Bedroom / Office', 'Snowmobile Garage / Wine Cellar'],
  Clubhouse: ['CCTV / Cash Room', 'Gym / Bedroom', 'Church / Arsenal', 'Bar / Stock Room'],
  Consulate: ['Consul Office / Meeting Room', 'Archives / Tellers', 'Cafeteria / Garage', 'Boss Room / Piano Room'],
  'Kafe Dostoyevsky': ['Reading Room / Fireplace', 'Kitchen / Bakery', 'Mining Room / Fireplace', 'Cocktail Lounge / Bar'],
  Lab: ['R&D / Assembly', 'Primary / Secondary Labs', 'Cafeteria / Biohazard'],
  'Nighthaven Labs': ['Command / Control', 'Server / Cafeteria', 'Tanks / Geothermal'],
  Oregon: ['Master Bedroom / Kids Dorm', 'Kitchen / Dining Hall', 'Laundry Room / Supplies', 'Basement / Boiler'],
  Skyscraper: ['Bunk / Exhibition', 'BBQ / Kitchen', 'Karaoke / Tea Room', 'Executive / Office'],
  'Theme Park': ['Bunk / Day Care', 'Armory / Throne Room', 'Initiation / Lab', 'Haunted Dining / Crypt'],
  Villa: ['Aviary / Study', 'Living Room / Library', 'Kitchen / Dining', 'Arsenal Room / Aviation']
};

type ParsedTeam = { won?: boolean; role?: 'Attack' | 'Defense' };
type ParsedPlayer = { teamIndex?: number; operator?: { name?: string } };
type ParsedMatch = {
  map?: { name?: string; id?: number };
  site?: string;
  teams?: ParsedTeam[];
  players?: ParsedPlayer[];
};

export default function AddMatchPage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [existingTeams, setExistingTeams] = useState<string[]>([]);
  const [team1Selection, setTeam1Selection] = useState('');
  const [customTeam1, setCustomTeam1] = useState('');
  const team1 = team1Selection === 'CUSTOM' ? customTeam1 : team1Selection;

  const [team2Selection, setTeam2Selection] = useState('');
  const [customTeam2, setCustomTeam2] = useState('');
  const team2 = team2Selection === 'CUSTOM' ? customTeam2 : team2Selection;

  const [league, setLeague] = useState('NACL');
  const [phase, setPhase] = useState('Group Stage');
  const [matchTag, setMatchTag] = useState<'Scrim' | 'Gameday'>('Scrim');
  const [winLoss, setWinLoss] = useState('');
  const [vodLink, setVodLink] = useState('');
  const [datePlayed, setDatePlayed] = useState(new Date().toISOString().split('T')[0]);
  const [startingSide, setStartingSide] = useState('Attack');
  const [mapPickedBy, setMapPickedBy] = useState('');
  const [split1, setSplit1] = useState('');
  const [otStartingSide, setOtStartingSide] = useState('N/A');

  const [matchFormat, setMatchFormat] = useState<'BO1' | 'BO3'>('BO1');
  const [team1MapPick, setTeam1MapPick] = useState('');
  const [team2MapPick, setTeam2MapPick] = useState('');
  const [deciderMap, setDeciderMap] = useState('');

  const maxMapBans = matchFormat === 'BO1' ? 4 : 3;
  const [team1MapBans, setTeam1MapBans] = useState<string[]>(['', '', '', '']);
  const [team2MapBans, setTeam2MapBans] = useState<string[]>(['', '', '', '']);

  const handleMapBanChange = (team: 1 | 2, index: number, value: string) => {
    if (team === 1) {
      const updated = [...team1MapBans];
      updated[index] = value;
      setTeam1MapBans(updated);
    } else {
      const updated = [...team2MapBans];
      updated[index] = value;
      setTeam2MapBans(updated);
    }
  };

  const [team1DefBans, setTeam1DefBans] = useState<string[]>(['', '', '']);
  const [team1AtkBans, setTeam1AtkBans] = useState<string[]>(['', '', '']);
  const [team2DefBans, setTeam2DefBans] = useState<string[]>(['', '', '']);
  const [team2AtkBans, setTeam2AtkBans] = useState<string[]>(['', '', '']);

  const handleOpBanChange = (team: 1 | 2, side: 'def' | 'atk', index: number, value: string) => {
    if (team === 1) {
      if (side === 'def') {
        const updated = [...team1DefBans];
        updated[index] = value;
        setTeam1DefBans(updated);
      } else {
        const updated = [...team1AtkBans];
        updated[index] = value;
        setTeam1AtkBans(updated);
      }
    } else {
      if (side === 'def') {
        const updated = [...team2DefBans];
        updated[index] = value;
        setTeam2DefBans(updated);
      } else {
        const updated = [...team2AtkBans];
        updated[index] = value;
        setTeam2AtkBans(updated);
      }
    }
  };

  useEffect(() => {
    async function fetchTeams() {
      const { data, error } = await supabase.from('matches').select('team_1, team_2');
      if (!error && data) {
        const teamsSet = new Set<string>();
        data.forEach((m: any) => {
          if (m.team_1) teamsSet.add(m.team_1);
          if (m.team_2) teamsSet.add(m.team_2);
        });
        setExistingTeams(Array.from(teamsSet).sort());
      }
    }
    fetchTeams();
  }, [supabase]);

  const handleFormatChange = (format: 'BO1' | 'BO3') => {
    setMatchFormat(format);
    if (format === 'BO3') {
      setTeam1MapBans(['', '', '']);
      setTeam2MapBans(['', '', '']);
    } else {
      setTeam1MapBans(['', '', '', '']);
      setTeam2MapBans(['', '', '', '']);
    }
  };

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = e.target.files;
    if (!rawFiles || rawFiles.length === 0) return;

    const fileList = Array.from(rawFiles);
    const extractedRounds: any[] = [];
    const currentMap = deciderMap || team1MapPick || 'Clubhouse';

    for (const file of fileList) {
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith('.rec')) {
        const matchRoundNum = fileName.match(/(?:^|[-_])(?:round[-_ ]?)?r[-_ ]?(\d+)\.rec$/)
          || fileName.match(/(?:^|[-_])round[-_ ]?(\d+)\.rec$/);
        
        if (matchRoundNum) {
          const roundNum = parseInt(matchRoundNum[1], 10);
          
          if (roundNum > 0 && roundNum <= 30) {
            const formData = new FormData();
            formData.append('file', file);

            try {
              const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
              });

              const result = await response.json();
              if (result.success && result.output) {
                const matchData = result.output as ParsedMatch;
                const teams = Array.isArray(matchData.teams) ? matchData.teams : [];
                const players = Array.isArray(matchData.players) ? matchData.players : [];
                const team1Obj = teams[0];
                const team2Obj = teams[1];
                const team1Operators = players
                  .filter(player => player.teamIndex === 0)
                  .map(player => player.operator?.name)
                  .filter(Boolean);
                const team2Operators = players
                  .filter(player => player.teamIndex === 1)
                  .map(player => player.operator?.name)
                  .filter(Boolean);
                const parsedMapName = MAP_ID_TO_NAME[matchData.map?.id || 0]
                  || matchData.map?.name?.replace(/Y\d+$/, '');

                extractedRounds.push({
                  round_number: roundNum,
                  map_name: parsedMapName || currentMap,
                  site: matchData.site || '',
                  team_1_side: team1Obj?.role || (roundNum % 2 !== 0 ? 'Attack' : 'Defense'),
                  team_1_operators: team1Operators,
                  team_2_side: team2Obj?.role || (roundNum % 2 !== 0 ? 'Defense' : 'Attack'),
                  team_2_operators: team2Operators,
                  winner: team1Obj?.won ? 'Team 1' : team2Obj?.won ? 'Team 2' : 'Team 1',
                });
                continue;
              }
            } catch (err) {
              console.error(`Failed to parse round ${roundNum} via backend:`, err);
            }

            const team1Side = roundNum % 2 !== 0 ? 'Attack' : 'Defense';
            const team2Side = roundNum % 2 !== 0 ? 'Defense' : 'Attack';

            extractedRounds.push({
              round_number: roundNum,
              map_name: currentMap,
              site: '',
              team_1_side: team1Side,
              team_1_operators: [],
              team_2_side: team2Side,
              team_2_operators: [],
              winner: 'Team 1',
            });
          }
        }
      }
    }

    const uniqueRounds = Array.from(
      new Map(extractedRounds.map(r => [r.round_number, r])).values()
    );

    uniqueRounds.sort((a, b) => a.round_number - b.round_number);

    if (uniqueRounds.length > 0) {
      setRounds(uniqueRounds);
      alert(`Successfully auto-populated ${uniqueRounds.length} rounds from your recordings!`);
    } else {
      alert(`Scanned ${fileList.length} files, but none matched valid .rec patterns.`);
    }
  };

  const [rounds, setRounds] = useState([
    {
      round_number: 1,
      map_name: 'Clubhouse',
      site: '',
      team_1_side: 'Attack',
      team_1_operators: [] as string[],
      team_2_side: 'Defense',
      team_2_operators: [] as string[],
      winner: 'Team 1',
    }
  ]);

  const addRoundRow = () => {
    setRounds([
      ...rounds,
      {
        round_number: rounds.length + 1,
        map_name: matchFormat === 'BO1' ? deciderMap : (team1MapPick || 'Clubhouse'),
        site: '',
        team_1_side: rounds.length % 2 === 0 ? 'Attack' : 'Defense',
        team_1_operators: [],
        team_2_side: rounds.length % 2 === 0 ? 'Defense' : 'Attack',
        team_2_operators: [],
        winner: 'Team 1',
      }
    ]);
  };

  const removeRoundRow = (index: number) => {
    const updated = rounds.filter((_, i) => i !== index);
    const reindexed = updated.map((r, i) => ({ ...r, round_number: i + 1 }));
    setRounds(reindexed);
  };

  const handleRoundChange = (index: number, field: string, value: any) => {
    const updated = [...rounds];
    updated[index] = { ...updated[index], [field]: value };
    setRounds(updated);
  };

  const handleOperatorToggle = (roundIndex: number, team: 'team_1' | 'team_2', op: string) => {
    const updated = [...rounds];
    const currentOps = updated[roundIndex][`${team}_operators` as 'team_1_operators' | 'team_2_operators'];
    
    if (currentOps.includes(op)) {
      updated[roundIndex][`${team}_operators` as 'team_1_operators' | 'team_2_operators'] = currentOps.filter(o => o !== op);
    } else {
      if (currentOps.length < 5) {
        updated[roundIndex][`${team}_operators` as 'team_1_operators' | 'team_2_operators'] = [...currentOps, op];
      }
    }
    setRounds(updated);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!team1 || !team2) {
      alert('Please specify both Team 1 and Team 2 names.');
      return;
    }

    try {
      const team1Score = rounds.filter(round => round.winner === 'Team 1').length;
      const team2Score = rounds.filter(round => round.winner === 'Team 2').length;
      const payload: Record<string, unknown> = {
        team_1: team1,
        team_2: team2,
        team_a: team1,
        team_b: team2,
        league,
        phase,
        match_type: matchTag,
        win_loss: winLoss.startsWith('Win') ? 'Win' : 'Loss',
        vod_link: vodLink,
        date_played: datePlayed,
        map: rounds[0]?.map_name || deciderMap || team1MapPick || '',
        map_name: rounds[0]?.map_name || deciderMap || team1MapPick || '',
        total_rounds: rounds.length,
        score_team_a: team1Score,
        score_team_b: team2Score,
        split_1: split1,
        ot_starting_side: otStartingSide,
        match_format: matchFormat,
        map_picked_by: mapPickedBy,
        map_picks: matchFormat === 'BO3' ? { team1MapPick, team2MapPick, deciderMap } : { deciderMap },
        map_bans: { team1MapBans, team2MapBans },
        operator_bans: { team1DefBans, team1AtkBans, team2DefBans, team2AtkBans },
        rounds_data: rounds,
        raw_data: {
          starting_side: startingSide,
          map_picked_by: mapPickedBy,
          split_1: split1,
          ot_starting_side: otStartingSide,
          match_type: matchTag,
          map_picks: matchFormat === 'BO3' ? { team1MapPick, team2MapPick, deciderMap } : { deciderMap },
          map_bans: { team1MapBans, team2MapBans },
          operator_bans: { team1DefBans, team1AtkBans, team2DefBans, team2AtkBans },
          rounds_data: rounds,
        },
      };

      for (let attempt = 0; attempt < 20; attempt += 1) {
        const { error } = await supabase.from('matches').insert([payload]);
        if (!error) break;

        const missingColumn = error.message.match(/Could not find the '([^']+)' column/);
        if (!missingColumn || !(missingColumn[1] in payload)) throw error;
        delete payload[missingColumn[1]];

        if (attempt === 19) throw error;
      }

      router.push('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : JSON.stringify(err);
      console.error('Error saving match:', message);
      alert(`Error saving match to database: ${message}`);
    }
  }

  return (
    <main className="min-h-screen bg-[#0b0e14] text-zinc-200 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Navbar />

        <div className="bg-[#121620] border border-zinc-800 rounded-2xl p-8 shadow-xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-zinc-800">
            <div>
              <h1 className="text-2xl font-black text-white">Add Match & Round Breakdowns</h1>
              <p className="text-xs text-zinc-400 mt-1">Upload an entire folder containing your .rec files to process them via backend parsing.</p>
            </div>
            
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 flex items-center gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-[#ff79c6] mb-0.5">Upload Recording Folder</label>
                <input 
                  type="file" 
                  // @ts-ignore
                  webkitdirectory="" 
                  directory="" 
                  multiple 
                  onChange={handleFolderUpload} 
                  className="text-xs text-zinc-400 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#ff79c6] file:text-black hover:file:opacity-90 cursor-pointer" 
                />
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase text-zinc-400">Team 1 Name</label>
                <select 
                  value={team1Selection} 
                  onChange={(e) => setTeam1Selection(e.target.value)} 
                  required 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-sm text-white"
                >
                  <option value="">Select Team 1...</option>
                  <option value="CUSTOM">＋ Add New Team Name...</option>
                  {existingTeams.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {team1Selection === 'CUSTOM' && (
                  <input 
                    type="text" 
                    value={customTeam1} 
                    onChange={(e) => setCustomTeam1(e.target.value)} 
                    placeholder="Enter new team name..." 
                    required 
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-sm text-white mt-2" 
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase text-zinc-400">Team 2 Name</label>
                <select 
                  value={team2Selection} 
                  onChange={(e) => setTeam2Selection(e.target.value)} 
                  required 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-sm text-white"
                >
                  <option value="">Select Team 2...</option>
                  <option value="CUSTOM">＋ Add New Team Name...</option>
                  {existingTeams.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {team2Selection === 'CUSTOM' && (
                  <input 
                    type="text" 
                    value={customTeam2} 
                    onChange={(e) => setCustomTeam2(e.target.value)} 
                    placeholder="Enter new team name..." 
                    required 
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-sm text-white mt-2" 
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">League</label>
                <input type="text" value={league} onChange={(e) => setLeague(e.target.value)} placeholder="e.g. NACL / Scrim" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Phase</label>
                <input type="text" value={phase} onChange={(e) => setPhase(e.target.value)} placeholder="e.g. Playoffs" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Match Tag</label>
                <select value={matchTag} onChange={(e) => setMatchTag(e.target.value as 'Scrim' | 'Gameday')} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white">
                  <option value="Scrim">Scrim</option>
                  <option value="Gameday">Gameday</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Match Result</label>
                <select value={winLoss} onChange={(e) => setWinLoss(e.target.value)} required className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white">
                  <option value="">Select Winner...</option>
                  <option value={`Win (${team1 || 'Team 1'})`}>Win ({team1 || 'Team 1'})</option>
                  <option value={`Win (${team2 || 'Team 2'})`}>Win ({team2 || 'Team 2'})</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Date Played</label>
                <input type="date" value={datePlayed} onChange={(e) => setDatePlayed(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Starting Side</label>
                <select value={startingSide} onChange={(e) => setStartingSide(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white">
                  <option value="Attack">Attack</option>
                  <option value="Defense">Defense</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Map Picked By</label>
                <input type="text" value={mapPickedBy} onChange={(e) => setMapPickedBy(e.target.value)} placeholder="Team 1 / Team 2" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">OT Starting Side</label>
                <select value={otStartingSide} onChange={(e) => setOtStartingSide(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white">
                  <option value="N/A">N/A</option>
                  <option value="Attack">Attack</option>
                  <option value="Defense">Defense</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Split 1</label>
                <input type="text" value={split1} onChange={(e) => setSplit1(e.target.value)} placeholder="e.g. 1-5" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">VOD Link</label>
              <input type="url" value={vodLink} onChange={(e) => setVodLink(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-sm text-white" />
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#ff79c6]">Match Format & Maps</h3>
                <div className="flex gap-2">
                  <button type="button" onClick={() => handleFormatChange('BO1')} className={`px-3 py-1 rounded text-xs font-bold ${matchFormat === 'BO1' ? 'bg-[#ff79c6] text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}`}>BO1</button>
                  <button type="button" onClick={() => handleFormatChange('BO3')} className={`px-3 py-1 rounded text-xs font-bold ${matchFormat === 'BO3' ? 'bg-[#ff79c6] text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}`}>BO3</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {matchFormat === 'BO3' ? (
                  <>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Team 1 Map Pick</label>
                      <select value={team1MapPick} onChange={(e) => setTeam1MapPick(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white">
                        <option value="">Select Map...</option>
                        {MAP_POOL.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Team 2 Map Pick</label>
                      <select value={team2MapPick} onChange={(e) => setTeam2MapPick(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white">
                        <option value="">Select Map...</option>
                        {MAP_POOL.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </>
                ) : null}
                <div className={matchFormat === 'BO1' ? 'md:col-span-3' : ''}>
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Decider Map</label>
                  <select value={deciderMap} onChange={(e) => setDeciderMap(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white">
                    <option value="">Select Map...</option>
                    {MAP_POOL.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#ff79c6]">Map Bans ({matchFormat} - {maxMapBans} per team)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
                  <p className="text-xs font-bold text-white">{team1 || 'Team 1'} Map Bans</p>
                  <div className="grid grid-cols-2 gap-2">
                    {team1MapBans.map((ban, i) => (
                      <select key={i} value={ban} onChange={(e) => handleMapBanChange(1, i, e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded p-1.5 text-xs text-white">
                        <option value="">Ban #{i+1}...</option>
                        {MAP_POOL.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
                  <p className="text-xs font-bold text-white">{team2 || 'Team 2'} Map Bans</p>
                  <div className="grid grid-cols-2 gap-2">
                    {team2MapBans.map((ban, i) => (
                      <select key={i} value={ban} onChange={(e) => handleMapBanChange(2, i, e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded p-1.5 text-xs text-white">
                        <option value="">Ban #{i+1}...</option>
                        {MAP_POOL.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#ff79c6]">Operator Bans (3 Defenders & 3 Attackers per team)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
                  <p className="text-xs font-bold text-white">{team1 || 'Team 1'} Operator Bans</p>
                  <div>
                    <span className="text-[10px] font-bold text-cyan-400 uppercase">Defenders</span>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      {team1DefBans.map((ban, i) => (
                        <select key={`t1-def-${i}`} value={ban} onChange={(e) => handleOpBanChange(1, 'def', i, e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded p-1 text-xs text-white">
                          <option value="">Def Ban #{i+1}</option>
                          {DEFENDERS.sort().map(op => <option key={op} value={op}>{op}</option>)}
                        </select>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase">Attackers</span>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      {team1AtkBans.map((ban, i) => (
                        <select key={`t1-atk-${i}`} value={ban} onChange={(e) => handleOpBanChange(1, 'atk', i, e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded p-1 text-xs text-white">
                          <option value="">Atk Ban #{i+1}</option>
                          {ATTACKERS.sort().map(op => <option key={op} value={op}>{op}</option>)}
                        </select>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
                  <p className="text-xs font-bold text-white">{team2 || 'Team 2'} Operator Bans</p>
                  <div>
                    <span className="text-[10px] font-bold text-cyan-400 uppercase">Defenders</span>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      {team2DefBans.map((ban, i) => (
                        <select key={`t2-def-${i}`} value={ban} onChange={(e) => handleOpBanChange(2, 'def', i, e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded p-1 text-xs text-white">
                          <option value="">Def Ban #{i+1}</option>
                          {DEFENDERS.sort().map(op => <option key={op} value={op}>{op}</option>)}
                        </select>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase">Attackers</span>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      {team2AtkBans.map((ban, i) => (
                        <select key={`t2-atk-${i}`} value={ban} onChange={(e) => handleOpBanChange(2, 'atk', i, e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded p-1 text-xs text-white">
                          <option value="">Atk Ban #{i+1}</option>
                          {ATTACKERS.sort().map(op => <option key={op} value={op}>{op}</option>)}
                        </select>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#ff79c6]">Round Breakdowns ({rounds.length} Rounds)</h3>
                <button type="button" onClick={addRoundRow} className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-xs font-bold">
                  ＋ Add Round
                </button>
              </div>

              <div className="space-y-3">
                {rounds.map((round, rIndex) => (
                  <div key={rIndex} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white">Round {round.round_number}</span>
                      {rounds.length > 1 && (
                        <button type="button" onClick={() => removeRoundRow(rIndex)} className="text-red-400 hover:text-red-300 text-xs font-bold">
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Map Name</label>
                        <select value={round.map_name} onChange={(e) => handleRoundChange(rIndex, 'map_name', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-xs text-white">
                          {MAP_POOL.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Site</label>
                        <select value={round.site} onChange={(e) => handleRoundChange(rIndex, 'site', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-xs text-white">
                          <option value="">Select Site...</option>
                          {(MAP_SITES[round.map_name] || []).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">{team1 || 'Team 1'} Side</label>
                        <select value={round.team_1_side} onChange={(e) => handleRoundChange(rIndex, 'team_1_side', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-xs text-white">
                          <option value="Attack">Attack</option>
                          <option value="Defense">Defense</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Round Winner</label>
                        <select value={round.winner} onChange={(e) => handleRoundChange(rIndex, 'winner', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-xs text-white">
                          <option value="Team 1">{team1 || 'Team 1'}</option>
                          <option value="Team 2">{team2 || 'Team 2'}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className="w-full py-3 bg-[#ff79c6] text-black font-bold rounded-lg text-sm hover:opacity-90 transition-opacity">
              Save Match to Database
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}