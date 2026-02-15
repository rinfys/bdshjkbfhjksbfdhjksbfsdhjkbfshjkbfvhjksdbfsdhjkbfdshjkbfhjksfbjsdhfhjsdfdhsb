import React from 'react';
import { TeamSlot } from '../types';
import PlayerCard from './PlayerCard';

interface PitchProps {
    slots: TeamSlot[];
    onSlotClick: (index: number) => void;
    onRemovePlayer?: (index: number) => void;
    onReplacePlayer?: (index: number) => void;
    isEditMode?: boolean;
    selectedSlotIndex?: number | null;
}

const Pitch: React.FC<PitchProps> = ({ slots, onSlotClick, onRemovePlayer, onReplacePlayer, isEditMode, selectedSlotIndex }) => {
    // Styles
    const pitchContainerClass = isEditMode
        ? "bg-[#004f70] border-4 border-fpl-pink/50 shadow-[0_0_40px_rgba(233,0,82,0.2)]"
        : "bg-pool-radial border-2 border-white/20 shadow-2xl";

    const overlayClass = isEditMode
        ? "opacity-20 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"
        : "opacity-40";

    // -- DYNAMIC ROW LOGIC --
    // Indices 0-4 are Starters.
    const starters = slots.slice(0, 5);

    // Filter slots by player position type to determine layout
    // Slot 0 is always GK.
    const gkSlot = starters[0];

    // Get Outfield slots (1-4)
    const outfieldSlots = starters.slice(1, 5);

    // Categorize
    const defenders = outfieldSlots.filter(s => s.player?.position === 'CD');
    const mids = outfieldSlots.filter(s => s.player?.position === 'LW' || s.player?.position === 'RW');
    const attackers = outfieldSlots.filter(s => s.player?.position === 'HS');
    const emptySlots = outfieldSlots.filter(s => s.player === null);

    // If we have empty slots, we need to show them somewhere.
    // We'll group them with Midfielders for visual balance, or create a 'Flex' row.
    // A clean way is to render: GK Row -> DEF Row -> MID + EMPTY Row -> ATT Row
    // This ensures specific positions stay in their lines, and new/empty slots appear in the middle.

    const midAndEmpty = [...mids, ...emptySlots].sort((a,b) => a.index - b.index);

    const renderRow = (rowSlots: TeamSlot[]) => {
        if (rowSlots.length === 0) return null;
        return (
            <div className={`flex justify-center items-center w-full px-4 ${rowSlots.length === 1 ? 'gap-0' : 'gap-4 md:gap-12'}`}>
                {rowSlots.map(slot => (
                    <PlayerCard
                        key={slot.index}
                        player={slot.player}
                        positionLabel={slot.player ? slot.player.position : (slot.index === 0 ? "GK" : "FLEX")}
                        onClick={() => onSlotClick(slot.index)}
                        onRemove={() => onRemovePlayer?.(slot.index)}
                        onReplace={() => onReplacePlayer?.(slot.index)}
                        isEditMode={isEditMode}
                        isSelected={selectedSlotIndex === slot.index}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="w-full flex flex-col transition-all duration-700">
            {/* Pool Area */}
            <div className={`relative w-full aspect-[4/3] overflow-hidden rounded-t-xl transition-all duration-700 ${pitchContainerClass}`}>

                {/* Pool Markings Overlay */}
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

                {/* Players Grid (Dynamic Layout) */}
                <div className="absolute inset-0 flex flex-col py-6 pt-10 pb-6 z-10">

                    {/* 1. Goalkeeper (Always top/back) */}
                    <div className="flex-1 flex items-start pt-2 justify-center">
                        <PlayerCard
                            player={gkSlot.player}
                            positionLabel="GK"
                            onClick={() => onSlotClick(0)}
                            onRemove={() => onRemovePlayer?.(0)}
                            onReplace={() => onReplacePlayer?.(0)}
                            isEditMode={isEditMode}
                            isSelected={selectedSlotIndex === 0}
                        />
                    </div>

                    {/* 2. Defenders */}
                    {defenders.length > 0 && (
                        <div className="flex-1 flex items-center justify-center">
                            {renderRow(defenders)}
                        </div>
                    )}

                    {/* 3. Midfielders & Empty Slots */}
                    {midAndEmpty.length > 0 && (
                        <div className="flex-1 flex items-center justify-center">
                            {renderRow(midAndEmpty)}
                        </div>
                    )}

                    {/* 4. Forwards */}
                    {attackers.length > 0 && (
                        <div className="flex-1 flex items-end pb-2 justify-center">
                            {renderRow(attackers)}
                        </div>
                    )}

                </div>
            </div>

            {/* Bench Area - Fixed Indices 5, 6, 7 */}
            <div className={`rounded-b-xl border-x-2 border-b-2 p-4 mt-[-4px] z-10 relative shadow-inner transition-all duration-700 ${isEditMode ? 'bg-[#29002d] border-fpl-pink/50' : 'bg-gradient-to-b from-[#005f86] to-[#004f70] border-white/10'}`}>
                <div className={`flex justify-center gap-8 px-4 rounded-lg py-4 backdrop-blur-sm min-h-[100px] items-center transition-colors duration-700 ${isEditMode ? 'bg-fpl-pink/5 border border-fpl-pink/20' : 'bg-black/20'}`}>
                    <PlayerCard
                        player={slots[5].player}
                        positionLabel="GK"
                        onClick={() => onSlotClick(5)}
                        onRemove={() => onRemovePlayer?.(5)}
                        onReplace={() => onReplacePlayer?.(5)}
                        isBench
                        isEditMode={isEditMode}
                        isSelected={selectedSlotIndex === 5}
                    />
                    <PlayerCard
                        player={slots[6].player}
                        positionLabel="HS"
                        onClick={() => onSlotClick(6)}
                        onRemove={() => onRemovePlayer?.(6)}
                        onReplace={() => onReplacePlayer?.(6)}
                        isBench
                        isEditMode={isEditMode}
                        isSelected={selectedSlotIndex === 6}
                    />
                    <PlayerCard
                        player={slots[7].player}
                        positionLabel="RW"
                        onClick={() => onSlotClick(7)}
                        onRemove={() => onRemovePlayer?.(7)}
                        onReplace={() => onReplacePlayer?.(7)}
                        isBench
                        isEditMode={isEditMode}
                        isSelected={selectedSlotIndex === 7}
                    />
                </div>
            </div>
        </div>
    );
};

export default Pitch;