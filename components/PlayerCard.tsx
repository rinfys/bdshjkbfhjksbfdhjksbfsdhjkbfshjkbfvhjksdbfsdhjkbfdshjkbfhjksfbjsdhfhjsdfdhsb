import React, { useEffect, useState } from 'react';
import { Player } from '../types';
import { Plus, X, ArrowRightLeft, Crown } from 'lucide-react';

interface PlayerCardProps {
  player: Player | null;
  positionLabel: string;
  onClick: () => void;
  onRemove?: () => void;
  onReplace?: () => void;
  onMakeCaptain?: () => void;
  onMakeViceCaptain?: () => void;
  isBench?: boolean;
  isEditMode?: boolean;
  isSelected?: boolean;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  isTripleCaptain?: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
                                                 player, positionLabel, onClick, onRemove, onReplace,
                                                 onMakeCaptain, onMakeViceCaptain, isBench, isEditMode, isSelected,
                                                 isCaptain, isViceCaptain, isTripleCaptain
                                               }) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!player) {
      setAvatarUrl(null);
      return;
    }

    const fetchRobloxAvatar = async () => {
      let userId = null;
      try {
        const r1 = await fetch("/api/roblox-usernames", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usernames: [player.name], excludeBannedUsers: true })
        });
        const d1 = await r1.json();
        if (d1.data?.[0]?.id) userId = d1.data[0].id;
      } catch (e) { /* Fail silent */ }

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

      if (!userId) return;

      let thumb = null;
      try {
        const r3 = await fetch(`/api/robloxThumbnails?userIds=${userId}&size=150x150&format=Png&isCircular=true`);
        const d3 = await r3.json();
        if (d3.data?.[0]?.state === 'Completed') thumb = d3.data[0].imageUrl;
      } catch (e) { /* Fail silent */ }

      if (!thumb) {
        try {
          const proxy = "https://corsproxy.io/?";
          const target = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=true`;
          const r4 = await fetch(proxy + encodeURIComponent(target));
          const d4 = await r4.json();
          if (d4.data?.[0]?.state === 'Completed') thumb = d4.data[0].imageUrl;
        } catch(e) { /* Fail silent */ }
      }

      if (isMounted && thumb) setAvatarUrl(thumb);
    };

    fetchRobloxAvatar();
    return () => { isMounted = false; };
  }, [player?.name]);

  const getTeamBgColor = (color: string) => {
    switch(color) {
      case 'sky': return 'bg-[#3ACBE8]';
      case 'blue': return 'bg-[#1CA3DE]';
      case 'purple': return 'bg-[#0041C7]';
      case 'green': return 'bg-emerald-500';
      case 'yellow': return 'bg-yellow-500';
      case 'red': return 'bg-red-600';
      case 'claret': return 'bg-[#7a003c]';
      default: return 'bg-gray-600';
    }
  };

  const cursorClass = isEditMode ? 'cursor-pointer hover:scale-105' : 'cursor-default';

  // Mobile layout adjustment
  // Use w-16 or w-20 on mobile, scale up on md
  const cardWidthClass = "w-[68px] md:w-28";
  const avatarSizeClass = "w-10 h-10 md:w-20 md:h-20";

  if (!player) {
    return (
        <div
            onClick={isEditMode ? onClick : undefined}
            className={`flex flex-col items-center justify-center group ${cardWidthClass} transition-all duration-300 ${cursorClass} ${!isEditMode && 'opacity-50 grayscale'}`}
        >
          <div className={`${avatarSizeClass} flex items-center justify-center rounded-full border-2 mb-1 relative transition-all duration-500
            ${isEditMode
              ? 'bg-[#3ACBE8]/10 border-[#3ACBE8] border-dashed animate-pulse group-hover:bg-[#3ACBE8]/30'
              : 'bg-white/5 border-white/20 border-dashed'
          }
        `}>
            <Plus className={`transition-colors duration-300 ${isEditMode ? 'text-[#3ACBE8]' : 'text-white/30'}`} size={20} />
          </div>

          <div className="w-full">
            {isEditMode && (
                <div className="bg-[#3ACBE8] text-[#0041C7] text-[8px] md:text-[9px] font-bold text-center py-0.5 rounded-t-sm uppercase tracking-wider truncate">
                  Add
                </div>
            )}
            <div className="bg-black/40 backdrop-blur-sm text-white/50 text-[8px] md:text-[10px] font-bold text-center py-1 border border-white/10 rounded-b-sm">
              {positionLabel}
            </div>
          </div>
        </div>
    );
  }

  let displayPoints = player.points;
  let pointMultiplier = 1;
  if (isCaptain) pointMultiplier = 2;
  if (isTripleCaptain) pointMultiplier = 3;
  displayPoints *= pointMultiplier;

  return (
      <div
          onClick={isEditMode ? onClick : undefined}
          className={`flex flex-col items-center justify-center relative group ${cardWidthClass} transition-all duration-300 ${cursorClass}`}
      >
        {isSelected && (
            <div className="absolute inset-0 bg-[#3ACBE8]/40 rounded-full scale-110 animate-pulse z-0 blur-xl"></div>
        )}

        {isEditMode && (
            <>
              {/* Action Buttons - Moved for better mobile touch targets */}
              <div className="absolute -top-3 -right-2 z-40 flex gap-1">
                <button
                    onClick={(e) => { e.stopPropagation(); onRemove?.(); }}
                    className="bg-red-500 text-white rounded-full p-1 shadow border border-white w-5 h-5 flex items-center justify-center hover:scale-110"
                >
                  <X size={10} strokeWidth={4} />
                </button>
              </div>

              {/* Captaincy Toggles - Bottom Overlay */}
              <div className="absolute -bottom-2 z-40 flex gap-1 w-full justify-center">
                <button
                    onClick={(e) => { e.stopPropagation(); onMakeCaptain?.(); }}
                    className={`rounded-full w-5 h-5 flex items-center justify-center border shadow-sm ${isCaptain ? 'bg-black text-yellow-400 border-yellow-400' : 'bg-white text-gray-400 border-gray-300'}`}
                >
                  <span className="font-bold text-[8px]">C</span>
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onMakeViceCaptain?.(); }}
                    className={`rounded-full w-5 h-5 flex items-center justify-center border shadow-sm ${isViceCaptain ? 'bg-black text-white border-white' : 'bg-white text-gray-400 border-gray-300'}`}
                >
                  <span className="font-bold text-[8px]">V</span>
                </button>
              </div>
            </>
        )}

        {!isEditMode && (
            <>
              {isCaptain && (
                  <div className={`absolute top-0 right-1 md:right-2 z-20 text-white rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center text-[8px] md:text-[10px] font-bold border shadow-md ${isTripleCaptain ? 'bg-black border-white animate-pulse' : 'bg-black border-yellow-400'}`}>
                    {isTripleCaptain ? 'TC' : 'C'}
                  </div>
              )}
              {isViceCaptain && (
                  <div className="absolute top-0 right-1 md:right-2 z-20 bg-gray-500 text-white rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center text-[8px] md:text-[10px] font-bold border border-gray-300 shadow-md">
                    V
                  </div>
              )}
            </>
        )}

        <div className={`${avatarSizeClass} rounded-full border-[2px] md:border-[3px] overflow-hidden mb-1 relative shadow-lg transition-all duration-300 flex items-center justify-center z-10
            ${!avatarUrl ? getTeamBgColor(player.teamColor) : 'bg-black/40'} 
            ${isSelected ? 'border-[#3ACBE8] shadow-[0_0_20px_rgba(58,203,232,0.6)]' : (isEditMode ? 'border-[#3ACBE8] group-hover:shadow-[0_0_15px_rgba(58,203,232,0.5)]' : 'border-white/20')}
            ${isCaptain ? 'ring-2 ring-yellow-400 ring-offset-1 md:ring-offset-2 ring-offset-[#0041C7]' : ''}
            ${isTripleCaptain ? 'ring-2 md:ring-4 ring-white ring-offset-1 md:ring-offset-2 ring-offset-[#0041C7]' : ''}
      `}>
          {avatarUrl ? (
              <img src={avatarUrl} alt={player.name} className="w-full h-full object-cover" />
          ) : (
              <span className="text-white font-bold text-sm md:text-xl tracking-widest shadow-black drop-shadow-md">
                {player.name.substring(0, 2).toUpperCase()}
            </span>
          )}

          {player.imageUrl && (
              <div className="absolute bottom-0 right-0 w-4 h-4 md:w-6 md:h-6 rounded-full bg-white border border-black/10 flex items-center justify-center shadow-sm z-10 overflow-hidden">
                <img src={player.imageUrl} alt="Team" className="w-full h-full object-contain" />
              </div>
          )}
        </div>

        <div className="w-full pointer-events-none relative z-10">
          <div className={`text-white text-[8px] md:text-[11px] font-medium text-center py-0.5 truncate border-t-2 border-l-2 border-r-2 border-[#3ACBE8]/30 rounded-t-sm px-0.5 ${isSelected ? 'bg-[#3ACBE8] text-[#0041C7]' : 'bg-[#0160C9]'}`}>
            {player.name}
          </div>
          <div className={`text-black text-[9px] md:text-[12px] font-bold text-center py-0.5 border-b-2 border-l-2 border-r-2 border-[#3ACBE8]/30 rounded-b-sm shadow-md flex justify-center items-center gap-1 transition-colors duration-300 ${isEditMode ? 'bg-[#3ACBE8] text-[#0041C7] border-[#3ACBE8]/50' : 'bg-white'}`}>
            {isEditMode ? (
                <span>£{player.price}</span>
            ) : (
                <span>{displayPoints}</span>
            )}
          </div>
          <div className={`text-[8px] md:text-[10px] text-white/80 text-center uppercase font-bold mt-0.5 tracking-wider rounded-sm ${isSelected ? 'bg-[#3ACBE8]/50 text-white' : 'bg-black/20'}`}>
            {player.position}
          </div>
        </div>
      </div>
  );
};

export default PlayerCard;