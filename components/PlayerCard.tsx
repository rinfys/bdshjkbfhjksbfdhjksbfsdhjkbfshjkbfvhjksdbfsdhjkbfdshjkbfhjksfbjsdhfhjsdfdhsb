import React, { useEffect, useState } from 'react';
import { Player } from '../types';
import { Plus, RefreshCw, X, ArrowRightLeft } from 'lucide-react';

interface PlayerCardProps {
  player: Player | null;
  positionLabel: string; // The label on the pitch (e.g. "C", "GK")
  onClick: () => void;
  onRemove?: () => void;
  onReplace?: () => void;
  isBench?: boolean;
  isEditMode?: boolean;
  isSelected?: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, positionLabel, onClick, onRemove, onReplace, isBench, isEditMode, isSelected }) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!player) {
      setAvatarUrl(null);
      return;
    }

    const fetchRobloxAvatar = async () => {
      // 1. Try to get ID
      let userId = null;
      try {
        // Attempt A: Local API
        const r1 = await fetch("/api/robloxUsernames", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usernames: [player.name], excludeBannedUsers: true })
        });
        const d1 = await r1.json();
        if (d1.data?.[0]?.id) userId = d1.data[0].id;
      } catch (e) { /* Fail silent */ }

      // Attempt B: Proxy if Local failed
      if (!userId) {
        try {
          const proxy = "https://corsproxy.io/?";
          const target = `https://users.roblox.com/v1/usernames/users`;
          const r2 = await fetch(proxy + encodeURIComponent(target), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usernames: [player.name], excludeBannedUsers: true })
          });
          const d2 = await r2.json();
          if (d2.data?.[0]?.id) userId = d2.data[0].id;
        } catch (e) { /* Fail silent */ }
      }

      if (!userId) return; // No ID found, stick to default

      // 2. Try to get Thumbnail
      let thumb = null;
      try {
        // Attempt A: Local API
        const r3 = await fetch(`/api/robloxThumbnails?userIds=${userId}&size=150x150&format=Png&isCircular=true`);
        const d3 = await r3.json();
        if (d3.data?.[0]?.state === 'Completed') thumb = d3.data[0].imageUrl;
      } catch (e) { /* Fail silent */ }

      // Attempt B: Proxy
      if (!thumb) {
        try {
          const proxy = "https://corsproxy.io/?";
          const target = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=true`;
          const r4 = await fetch(proxy + encodeURIComponent(target));
          const d4 = await r4.json();
          if (d4.data?.[0]?.state === 'Completed') thumb = d4.data[0].imageUrl;
        } catch(e) { /* Fail silent */ }
      }

      if (isMounted && thumb) {
        setAvatarUrl(thumb);
      }
    };

    fetchRobloxAvatar();

    return () => { isMounted = false; };
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
            className={`flex flex-col items-center justify-center group w-28 transition-all duration-300 ${cursorClass} ${!isEditMode && 'opacity-50 grayscale'}`}
        >
          <div className={`w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-full border-2 mb-1 relative transition-all duration-500
            ${isEditMode
              ? 'bg-fpl-pink/10 border-fpl-pink border-dashed animate-pulse group-hover:bg-fpl-pink/30'
              : 'bg-white/5 border-white/20 border-dashed'
          }
        `}>
            <Plus className={`transition-colors duration-300 ${isEditMode ? 'text-fpl-pink' : 'text-white/30'}`} size={28} />
          </div>

          <div className="w-full max-w-[90px] md:max-w-[100px]">
            {isEditMode && (
                <div className="bg-fpl-pink text-white text-[9px] font-bold text-center py-0.5 rounded-t-sm uppercase tracking-wider">
                  Add Player
                </div>
            )}
            <div className="bg-black/40 backdrop-blur-sm text-white/50 text-[10px] font-bold text-center py-1 border border-white/10 rounded-b-sm">
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
            <div className="absolute inset-0 bg-fpl-green/20 rounded-full scale-110 animate-pulse z-0 blur-xl"></div>
        )}

        {/* EDIT MODE CONTROLS */}
        {isEditMode && (
            <>
              <button
                  onClick={(e) => { e.stopPropagation(); onRemove?.(); }}
                  className="absolute top-0 left-3 z-30 bg-red-500 text-white rounded-full p-1 shadow-lg border border-white hover:bg-red-600 hover:scale-110 transition"
              >
                <X size={10} strokeWidth={3} />
              </button>

              <button
                  onClick={(e) => { e.stopPropagation(); onReplace?.(); }}
                  className="absolute top-0 right-3 z-30 bg-fpl-green text-black rounded-full p-1 shadow-lg border border-black/20 hover:bg-white hover:scale-110 transition"
              >
                <ArrowRightLeft size={10} strokeWidth={3} />
              </button>
            </>
        )}

        {/* C/V Indicators (View Mode Only) */}
        {!isEditMode && (
            <div className="absolute top-0 right-4 z-20 flex flex-col gap-1 pointer-events-none">
              {player.isCaptain && (
                  <div className="bg-black text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border border-white shadow-md">C</div>
              )}
              {player.isViceCaptain && (
                  <div className="bg-black text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border border-white shadow-md">V</div>
              )}
              {player.warnings && (
                  <div className="bg-yellow-400 text-black text-[10px] font-bold rounded-sm w-5 h-5 flex items-center justify-center border border-black/20 shadow-md">!</div>
              )}
            </div>
        )}

        {/* Circle Avatar */}
        <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full border-[3px] overflow-hidden mb-1 relative shadow-lg transition-all duration-300 flex items-center justify-center z-10
            ${!avatarUrl ? getTeamBgColor(player.teamColor) : 'bg-black/40'} 
            ${isSelected ? 'border-fpl-green shadow-[0_0_20px_rgba(0,255,135,0.6)]' : (isEditMode ? 'border-fpl-pink group-hover:shadow-[0_0_15px_rgba(233,0,82,0.5)]' : 'border-white/20')}
      `}>
          {avatarUrl ? (
              <img src={avatarUrl} alt={player.name} className="w-full h-full object-cover" />
          ) : (
              <span className="text-white font-bold text-lg md:text-xl tracking-widest shadow-black drop-shadow-md">
                {player.name.substring(0, 2).toUpperCase()}
            </span>
          )}

          {/* Real Team Logo overlay */}
          {player.imageUrl && (
              <div className="absolute bottom-0 right-0 w-5 h-5 md:w-6 md:h-6 rounded-full bg-white border border-black/10 flex items-center justify-center shadow-sm z-10 overflow-hidden">
                <img src={player.imageUrl} alt="Team" className="w-full h-full object-contain" />
              </div>
          )}
        </div>

        {/* Name and Info Box */}
        <div className="w-full max-w-[90px] md:max-w-[100px] pointer-events-none relative z-10">
          <div className={`text-white text-[10px] md:text-[11px] font-medium text-center py-0.5 truncate border-t-2 border-l-2 border-r-2 border-gray-400/30 rounded-t-sm px-1 ${isSelected ? 'bg-fpl-green text-[#29002d]' : 'bg-[#37003c]'}`}>
            {player.name}
          </div>
          <div className={`text-black text-[11px] md:text-[12px] font-bold text-center py-0.5 border-b-2 border-l-2 border-r-2 border-gray-400/30 rounded-b-sm shadow-md flex justify-center items-center gap-1 transition-colors duration-300 ${isEditMode ? 'bg-fpl-pink text-white border-fpl-pink/50' : 'bg-white'}`}>
            {isEditMode ? (
                <span>£{player.price}m</span>
            ) : (
                <span>{player.points}</span>
            )}
          </div>
          <div className={`text-[9px] md:text-[10px] text-white/80 text-center uppercase font-bold mt-0.5 tracking-wider rounded-sm ${isSelected ? 'bg-fpl-green/50 text-white' : 'bg-black/20'}`}>
            {player.position}
          </div>
        </div>
      </div>
  );
};

export default PlayerCard;