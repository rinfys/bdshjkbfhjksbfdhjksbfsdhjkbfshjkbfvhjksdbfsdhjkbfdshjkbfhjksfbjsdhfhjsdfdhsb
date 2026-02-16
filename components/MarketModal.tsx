import React, { useState, useMemo } from 'react';
import { Player } from '../types';
import { X, Search, DollarSign, Star, Lock, Check, ArrowUpDown } from 'lucide-react';
import PlayerShirt from './PlayerShirt';

interface MarketModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  positionFilter: string;
  onSelect: (player: Player) => void;
  currentBudget: number;
  sellPrice: number;
  ownedPlayerIds: number[];
  currencySymbol: string;
}

type SortOption = 'price_desc' | 'price_asc' | 'rating' | 'name' | 'position' | 'team';

const MarketModal: React.FC<MarketModalProps> = ({ isOpen, onClose, players, positionFilter, onSelect, currentBudget, sellPrice, ownedPlayerIds, currencySymbol }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('price_desc');

  const maxSpendable = currentBudget + sellPrice;

  const processedPlayers = useMemo(() => {
    if (!players || !Array.isArray(players)) return [];

    const filtered = players.filter(p => {
      if (!p) return false;
      let matchesPosition = false;
      if (positionFilter === 'OUTFIELD') {
        matchesPosition = p.position !== 'GK';
      } else {
        matchesPosition = p.position === positionFilter;
      }
      const nameMatch = p.name ? p.name.toLowerCase().includes(searchTerm.toLowerCase()) : false;
      return matchesPosition && nameMatch;
    });

    return filtered.sort((a, b) => {
      if (!a || !b) return 0;
      switch (sortBy) {
        case 'price_desc': return (b.price || 0) - (a.price || 0);
        case 'price_asc': return (a.price || 0) - (b.price || 0);
        case 'rating': return (b.avgRating || 0) - (a.avgRating || 0);
        case 'name': return (a.name || '').localeCompare(b.name || '');
        case 'position': return (a.position || '').localeCompare(b.position || '');
        case 'team': return (a.teamColor || '').localeCompare(b.teamColor || '');
        default: return 0;
      }
    });
  }, [players, positionFilter, searchTerm, sortBy]);

  if (!isOpen) return null;

  return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="bg-[#0160C9] w-full max-w-2xl rounded-2xl shadow-2xl border border-white/10 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">

          <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#0160C9] to-[#0041C7] rounded-t-2xl">
            <div>
              <h2 className="text-2xl font-bold text-white">Transfer Market</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-gray-300 text-sm">Position: <span className="text-white font-bold">{positionFilter === 'OUTFIELD' ? 'Any Outfield' : positionFilter}</span></span>
                <span className="text-gray-300 text-sm">Budget: <span className={`font-bold ${maxSpendable < 0 ? 'text-red-300' : 'text-[#3ACBE8]'}`}>{currencySymbol}{maxSpendable.toFixed(1)}m</span></span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition text-gray-300 hover:text-white">
              <X size={24} />
            </button>
          </div>

          <div className="p-4 bg-[#0041C7] flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                  type="text"
                  placeholder="Search player name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#0160C9] border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:border-[#3ACBE8] focus:ring-1 focus:ring-[#3ACBE8] transition"
              />
            </div>
            <div className="relative min-w-[140px]">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 z-10">
                <ArrowUpDown size={16} />
              </div>
              <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full h-full bg-[#0160C9] border border-white/10 rounded-lg pl-10 pr-3 text-white text-sm font-bold focus:outline-none focus:border-[#3ACBE8] appearance-none cursor-pointer hover:bg-white/5 transition relative z-0"
              >
                <option className="bg-[#0160C9] text-white" value="price_desc">Price: High</option>
                <option className="bg-[#0160C9] text-white" value="price_asc">Price: Low</option>
                <option className="bg-[#0160C9] text-white" value="rating">Rating</option>
                <option className="bg-[#0160C9] text-white" value="name">Name</option>
                <option className="bg-[#0160C9] text-white" value="team">Team</option>
                {positionFilter === 'OUTFIELD' && <option className="bg-[#0160C9] text-white" value="position">Position</option>}
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {processedPlayers.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  No players found for this position.
                </div>
            ) : (
                <div className="space-y-2">
                  {processedPlayers.map(player => {
                    const isOwned = ownedPlayerIds.includes(player.id);
                    const isAffordable = player.price <= (maxSpendable + 0.05);
                    const isDisabled = isOwned || !isAffordable;

                    return (
                        <button
                            key={player.id}
                            onClick={() => !isDisabled && onSelect(player)}
                            disabled={isDisabled}
                            className={`w-full flex items-center justify-between p-3 border rounded-xl transition group text-left
                        ${isDisabled
                                ? 'bg-black/30 border-white/5 cursor-not-allowed opacity-60 grayscale'
                                : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-[#3ACBE8]/50 cursor-pointer'
                            }
                    `}
                        >
                          <div className="flex items-center gap-4">
                            <PlayerShirt color={player.teamColor} imageUrl={player.imageUrl} />
                            <div>
                              <h3 className={`font-bold transition ${!isDisabled ? 'text-white group-hover:text-[#3ACBE8]' : 'text-gray-400'}`}>
                                {player.name}
                              </h3>
                              <span className="text-xs text-gray-400 bg-white/10 px-2 py-0.5 rounded uppercase tracking-wider">{player.position}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 text-right">
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] text-gray-400 uppercase">Rating</span>
                              <div className="flex items-center text-[#1CA3DE] font-bold">
                                {player.avgRating} <Star size={12} className="ml-1 fill-[#1CA3DE]" />
                              </div>
                            </div>
                            <div className="flex flex-col items-end min-w-[70px]">
                              <span className="text-[10px] text-gray-400 uppercase">Price</span>

                              {isOwned ? (
                                  <div className="flex items-center font-bold text-xs text-gray-400 bg-white/10 px-2 py-1 rounded">
                                    <Check size={12} className="mr-1"/> Owned
                                  </div>
                              ) : (
                                  <div className={`flex items-center font-bold text-lg ${isAffordable ? 'text-[#3ACBE8]' : 'text-red-400'}`}>
                                    {isAffordable ? <span className="font-sans mr-0.5">{currencySymbol}</span> : <Lock size={14} className="mr-1"/>}
                                    {player.price}m
                                  </div>
                              )}

                            </div>
                          </div>
                        </button>
                    );
                  })}
                </div>
            )}
          </div>
        </div>
      </div>
  );
};

export default MarketModal;