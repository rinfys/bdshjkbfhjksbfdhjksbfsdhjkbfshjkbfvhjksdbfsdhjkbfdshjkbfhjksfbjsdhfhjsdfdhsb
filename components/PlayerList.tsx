import React from 'react';
import { Player } from '../types';
import { Shield } from 'lucide-react';

interface PlayerListProps {
  startingXI: Player[];
  bench: Player[];
  teamName: string;
}

const PlayerRow: React.FC<{ player: Player; type: 'Starter' | 'Bench'; teamName: string }> = ({ player, type, teamName }) => (
  <div className="flex items-center justify-between p-3 bg-white/5 border-b border-white/10 hover:bg-white/10 transition">
    <div className="flex items-center gap-4">
       <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${type === 'Starter' ? 'bg-fpl-green text-fpl-purple' : 'bg-gray-600 text-white'}`}>
         {player.position}
       </div>
       <div>
         <div className="font-bold text-sm">{player.name}</div>
         <div className="text-xs text-gray-400">{teamName} Waterpolo</div>
       </div>
    </div>
    <div className="flex items-center gap-6">
       <div className="text-center w-8">
         <div className="text-[10px] uppercase text-gray-400">Pts</div>
         <div className="font-bold text-lg">{player.points}</div>
       </div>
    </div>
  </div>
);

const PlayerList: React.FC<PlayerListProps> = ({ startingXI, bench, teamName }) => {
  return (
    <div className="bg-[#29002d] rounded-xl overflow-hidden border border-white/10">
      <div className="bg-fpl-purple p-4 border-b border-white/10 flex items-center gap-2">
         <Shield size={16} className="text-fpl-green"/>
         <h3 className="font-bold uppercase tracking-wider text-sm">Starting Lineup</h3>
      </div>
      <div>
        {startingXI.map(p => <PlayerRow key={p.id} player={p} type="Starter" teamName={teamName} />)}
      </div>
      
      <div className="bg-fpl-purple p-4 border-b border-white/10 border-t border-white/10 flex items-center gap-2 mt-2">
         <Shield size={16} className="text-gray-400"/>
         <h3 className="font-bold uppercase tracking-wider text-sm text-gray-400">Bench</h3>
      </div>
      <div>
        {bench.map(p => <PlayerRow key={p.id} player={p} type="Bench" teamName={teamName} />)}
      </div>
    </div>
  );
};

export default PlayerList;