import React, { useEffect, useState } from 'react';
import { Player } from '../types';
import { fetchAllUsers, fetchGameweekLeaderboard } from '../firebase';
import { Trophy, Medal, User as UserIcon, Calendar, Hash, CheckCircle, AlertCircle } from 'lucide-react';

interface LeaderboardProps {
    players: Player[];
    currentUserUid?: string;
    currentGameweek?: number;
}

type LeaderboardType = 'weekly' | 'alltime';

interface LeaderboardEntry {
    uid: string;
    username: string;
    teamName: string;
    avatar: string;
    gwPoints: number;
    totalPoints: number;
    isSubmitted: boolean;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ players, currentUserUid, currentGameweek = 2 }) => {
    const [view, setView] = useState<LeaderboardType>('weekly');
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadLeaderboard = async () => {
            setLoading(true);

            // 1. Fetch Explicitly Submitted Teams for this GW
            // This reads from 'rwafantasy/leaderboards/gw{currentGameweek}'
            // This contains the snapshot of the team at the moment of submission/update
            const submittedData = await fetchGameweekLeaderboard(currentGameweek);

            // 2. Fetch All Users (Best Effort)
            // If permission denied, this returns [], but we shouldn't block the weekly view
            const allUsers = await fetchAllUsers();

            // Map for quick lookup of full user details (history, etc)
            const userMap = new Map();
            allUsers.forEach(u => userMap.set(u.uid, u));

            const results: LeaderboardEntry[] = [];
            const processedUids = new Set<string>();

            // Process Submitted Teams First
            submittedData.forEach((entry: any) => {
                processedUids.add(entry.uid);

                // Try to get live user data, otherwise fall back to snapshot data
                const liveUser = userMap.get(entry.uid);

                results.push({
                    uid: entry.uid,
                    username: entry.username || liveUser?.settings?.username || 'Unknown',
                    teamName: entry.teamName || liveUser?.teamName || 'Unnamed Team',
                    avatar: entry.avatar || liveUser?.logoUrl || 'https://i.imgur.com/AZYKczg.png',
                    gwPoints: entry.points || 0,
                    // If we can't read all users, we might not know total history points, default to GW points
                    totalPoints: (liveUser?.settings?.totalHistoryPoints || 0) + (entry.points || 0),
                    isSubmitted: true
                });
            });

            // Process Remaining Users (for All Time view)
            // Only possible if fetchAllUsers succeeded
            allUsers.forEach(user => {
                if (!processedUids.has(user.uid || '')) {
                    results.push({
                        uid: user.uid || '',
                        username: user.settings?.username || 'Unknown',
                        teamName: user.teamName || 'Unnamed Team',
                        avatar: user.logoUrl || 'https://i.imgur.com/AZYKczg.png',
                        gwPoints: 0,
                        totalPoints: user.settings?.totalHistoryPoints || 0,
                        isSubmitted: false
                    });
                }
            });

            setEntries(results);
            setLoading(false);
        };

        loadLeaderboard();
    }, [players, currentGameweek]);

    // Filter Logic:
    // Weekly View: Show ONLY those who have submitted (isSubmitted === true).
    // All Time View: Show everyone.
    const displayEntries = entries.filter(e => {
        if (view === 'weekly') return e.isSubmitted;
        return true;
    });

    const sortedEntries = [...displayEntries].sort((a, b) => {
        if (view === 'weekly') return b.gwPoints - a.gwPoints;
        return b.totalPoints - a.totalPoints;
    });

    const getRankIcon = (index: number) => {
        if (index === 0) return <Medal className="text-yellow-400 fill-yellow-400/20 drop-shadow-md" size={28} />;
        if (index === 1) return <Medal className="text-gray-300 fill-gray-300/20 drop-shadow-md" size={26} />;
        if (index === 2) return <Medal className="text-amber-700 fill-amber-700/20 drop-shadow-md" size={26} />;
        return <span className="font-mono font-bold text-gray-500 w-8 text-center text-lg">{index + 1}</span>;
    };

    return (
        <div className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex flex-col items-center mb-10 text-center">
                <div className="p-4 bg-gradient-to-br from-[#1CA3DE] to-black rounded-full mb-4 border border-[#3ACBE8]/30 shadow-[0_0_25px_rgba(58,203,232,0.3)]">
                    <Trophy size={40} className="text-[#3ACBE8]" />
                </div>
                <h2 className="text-4xl font-extrabold text-white mb-2 tracking-tight">Manager Standings</h2>
                <p className="text-gray-300 text-base max-w-lg">
                    {view === 'weekly'
                        ? `Official rankings for Gameweek ${currentGameweek}. Only submitted teams are shown.`
                        : "All-time rankings of all registered managers."}
                </p>
            </div>

            <div className="flex justify-center mb-8">
                <div className="bg-[#0041C7] p-1.5 rounded-2xl border border-white/10 flex gap-1 shadow-xl">
                    <button
                        onClick={() => setView('weekly')}
                        className={`px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 uppercase tracking-wide
                            ${view === 'weekly' ? 'bg-[#3ACBE8] text-[#0041C7] shadow-lg shadow-[#3ACBE8]/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}
                        `}
                    >
                        <Calendar size={16} /> Weekly
                    </button>
                    <button
                        onClick={() => setView('alltime')}
                        className={`px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 uppercase tracking-wide
                            ${view === 'alltime' ? 'bg-[#1CA3DE] text-white shadow-lg shadow-[#1CA3DE]/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}
                        `}
                    >
                        <Hash size={16} /> All Time
                    </button>
                </div>
            </div>

            <div className="bg-[#0160C9]/80 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="bg-black/20 text-gray-300 text-xs uppercase tracking-widest border-b border-white/5">
                            <th className="p-6 text-center w-24">Rank</th>
                            <th className="p-6">Manager & Team</th>
                            <th className="p-6 text-center">{view === 'weekly' ? 'GW Points' : 'Total Points'}</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr>
                                <td colSpan={3} className="p-12 text-center text-gray-300 flex flex-col items-center justify-center gap-4">
                                    <div className="w-8 h-8 border-4 border-white/10 border-t-[#3ACBE8] rounded-full animate-spin"></div>
                                    <span>Loading standings...</span>
                                </td>
                            </tr>
                        ) : sortedEntries.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="p-12 text-center text-gray-300">
                                    {view === 'weekly'
                                        ? `No teams have submitted for Gameweek ${currentGameweek} yet.`
                                        : "No active managers found."}
                                </td>
                            </tr>
                        ) : (
                            sortedEntries.map((entry, index) => {
                                const isMe = entry.uid === currentUserUid;
                                return (
                                    <tr
                                        key={entry.uid}
                                        className={`transition-all duration-200 group ${isMe ? 'bg-[#3ACBE8]/10' : 'hover:bg-white/5'}`}
                                    >
                                        <td className="p-4 flex justify-center items-center">
                                            {getRankIcon(index)}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 overflow-hidden flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform">
                                                    <img src={entry.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                                </div>
                                                <div>
                                                    <div className={`font-bold text-base mb-0.5 flex items-center gap-2 ${isMe ? 'text-[#3ACBE8]' : 'text-white'}`}>
                                                        {entry.teamName}
                                                        {entry.isSubmitted && view === 'alltime' && (
                                                            <div className="bg-[#1CA3DE]/20 rounded-full p-0.5" title="Squad Submitted">
                                                                <CheckCircle size={12} className="text-[#1CA3DE]" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-400 flex items-center gap-1.5 uppercase font-medium tracking-wider">
                                                        <UserIcon size={10} /> {entry.username} {isMe && <span className="text-[#3ACBE8] ml-1 px-1.5 py-0.5 bg-[#3ACBE8]/10 rounded text-[9px] border border-[#3ACBE8]/20">YOU</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className={`inline-block px-4 py-1 rounded-lg font-mono font-bold text-xl tracking-tight
                                                    ${view === 'weekly'
                                                ? (isMe ? 'text-[#0041C7] bg-[#3ACBE8] border border-[#3ACBE8]/20' : 'text-[#3ACBE8]')
                                                : (isMe ? 'text-white bg-[#1CA3DE] border border-[#1CA3DE]/20' : 'text-[#1CA3DE]')
                                            }`}>
                                                {view === 'weekly' ? entry.gwPoints : entry.totalPoints}
                                            </div>
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
    );
};

export default Leaderboard;