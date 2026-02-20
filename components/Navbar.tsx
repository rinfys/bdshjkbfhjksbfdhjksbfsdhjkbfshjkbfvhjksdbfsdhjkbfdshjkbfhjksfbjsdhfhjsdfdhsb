import React, { useState } from 'react';
import { Home, Trophy, Info, Mail, LogOut, User, Settings } from 'lucide-react';

interface NavbarProps {
    currentView: string;
    onNavigate: (view: string) => void;
    username: string;
    profilePictureUrl?: string;
    onLogout: () => void;
    onOpenSettings: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, username, profilePictureUrl, onLogout, onOpenSettings }) => {
    const navItems = [
        { id: 'home', label: 'Home', icon: Home },
        { id: 'leaderboards', label: 'Leaderboards', icon: Trophy },
        { id: 'about', label: 'About', icon: Info },
        { id: 'contact', label: 'Contact', icon: Mail },
    ];

    return (
        <>
            {/* DESKTOP SIDEBAR - Floating Glass Dock */}
            <nav className="hidden md:flex fixed left-6 top-1/2 -translate-y-1/2 flex-col items-center gap-8 py-8 px-3 bg-[#0160C9]/40 backdrop-blur-2xl border border-white/10 rounded-[3rem] shadow-[0_0_40px_-10px_rgba(58,203,232,0.3)] z-50 transition-all duration-300 hover:bg-[#0160C9]/60 hover:shadow-[0_0_60px_-10px_rgba(58,203,232,0.5)] min-h-[500px]">

                {/* Logo */}
                <div className="w-12 h-12 mb-4 relative group cursor-pointer" onClick={() => onNavigate('home')}>
                    <div className="absolute inset-0 bg-[#3ACBE8] rounded-full blur-lg opacity-20 group-hover:opacity-60 transition-opacity duration-500"></div>
                    <img src="https://i.imgur.com/AZYKczg.png" alt="Logo" className="w-full h-full object-contain relative z-10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" />
                </div>

                {/* Nav Items */}
                <div className="flex flex-col gap-6 w-full items-center">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentView === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onNavigate(item.id)}
                                className={`relative group p-3 rounded-2xl transition-all duration-300 ${isActive ? 'bg-[#3ACBE8] text-[#0041C7] shadow-[0_0_20px_rgba(58,203,232,0.6)] scale-110' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                            >
                                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />

                                {/* Tooltip */}
                                <span className="absolute left-full ml-6 px-3 py-1.5 bg-[#0041C7] text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap border border-white/10 shadow-xl translate-x-[-10px] group-hover:translate-x-0 z-50 top-1/2 -translate-y-1/2">
                                    {item.label}
                                    <div className="absolute top-1/2 right-full -mt-1 border-4 border-transparent border-r-[#0041C7]"></div>
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Spacer */}
                <div className="flex-1"></div>

                {/* Settings / Logout */}
                <div className="flex flex-col gap-4 mt-auto">
                    <button onClick={onOpenSettings} className="p-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-2xl transition-all duration-300 group relative">
                        <Settings size={22} />
                        <span className="absolute left-full ml-6 px-3 py-1.5 bg-[#0041C7] text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap border border-white/10 shadow-xl translate-x-[-10px] group-hover:translate-x-0 z-50 top-1/2 -translate-y-1/2">
                            Settings
                            <div className="absolute top-1/2 right-full -mt-1 border-4 border-transparent border-r-[#0041C7]"></div>
                        </span>
                    </button>
                    <button onClick={onLogout} className="p-3 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-2xl transition-all duration-300 group relative">
                        <LogOut size={22} />
                        <span className="absolute left-full ml-6 px-3 py-1.5 bg-red-900 text-red-100 text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap border border-red-500/20 shadow-xl translate-x-[-10px] group-hover:translate-x-0 z-50 top-1/2 -translate-y-1/2">
                            Logout
                            <div className="absolute top-1/2 right-full -mt-1 border-4 border-transparent border-r-red-900"></div>
                        </span>
                    </button>
                </div>
            </nav>

            {/* DESKTOP TOP RIGHT - User Profile Pill */}
            <div className="hidden md:flex fixed top-6 right-8 z-50 items-center gap-4">
                <button onClick={onOpenSettings} className="flex items-center gap-3 pl-2 pr-4 py-2 bg-[#0160C9]/40 backdrop-blur-xl border border-white/10 rounded-full shadow-lg hover:bg-[#0160C9]/60 transition-all duration-300 group cursor-pointer hover:border-[#3ACBE8]/30">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#3ACBE8] to-[#0160C9] flex items-center justify-center text-white text-xs font-bold shadow-inner overflow-hidden border-2 border-white/10 group-hover:border-[#3ACBE8] transition-all">
                        {profilePictureUrl ? (
                            <img src={profilePictureUrl} alt={username} className="w-full h-full object-cover" />
                        ) : (
                            username.substring(0, 1).toUpperCase()
                        )}
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-xs font-bold text-white tracking-wide group-hover:text-[#3ACBE8] transition-colors">{username}</span>
                        <span className="text-[10px] text-[#3ACBE8] font-medium tracking-wider uppercase opacity-80 group-hover:opacity-100">Manager</span>
                    </div>
                </button>
            </div>

            {/* MOBILE BOTTOM BAR - Floating Pill */}
            <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-[#0160C9]/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl z-50 px-6 py-4 flex justify-between items-center">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;
                    return (
                        <button key={item.id} onClick={() => onNavigate(item.id)} className={`relative flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${isActive ? 'bg-[#3ACBE8] text-[#0041C7] -translate-y-4 shadow-[0_10px_20px_-5px_rgba(58,203,232,0.5)] scale-110' : 'text-gray-400 hover:text-white'}`}>
                            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                            {isActive && <div className="absolute -bottom-6 w-1 h-1 bg-[#3ACBE8] rounded-full"></div>}
                        </button>
                    )
                })}
                <button onClick={onOpenSettings} className="relative flex flex-col items-center justify-center w-12 h-12 rounded-full text-gray-400 hover:text-white transition-all">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20">
                        {profilePictureUrl ? (
                            <img src={profilePictureUrl} alt={username} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#1CA3DE] to-[#0160C9] flex items-center justify-center text-[10px] text-white font-bold">{username.substring(0, 1).toUpperCase()}</div>
                        )}
                    </div>
                </button>
            </div>
        </>
    );
};

export default Navbar;