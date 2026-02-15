import React, { useEffect, useState } from 'react';
import { Player } from '../types';
import { Plus, AlertCircle, RefreshCw, X, ArrowRightLeft } from 'lucide-react';

interface PlayerCardProps {
  player: Player | null;
  positionLabel: string; // The label on the pitch (e.g. "C", "GK")
  onClick: () => void;
  onRemove?: () => void;
  onReplace?: () => void;
  isBench?: boolean;
  isEditMode?: boolean;
  requiredPosition?: string;
  isSelected?: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, positionLabel, onClick, onRemove, onReplace, isBench, isEditMode, isSelected }) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!player) {
      setAvatarUrl(null);
      return;
    }

    const fetchRobloxAvatar = async () => {
      try {
        const proxy = "https://corsproxy.io/?";
        const targetUrl = "https://users.roblox.com/v1/usernames/users";

        const response1 = await fetch(proxy + encodeURIComponent(targetUrl), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ usernames: [player.name], excludeBannedUsers: true })
        });

        const data1 = await response1.json();
        if (data1.data && data1.data.length > 0) {
          const userId = data1.data[0].id;
          const thumbUrl = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=true`;
          const response2 = await fetch(proxy + encodeURIComponent(thumbUrl));
          const data2 = await response2.json();

          if (data2.data && data2.data.length > 0 && data2.data[0].state === 'Completed') {
            setAvatarUrl(data2.data[0].imageUrl);
          }
        }
      } catch (e) {
        console.debug("Could not fetch avatar for", player.name);
      }
    };

    fetchRobloxAvatar();
  }, [player?.name]);

  const getTeamBgColor = (color: string) => {
    switch(color) {
      case 'red': return 'bg-red-600';
      case 'blue': return 'bg-blue-600';
      case 'sky': return 'bg-sky-400';
      case 'green': return 'bg-green-600';
      case 'yellow': return 'bg-yellow-500';
      case 'purple': return 'bg-purple-600';
      case 'claret': return 'bg-[#7a003c]';
      default: return 'bg-gray-600';
    }
  };

  const cursorClass = isEditMode ? 'cursor-pointer hover:scale-105' : 'cursor-default';

  // EMPTY STATE
  if (!player) {
    return (
        <div
            onClick={isEditMode ? onClick : undefined}
            className={`flex flex-col items-center justify-center group w-28 transition-all duration-300 ${cursorClass} ${!isEditMode && 'opacity-30 grayscale'}`}
        >
          <div className={`w-20 h-20 flex items-center justify-center rounded-full border-2 mb-1 relative transition-all duration-500
            ${isEditMode
              ? 'bg-fpl-pink/20 border-fpl-pink border-dashed animate-pulse group-hover:bg-fpl-pink/40'
              : 'bg-white/5 border-white/20 border-dashed'
          }
        `}>
            <Plus className={`transition-colors duration-300 ${isEditMode ? 'text-fpl-pink' : 'text-white/30'}`} size={32} />
          </div>

          <div className="w-full max-w-[100px]">
            <div className={`text-[10px] font-bold text-center py-1 uppercase tracking-wider rounded-t-sm transition-colors duration-300 ${isEditMode ? 'bg-fpl-pink text-white' : 'bg-black/50 text-gray-400'}`}>
              {isEditMode ? 'Add Player' : 'Empty'}
            </div>
            <div className="bg-white/90 text-black text-[12px] font-bold text-center py-0.5 border-b border-l border-r border-gray-400/30 rounded-b-sm shadow-md">
              -
            </div>
            <div className="text-[10px] text-white/80 text-center uppercase font-bold mt-0.5 tracking-wider bg-black/20 rounded-sm">
              {positionLabel}
            </div>
          </div>
        </div>
    );
  }

  // FILLED STATE
  return (
      <div
          onClick={isEditMode ? onClick : undefined}
          className={`flex flex-col items-center justify-center relative group w-28 transition-all duration-300 ${cursorClass}`}
      >
        {/* Selected Indicator (for swapping) */}
        {isSelected && (
            <div className="absolute inset-0 bg-fpl-green/20 rounded-full scale-125 animate-pulse z-0"></div>
        )}

        {/* EDIT MODE CONTROLS */}
        {isEditMode && (
            <>
              {/* Remove Button (Top Left) */}
              <button
                  onClick={(e) => { e.stopPropagation(); onRemove?.(); }}
                  className="absolute top-0 left-2 z-30 bg-red-500 text-white rounded-full p-1.5 shadow-lg border border-white hover:bg-red-600 hover:scale-110 transition"
                  title="Remove Player"
              >
                <X size={12} strokeWidth={3} />
              </button>

              {/* Replace Button (Top Right) */}
              <button
                  onClick={(e) => { e.stopPropagation(); onReplace?.(); }}
                  className="absolute top-0 right-2 z-30 bg-fpl-green text-black rounded-full p-1.5 shadow-lg border border-black/20 hover:bg-white hover:scale-110 transition"
                  title="Replace from Market"
              >
                <ArrowRightLeft size={12} strokeWidth={3} />
              </button>
            </>
        )}

        {/* Icons for C/V (Hide in Edit Mode to avoid clutter) */}
        {!isEditMode && (
            <div className="absolute top-0 right-4 z-20 flex flex-col gap-1 pointer-events-none">
              {player.isCaptain && (
                  <div className="bg-black text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border border-white">C</div>
              )}
              {player.isViceCaptain && (
                  <div className="bg-black text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border border-white">V</div>
              )}
              {player.warnings && (
                  <div className="bg-yellow-400 text-black text-[10px] font-bold rounded-sm w-5 h-5 flex items-center justify-center border border-black/20">!</div>
              )}
            </div>
        )}

        {/* Spinner if selected */}
        {isSelected && (
            <div className="absolute top-0 right-4 z-20 bg-fpl-green text-black text-[10px] font-bold rounded-sm w-5 h-5 flex items-center justify-center border border-black/20 animate-spin">
              <RefreshCw size={12} />
            </div>
        )}

        {/* Circle Avatar (Big) */}
        <div className={`w-20 h-20 rounded-full border-[3px] overflow-hidden mb-1 relative shadow-lg transition-all duration-300 flex items-center justify-center z-10
            ${!avatarUrl ? getTeamBgColor(player.teamColor) : 'bg-black/40'} 
            ${isSelected ? 'border-fpl-green shadow-[0_0_20px_rgba(0,255,135,0.6)]' : (isEditMode ? 'border-fpl-pink group-hover:shadow-[0_0_15px_rgba(233,0,82,0.5)]' : 'border-white/20')}
      `}>
          {avatarUrl ? (
              <img src={avatarUrl} alt={player.name} className="w-full h-full object-cover" />
          ) : (
              <span className="text-white font-bold text-xl tracking-widest shadow-black drop-shadow-md">
                {player.name.substring(0, 2).toUpperCase()}
            </span>
          )}

          {player.imageUrl && (
              <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-white border border-black/10 flex items-center justify-center shadow-sm z-10 overflow-hidden">
                <img src={player.imageUrl} alt="Team" className="w-full h-full object-contain" />
              </div>
          )}
        </div>

        {/* Name and Info Box */}
        <div className="w-full max-w-[100px] pointer-events-none relative z-10">
          <div className={`text-white text-[11px] font-medium text-center py-0.5 truncate border-t-2 border-l-2 border-r-2 border-gray-400/30 rounded-t-sm px-1 ${isSelected ? 'bg-fpl-green text-[#29002d]' : 'bg-[#37003c]'}`}>
            {player.name}
          </div>
          <div className={`text-black text-[12px] font-bold text-center py-0.5 border-b-2 border-l-2 border-r-2 border-gray-400/30 rounded-b-sm shadow-md flex justify-center items-center gap-1 transition-colors duration-300 ${isEditMode ? 'bg-fpl-pink text-white border-fpl-pink/50' : 'bg-white'}`}>
            {isEditMode ? (
                <span>£{player.price}m</span>
            ) : (
                <span>{player.points}</span>
            )}
          </div>
          <div className={`text-[10px] text-white/80 text-center uppercase font-bold mt-0.5 tracking-wider rounded-sm ${isSelected ? 'bg-fpl-green/50 text-white' : 'bg-black/20'}`}>
            {player.position}
          </div>
        </div>
      </div>
  );
};

export default PlayerCard;