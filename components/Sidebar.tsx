import React from 'react';
import { ChevronRight } from 'lucide-react';

const LOGO_URL = "https://i.imgur.com/AZYKczg.png";

interface SidebarProps {
    username?: string;
    teamName?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ username, teamName }) => {
    return (
        <aside className="w-full lg:w-1/4 flex flex-col gap-6 text-white">
            {/* Team Header */}
            <div className="bg-fpl-purple/50 p-2 rounded-lg">
                <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center border-2 border-white/20 overflow-hidden p-1">
                        <img src={LOGO_URL} alt="Team Logo" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold leading-tight">{teamName || "My Team"}</h2>
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                            <span>Manager: {username}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Points & Rankings */}
            <div className="border-t border-gray-700 pt-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">Points</h3>
                    <button className="text-xs bg-[#37003c] border border-gray-600 rounded-full px-3 py-1 flex items-center hover:bg-white/5 transition">
                        Match History <ChevronRight size={12} className="ml-1"/>
                    </button>
                </div>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-1 border-b border-gray-800">
                        <span className="text-gray-200">Overall points</span>
                        <span className="font-semibold">0</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-800">
                        <span className="text-gray-200">Overall rank</span>
                        <span className="font-semibold">-</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-800">
                        <span className="text-gray-200">Total players</span>
                        <span className="font-semibold">500</span>
                    </div>
                    <div className="flex justify-between py-1">
                        <span className="text-gray-200">Match points</span>
                        <span className="font-semibold">0</span>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;