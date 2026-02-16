import React from 'react';
import { X, Trophy, Shield, Goal, Star, User } from 'lucide-react';

interface RulesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0160C9] w-full max-w-lg rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden">

                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#0160C9] to-[#0041C7]">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Trophy className="text-[#3ACBE8]" size={24} /> Scoring Rules
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar text-white">

                    <div className="space-y-3">
                        <h3 className="text-[#3ACBE8] font-bold uppercase tracking-widest text-xs border-b border-white/10 pb-2">General Points</h3>
                        <div className="flex justify-between items-center text-sm">
                            <span className="flex items-center gap-2"><Trophy size={14}/> Team Win</span>
                            <span className="font-bold bg-white/10 px-2 py-0.5 rounded text-[#3ACBE8]">+4</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="flex items-center gap-2"><Shield size={14}/> Team Lose</span>
                            <span className="font-bold bg-white/10 px-2 py-0.5 rounded text-red-300">-2</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="flex items-center gap-2"><Goal size={14}/> Score a Goal</span>
                            <span className="font-bold bg-white/10 px-2 py-0.5 rounded text-[#3ACBE8]">+2</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="flex items-center gap-2"><User size={14}/> Assist</span>
                            <span className="font-bold bg-white/10 px-2 py-0.5 rounded text-[#3ACBE8]">+1</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="flex items-center gap-2"><Star size={14}/> MVP</span>
                            <span className="font-bold bg-white/10 px-2 py-0.5 rounded text-[#3ACBE8]">+4</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-[#3ACBE8] font-bold uppercase tracking-widest text-xs border-b border-white/10 pb-2">Defensive</h3>
                        <div className="flex justify-between items-center text-sm">
                            <span className="flex items-center gap-2"><Shield size={14}/> Defender: Concede &lt; 12</span>
                            <span className="font-bold bg-white/10 px-2 py-0.5 rounded text-[#3ACBE8]">+6</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="flex items-center gap-2"><Shield size={14}/> GK: Save</span>
                            <span className="font-bold bg-white/10 px-2 py-0.5 rounded text-[#3ACBE8]">+1</span>
                        </div>
                    </div>

                    <div className="bg-[#0041C7] p-4 rounded-xl border border-white/10">
                        <h3 className="font-bold text-sm mb-2 text-white">Special Rules</h3>
                        <ul className="text-xs text-gray-300 space-y-2 list-disc list-inside">
                            <li><strong className="text-white">Captain:</strong> Points are DOUBLED (x2).</li>
                            <li><strong className="text-white">Vice-Captain:</strong> Scores x1 unless Captain doesn't play.</li>
                        </ul>
                    </div>

                </div>

                <div className="p-4 bg-[#0041C7] text-center border-t border-white/10">
                    <button onClick={onClose} className="w-full py-3 bg-[#3ACBE8] text-[#0041C7] font-bold rounded-xl hover:bg-white transition shadow-lg">
                        Got it!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RulesModal;