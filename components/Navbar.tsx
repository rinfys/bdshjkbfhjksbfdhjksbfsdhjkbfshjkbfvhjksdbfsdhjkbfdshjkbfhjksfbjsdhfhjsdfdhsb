import React from 'react';
import { Home, Trophy, Info, Mail, LogOut, User } from 'lucide-react';

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
        <nav className="bg-[#29002d]/90 backdrop-blur-xl sticky top-0 z-[50] border-b border-white/10 shadow-2xl">
            {/* Top Gradient Bar */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-fpl-blue via-fpl-green to-fpl-purple"></div>

            <div className="max-w-7xl mx-auto px-6">
                <div className="flex items-center justify-between h-20">

                    {/* Logo Section */}
                    <button
                        className="flex items-center gap-4 group focus:outline-none"
                        onClick={() => onNavigate('home')}
                    >
                        <div className="w-10 h-10 flex items-center justify-center">
                            <img src="https://i.imgur.com/AZYKczg.png" alt="Logo" className="w-full h-full object-contain hover:scale-110 transition-transform duration-300" />
                        </div>
                        <div className="text-left hidden md:block">
                            <h1 className="text-white font-extrabold text-xl leading-none tracking-tight group-hover:text-fpl-green transition-colors">RWA Fantasy</h1>
                            <p className="text-[10px] text-gray-400 font-medium tracking-widest uppercase mt-1">Official League</p>
                        </div>
                    </button>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-1 bg-white/5 p-1.5 rounded-2xl border border-white/5 shadow-inner">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = currentView === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onNavigate(item.id)}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300
                                        ${isActive
                                        ? 'bg-gradient-to-r from-fpl-green to-emerald-400 text-[#29002d] shadow-lg shadow-green-500/20 translate-y-[-1px]'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }
                                    `}
                                >
                                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* User Profile & Actions */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onOpenSettings}
                            className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group"
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-inner overflow-hidden">
                                {profilePictureUrl ? (
                                    <img src={profilePictureUrl} alt={username} className="w-full h-full object-cover" />
                                ) : (
                                    username.substring(0, 1).toUpperCase()
                                )}
                            </div>
                            <span className="text-xs font-bold text-gray-300 pr-2 max-w-[100px] truncate group-hover:text-white">{username}</span>
                        </button>

                        <button
                            onClick={onLogout}
                            className="p-2.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all duration-200 border border-transparent hover:border-red-400/20"
                            title="Sign Out"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#29002d]/95 backdrop-blur-xl border-t border-white/10 pb-safe z-50">
                <div className="flex justify-around items-center p-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentView === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onNavigate(item.id)}
                                className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all w-16 h-16
                                    ${isActive ? 'text-fpl-green bg-white/5' : 'text-gray-500'}
                                `}
                            >
                                <Icon size={24} className={`mb-1 transition-transform ${isActive ? 'scale-110' : ''}`} />
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </button>
                        )
                    })}
                    <button
                        onClick={onOpenSettings}
                        className="flex flex-col items-center justify-center p-3 rounded-2xl transition-all w-16 h-16 text-gray-500"
                    >
                        <User size={24} className="mb-1" />
                        <span className="text-[10px] font-medium">Profile</span>
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;