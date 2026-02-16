import React from 'react';
import { TeamSlot } from '../types';
import PlayerCard from './PlayerCard';

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
        ? "bg-[#004f70] border-4 border-fpl-pink/50 shadow-[0_0_40px_rgba(233,0,82,0.2)]"
        : "bg-pool-radial border-2 border-white/20 shadow-2xl";

    const overlayClass = isEditMode
        ? "opacity-20 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"
        : "opacity-40";

    const renderSlot = (slot: TeamSlot) => (
        <PlayerCard
            key={slot.index}
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
        />
    );

    const starters = slots.slice(0, 5);
    const gkSlot = starters[0];
    const outfieldSlots = starters.slice(1, 5);

    const defenders = outfieldSlots.filter(s => s.player?.position === 'CD');
    const mids = outfieldSlots.filter(s => s.player?.position === 'LW' || s.player?.position === 'RW');
    const attackers = outfieldSlots.filter(s => s.player?.position === 'HS');
    const emptySlots = outfieldSlots.filter(s => s.player === null);

    const midAndEmpty = [...mids, ...emptySlots].sort((a,b) => a.index - b.index);

    const renderRow = (rowSlots: TeamSlot[]) => {
        if (rowSlots.length === 0) return null;
        // Gap-1 on mobile for tightness, Gap-16 on Desktop for spacious look
        return (
            <div className={`flex justify-center items-center w-full px-2 ${rowSlots.length === 1 ? 'gap-0' : 'gap-1 md:gap-16'}`}>
                {rowSlots.map(slot => renderSlot(slot))}
            </div>
        );
    };

    return (
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
                        {renderSlot(gkSlot)}
                    </div>
                    {defenders.length > 0 && <div className="flex items-center justify-center">{renderRow(defenders)}</div>}
                    {midAndEmpty.length > 0 && <div className="flex items-center justify-center">{renderRow(midAndEmpty)}</div>}
                    {attackers.length > 0 && <div className="flex items-center justify-center">{renderRow(attackers)}</div>}
                </div>
            </div>

            <div className={`rounded-b-xl border-x-2 border-b-2 p-2 md:p-6 mt-[-4px] z-10 relative shadow-inner transition-all duration-700 ${isEditMode ? 'bg-[#29002d] border-fpl-pink/50' : 'bg-gradient-to-b from-[#005f86] to-[#004f70] border-white/10'}`}>
                <div className={`flex justify-center gap-2 md:gap-12 px-2 md:px-8 rounded-lg py-4 backdrop-blur-sm min-h-[80px] md:min-h-[120px] items-center transition-colors duration-700 ${isEditMode ? 'bg-fpl-pink/5 border border-fpl-pink/20' : 'bg-black/20'}`}>
                    {[5,6,7].map(i => renderSlot(slots[i]))}
                </div>
            </div>
        </div>
    );
};

export default Pitch;