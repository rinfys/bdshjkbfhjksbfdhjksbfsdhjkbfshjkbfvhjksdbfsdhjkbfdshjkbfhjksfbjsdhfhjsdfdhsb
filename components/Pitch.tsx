import React from 'react';
import { TeamSlot } from '../types';
import PlayerCard from './PlayerCard';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';

interface PitchProps {
    slots: TeamSlot[];
    onSlotClick: (index: number) => void;
    onRemovePlayer?: (index: number) => void;
    onReplacePlayer?: (index: number) => void;
    onMakeCaptain?: (index: number) => void;
    onMakeViceCaptain?: (index: number) => void;
    isEditMode?: boolean;
    selectedSlotIndex?: number | null;
    activeChip?: string | null;
}

const Pitch: React.FC<PitchProps> = ({ slots, onSlotClick, onRemovePlayer, onReplacePlayer, onMakeCaptain, onMakeViceCaptain, isEditMode, selectedSlotIndex, activeChip }) => {
    const pitchContainerClass = isEditMode
        ? "bg-[#29002d] border-4 border-[#e90052] shadow-[0_0_50px_rgba(233,0,82,0.4)] animate-pulse-slow"
        : "bg-pool-radial border-2 border-white/20 shadow-2xl";

    const overlayClass = isEditMode
        ? "opacity-30 bg-[linear-gradient(rgba(233,0,82,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(233,0,82,0.2)_1px,transparent_1px)] bg-[size:30px_30px]"
        : "opacity-40";

    const renderSlot = (slot: TeamSlot) => (
        <PlayerCard
            key={slot.index}
            slotIndex={slot.index}
            player={slot.player}
            positionLabel={slot.player ? slot.player.position : (slot.index === 0 || slot.index === 5 ? "GK" : "FLEX")}
            onClick={() => onSlotClick(slot.index)}
            onRemove={() => onRemovePlayer?.(slot.index)}
            onReplace={() => onReplacePlayer?.(slot.index)}
            onMakeCaptain={() => onMakeCaptain?.(slot.index)}
            onMakeViceCaptain={() => onMakeViceCaptain?.(slot.index)}
            isEditMode={isEditMode}
            isSelected={selectedSlotIndex === slot.index}
            isCaptain={slot.isCaptain}
            isViceCaptain={slot.isViceCaptain}
            isTripleCaptain={slot.isCaptain && activeChip === 'tripleCaptain'}
            isBench={slot.type === 'bench'}
            isBenchBoostActive={activeChip === 'benchBoost'}
        />
    );

    // Separate starters and bench
    const starters = slots.filter(s => s.type === 'starter');
    const bench = slots.filter(s => s.type === 'bench');

    // Group starters by position for rows
    const gk = starters.filter(s => s.index === 0); // Assuming index 0 is GK

    // For the rest, we group by position to form rows
    // But we need to be careful. If a user swaps a DEF to a MID slot, does the slot type change?
    // In this app, `slots` has `position` property but it seems fixed in `INITIAL_TEAM_SLOTS`.
    // However, the user wants formation to adapt.
    // So we should group by the *player's* position if present, otherwise fallback to slot position?
    // Or better: Group by player position to determine which row they sit in.

    const outfield = starters.filter(s => s.index !== 0);

    const defenders = outfield.filter(s => s.player?.position === 'CD' || (!s.player && s.position === 'CD'));
    const midfielders = outfield.filter(s => s.player?.position === 'LW' || s.player?.position === 'RW' || (!s.player && (s.position === 'LW' || s.position === 'RW')));
    const attackers = outfield.filter(s => s.player?.position === 'HS' || (!s.player && s.position === 'HS'));

    // If we have "FLEX" slots or mixed, we might need a better way.
    // Let's just group by what the player IS.
    // If slot is empty, we put it in a "Midfield/Flex" row or keep original structure?
    // The original code filtered by `s.player?.position`.

    // Let's stick to the previous logic but ensure all slots are rendered.
    // Any slot not caught by specific filters should be rendered somewhere.

    const renderedIndices = new Set([0]); // GK is 0

    const defs = starters.filter(s => s.index !== 0 && (s.player?.position === 'CD' || (!s.player && s.position === 'CD')));
    defs.forEach(s => renderedIndices.add(s.index));

    const mids = starters.filter(s => s.index !== 0 && (['LW', 'RW'].includes(s.player?.position || '') || (!s.player && ['LW', 'RW'].includes(s.position))));
    mids.forEach(s => renderedIndices.add(s.index));

    const fwds = starters.filter(s => s.index !== 0 && (s.player?.position === 'HS' || (!s.player && s.position === 'HS')));
    fwds.forEach(s => renderedIndices.add(s.index));

    // Catch-all for any weird state (e.g. empty flex slots if any)
    const others = starters.filter(s => !renderedIndices.has(s.index));

    return (
        <SortableContext items={slots.map(s => s.index)} strategy={rectSortingStrategy}>
            <div className="w-full flex flex-col transition-all duration-700">
                {/* Significantly increased vertical aspect ratio to [4/3] (0.75 ratio vs 0.56 ratio of 16/9) to fit rows comfortably */}
                <div className={`relative w-full aspect-[4/3] md:aspect-[4/3] overflow-hidden rounded-t-xl transition-all duration-700 ${pitchContainerClass}`}>

                    <div className="absolute inset-0 pointer-events-none transition-all duration-700">
                        {isEditMode ? (
                            <div className="absolute inset-0 w-full h-full pointer-events-none">
                                <div className={overlayClass + " absolute inset-0"}></div>
                                <div className="absolute inset-0 border-[20px] border-black/20"></div>
                            </div>
                        ) : (
                            <div className="absolute inset-0 w-full h-full">
                                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="absolute top-0 left-0 opacity-40">
                                    <rect x="0" y="0" width="100%" height="100%" fill="none" stroke="white" strokeWidth="4" />
                                    <line x1="0" y1="50%" x2="100%" y2="50%" stroke="white" strokeWidth="1" strokeDasharray="5,5" />
                                    <rect x="35%" y="0" width="30%" height="4%" fill="none" stroke="white" strokeWidth="3" />
                                </svg>
                                <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_40%,rgba(0,0,0,0.6)_100%)]"></div>
                            </div>
                        )}
                    </div>

                    {/* Use justify-evenly to spread the rows out vertically across the taller pitch */}
                    <div className="absolute inset-0 flex flex-col py-4 md:py-8 z-10 justify-evenly">
                        <div className="flex items-center justify-center">
                            {gk.map(renderSlot)}
                        </div>
                        {defs.length > 0 && (
                            <div className="flex justify-center items-center w-full px-2 gap-1 md:gap-16">
                                {defs.map(renderSlot)}
                            </div>
                        )}
                        {(mids.length > 0 || others.length > 0) && (
                            <div className="flex justify-center items-center w-full px-2 gap-1 md:gap-16">
                                {[...mids, ...others].sort((a,b) => a.index - b.index).map(renderSlot)}
                            </div>
                        )}
                        {fwds.length > 0 && (
                            <div className="flex justify-center items-center w-full px-2 gap-1 md:gap-16">
                                {fwds.map(renderSlot)}
                            </div>
                        )}
                    </div>
                </div>

                <div className={`rounded-b-xl border-x-2 border-b-2 p-2 md:p-6 mt-[-4px] z-10 relative shadow-inner transition-all duration-700 ${isEditMode ? 'bg-[#37003c] border-[#e90052]' : 'bg-gradient-to-b from-[#005f86] to-[#004f70] border-white/10'}`}>
                    <div className={`flex justify-center gap-2 md:gap-12 px-2 md:px-8 rounded-lg py-4 backdrop-blur-sm min-h-[80px] md:min-h-[120px] items-center transition-all duration-700 ${isEditMode ? 'bg-[#e90052]/10 border border-[#e90052]/30' : 'bg-black/20'} ${activeChip === 'benchBoost' ? 'ring-4 ring-[#3ACBE8] shadow-[0_0_30px_rgba(58,203,232,0.5)] bg-[#3ACBE8]/10' : ''}`}>
                        {bench.map(renderSlot)}
                    </div>
                </div>
            </div>
        </SortableContext>
    );
};

export default Pitch;