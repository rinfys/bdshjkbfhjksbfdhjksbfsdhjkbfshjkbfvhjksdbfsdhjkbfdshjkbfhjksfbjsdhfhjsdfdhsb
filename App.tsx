import React, { useState, useRef, useEffect } from 'react';
import Pitch from './components/Pitch';
import PlayerList from './components/PlayerList';
import MarketModal from './components/MarketModal';
import SettingsModal from './components/SettingsModal';
import Login from './components/Login';
import UsernameSetup from './components/UsernameSetup';
import Navbar from './components/Navbar';
import Leaderboard from './components/Leaderboard';
import About from './components/About';
import Contact from './components/Contact';
import GuideOverlay from './components/GuideOverlay';

import { INITIAL_TEAM_SLOTS } from './constants';
import { ChevronLeft, ChevronRight, Edit2, Wallet, Star, Coins, Lock, Eye, AlertTriangle, Plus, RefreshCw, XCircle } from 'lucide-react';
import { Player, TeamSlot, UserSettings } from './types';
import { subscribeToPlayers, seedDatabase, subscribeToAuth, logoutUser, subscribeToUserTeam, saveUserTeam, INITIAL_DB_DATA } from './firebase';
import { User } from 'firebase/auth';

const MAX_BUDGET = 100.0;
// Deadline: 2/21/2026 at 3PM GMT (ISO format)
const DEADLINE_ISO = "2026-02-21T15:00:00Z";
// Unlock: Monday after deadline (Feb 23, 2026)
const UNLOCK_ISO = "2026-02-23T00:00:00Z";

const DEFAULT_SETTINGS: UserSettings = {
    username: '',
    usernameLastChanged: 0,
    nickname: '',
    theme: 'dark',
    currency: 'GBP',
    totalHistoryPoints: 0,
    profilePictureUrl: '',
    tutorialCompleted: false
};

const CURRENCY_SYMBOLS = {
    'GBP': '£',
    'USD': '$',
    'EUR': '€'
};

const App: React.FC = () => {
    // Auth State
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [userDataLoading, setUserDataLoading] = useState(true);

    // Navigation State
    const [currentPage, setCurrentPage] = useState('home');

    // App State
    const [view, setView] = useState<'pitch' | 'list'>('pitch');
    // Start at Gameweek 2
    const [gameweek, setGameweek] = useState(2);
    const [teamName, setTeamName] = useState("My Team");
    const [logoUrl, setLogoUrl] = useState(""); // Empty string means "No Logo Set"

    // Edit Mode State
    const [isEditMode, setIsEditMode] = useState(false);
    // Swap Logic State
    const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);

    // Settings State
    const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
    const [isUsernameSetup, setIsUsernameSetup] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [notification, setNotification] = useState<string | null>(null);

    // Players from Database (Market)
    // Initialize with EMPTY array to ensure we are waiting for DB connection
    const [dbPlayers, setDbPlayers] = useState<Player[]>([]);

    // State for Team Slots
    const [slots, setSlots] = useState<TeamSlot[]>(INITIAL_TEAM_SLOTS);
    const [isSquadComplete, setIsSquadComplete] = useState(false);

    // Modal States
    const [isMarketOpen, setIsMarketOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [marketSlotIndex, setMarketSlotIndex] = useState<number | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Derived Locking State
    const now = Date.now();
    const deadlineTime = new Date(DEADLINE_ISO).getTime();
    const unlockTime = new Date(UNLOCK_ISO).getTime();
    const isLocked = now > deadlineTime && now < unlockTime;

    // --- AUTH & DATA SYNC ---
    useEffect(() => {
        const safetyTimer = setTimeout(() => {
            if (authLoading) {
                console.warn("Auth initialization timed out. Defaulting to logged out.");
                setAuthLoading(false);
            }
        }, 2500);

        const unsubscribeAuth = subscribeToAuth((currentUser) => {
            setUser(currentUser);
            setAuthLoading(false);
            clearTimeout(safetyTimer);
        });

        return () => {
            unsubscribeAuth();
            clearTimeout(safetyTimer);
        };
    }, []);

    // Sync User Data
    useEffect(() => {
        if (!user) {
            setUserDataLoading(false);
            return;
        }

        setUserDataLoading(true);

        const dataTimer = setTimeout(() => {
            setUserDataLoading(prev => {
                if (prev) {
                    return false;
                }
                return prev;
            });
        }, 5000);

        const unsubscribeUser = subscribeToUserTeam(user.uid, (data) => {
            clearTimeout(dataTimer);

            if (data) {
                // Populate Team Data
                if (data.teamName) setTeamName(data.teamName);
                setLogoUrl(data.logoUrl || "");
                setIsSquadComplete(!!data.isSquadComplete);

                // Sync Settings
                if (data.settings) {
                    // Merge DB settings with defaults to ensure all keys exist
                    const mergedSettings = { ...DEFAULT_SETTINGS, ...data.settings };
                    setSettings(mergedSettings);

                    // CHECK: Do we have a username?
                    // We only require the username string to be present to skip setup.
                    // We do NOT strictly check usernameLastChanged here to avoid looping legacy users.
                    if (!mergedSettings.username || mergedSettings.username.trim() === '') {
                        setIsUsernameSetup(true);
                    } else {
                        setIsUsernameSetup(false);
                        // Trigger guide if not completed
                        if (!mergedSettings.tutorialCompleted) {
                            setTimeout(() => setShowGuide(true), 500);
                        }
                    }
                } else {
                    // No settings found (migration or first time weirdness), force setup
                    const newSettings = { ...DEFAULT_SETTINGS, username: '' };
                    setSettings(newSettings);
                    setIsUsernameSetup(true);
                }

                // Sync Slots
                if (data.slots && Array.isArray(data.slots)) {
                    const mergedSlots = INITIAL_TEAM_SLOTS.map((defaultSlot, idx) => {
                        const savedSlot = data.slots[idx];
                        // Ensure we keep the structure but take the saved player
                        return savedSlot ? { ...defaultSlot, ...savedSlot } : defaultSlot;
                    });
                    setSlots(mergedSlots);
                }
            } else {
                // NEW USER: Initialize DB
                const initialSettings = { ...DEFAULT_SETTINGS, username: '' };
                const initialData = {
                    teamName: "My Team",
                    slots: INITIAL_TEAM_SLOTS,
                    logoUrl: "",
                    settings: initialSettings,
                    isSquadComplete: false
                };

                // Initialize DB for this user
                saveUserTeam(user.uid, initialData);

                // Set Local State
                setSettings(initialSettings);
                setIsUsernameSetup(true);
            }
            setUserDataLoading(false);
        });

        return () => {
            unsubscribeUser();
            clearTimeout(dataTimer);
        };
    }, [user]);

    // Sync Global Market Players - WAIT FOR USER
    useEffect(() => {
        if (!user) return; // FIX: Do not attempt read if not authenticated

        const unsubscribeMarket = subscribeToPlayers((fetchedPlayers) => {
            if (!fetchedPlayers || fetchedPlayers.length === 0) {
                // If DB is empty, automatically seed it with our seed data from firebase.ts
                console.log("Database empty. Seeding...");
                seedDatabase(INITIAL_DB_DATA, true);

                // Optimistically set local state so user doesn't see empty list while uploading
                setDbPlayers(INITIAL_DB_DATA);
            } else {
                // If we have data, use the Database data!
                setDbPlayers(fetchedPlayers);
            }

            // LIVE UPDATE Slots based on new data (whether from DB or constant fallback)
            // This ensures if a player's points/price update in DB, the team slot updates immediately
            const sourceData = (fetchedPlayers && fetchedPlayers.length > 0) ? fetchedPlayers : INITIAL_DB_DATA;

            setSlots(currentSlots => {
                const newSlots = currentSlots.map(slot => {
                    if (!slot.player) return slot;
                    const updatedPlayer = sourceData.find(p => p.id === slot.player!.id);
                    return updatedPlayer ? { ...slot, player: updatedPlayer } : slot;
                });
                return newSlots;
            });
        });

        return () => unsubscribeMarket();
    }, [user]);

    // Ensure Edit Mode is disabled if locked
    useEffect(() => {
        if (isLocked) {
            setIsEditMode(false);
        }
    }, [isLocked]);

    // Theme Application
    useEffect(() => {
        // Fix Light Mode Visibility
        if (settings.theme === 'light') {
            document.body.style.backgroundColor = '#f3f4f6'; // Light Gray
            document.body.style.color = '#1f2937'; // Dark Gray
        } else {
            // Dark Mode Aesthetics
            document.body.style.backgroundColor = '#1a001e';
            document.body.style.color = '#ffffff';
        }
    }, [settings.theme]);

    // --- HELPERS ---

    const persistTeam = (newSlots: TeamSlot[]) => {
        // Validation: Check if all 8 slots are filled
        const filledCount = newSlots.filter(s => s.player !== null).length;
        const complete = filledCount === 8;

        setIsSquadComplete(complete);
        setSlots(newSlots);

        if(user) {
            // Persist to Firebase
            saveUserTeam(user.uid, {
                slots: newSlots,
                isSquadComplete: complete
            });
        }
    };

    const persistName = (name: string) => {
        setTeamName(name); // Optimistic update
        if(user) saveUserTeam(user.uid, { teamName: name });
    };

    const persistLogo = (url: string) => {
        setLogoUrl(url); // Optimistic update
        if(user) saveUserTeam(user.uid, { logoUrl: url });
    }

    const finishGuide = () => {
        setShowGuide(false);

        const updatedSettings = { ...settings, tutorialCompleted: true };
        setSettings(updatedSettings);

        if(user) {
            saveUserTeam(user.uid, { settings: updatedSettings });
        }

        // Enable edit mode and scroll to pitch
        setIsEditMode(true);
        setTimeout(() => {
            const el = document.getElementById('pitch-container');
            if(el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    };

    const handleGuideStepChange = (step: number) => {
        // Step 2 is "Build Your Squad". Enable Edit Mode so users can interact.
        if (step === 2) {
            setIsEditMode(true);
            // Optional: scroll to pitch if not already visible
            setTimeout(() => {
                const el = document.getElementById('pitch-container');
                if(el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 300);
        }
    };

    const nextGw = () => {};
    const prevGw = () => {};

    const handleLogoClick = () => fileInputRef.current?.click();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                persistLogo(base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    // --- TOGGLE EDIT MODE ---

    const toggleEditMode = (wantEdit: boolean) => {
        if (wantEdit && isLocked) {
            setNotification(`Deadline Passed! Transfers are locked until ${new Date(UNLOCK_ISO).toLocaleDateString('en-GB')}.`);
            // Auto hide notification
            setTimeout(() => setNotification(null), 4000);
            return;
        }
        setIsEditMode(wantEdit);
    };

    // --- TEAM BUILDER & SWAP LOGIC ---

    const handleRemovePlayer = (index: number) => {
        if (!isEditMode) return;
        const newSlots = [...slots];
        newSlots[index].player = null;
        persistTeam(newSlots);
        setSelectedSlotIndex(null); // Clear selection if any
    };

    const handleReplacePlayer = (index: number) => {
        if (!isEditMode) return;
        setMarketSlotIndex(index);
        setIsMarketOpen(true);
        setSelectedSlotIndex(null); // Clear selection so we don't try to swap
    };

    const handleSlotClick = (index: number) => {
        // Only interact in Edit Mode
        if (!isEditMode) return;

        const clickedSlot = slots[index];

        // 1. If we already have a selected slot (Swap Mode)
        if (selectedSlotIndex !== null) {
            if (selectedSlotIndex === index) {
                // Deselect if clicking same
                setSelectedSlotIndex(null);
            } else {
                // PERFORM SWAP
                const newSlots = [...slots];
                const player1 = newSlots[selectedSlotIndex].player;
                const player2 = newSlots[index].player;

                // VALIDATION: Cannot put non-GK in GK slot
                // Slot 0 and Slot 5 are GK slots.
                const isGKSlot = (i: number) => i === 0 || i === 5;
                const isGKPlayer = (p: Player | null) => p?.position === 'GK';

                // Check Swap Validity
                if (isGKSlot(index) && player1 && !isGKPlayer(player1)) {
                    setNotification("Only Goalkeepers can play in GK slots.");
                    setTimeout(() => setNotification(null), 3000);
                    setSelectedSlotIndex(null);
                    return;
                }
                if (isGKSlot(selectedSlotIndex) && player2 && !isGKPlayer(player2)) {
                    setNotification("Only Goalkeepers can play in GK slots.");
                    setTimeout(() => setNotification(null), 3000);
                    setSelectedSlotIndex(null);
                    return;
                }

                // Execute Swap
                newSlots[selectedSlotIndex].player = player2;
                newSlots[index].player = player1;

                persistTeam(newSlots);
                setSelectedSlotIndex(null);
            }
            return;
        }

        // 2. No slot selected yet
        if (!clickedSlot.player) {
            // If empty -> Open Market
            setMarketSlotIndex(index);
            setIsMarketOpen(true);
        } else {
            // If occupied -> Select for potential swap
            setSelectedSlotIndex(index);
        }
    };

    const handlePlayerSelect = (player: Player) => {
        if (marketSlotIndex === null) return;

        // Basic duplicate check
        const existingSlotIndex = slots.findIndex(s => s.player?.id === player.id);
        if (existingSlotIndex !== -1 && existingSlotIndex !== marketSlotIndex) {
            setNotification("This player is already in your squad!");
            setTimeout(() => setNotification(null), 3000);
            return;
        }

        const newSlots = [...slots];
        newSlots[marketSlotIndex] = { ...newSlots[marketSlotIndex], player: player };
        persistTeam(newSlots);
        setIsMarketOpen(false);
        setMarketSlotIndex(null);
    };

    // Determine Market Filter
    const getMarketFilter = (index: number | null) => {
        if (index === null) return '';
        // If GK slot (0 or 5), filter GK
        if (index === 0 || index === 5) return 'GK';
        // Otherwise, allow flexible Outfield selection
        return 'OUTFIELD';
    };

    // Stats
    const filledSlots = slots.filter(s => s.player !== null);
    const totalValue = filledSlots.reduce((acc, s) => acc + (s.player?.price || 0), 0);
    const remainingBudget = MAX_BUDGET - totalValue;
    const avgTeamRating = filledSlots.length > 0
        ? (filledSlots.reduce((acc, s) => acc + (s.player?.avgRating || 0), 0) / filledSlots.length).toFixed(1)
        : "0.0";
    const startingXI = slots.filter(s => s.type === 'starter' && s.player);
    const totalPoints = startingXI.reduce((acc, s) => acc + (s.player?.points || 0), 0);
    const startingList = slots.filter(s => s.type === 'starter').map(s => s.player).filter((p): p is Player => !!p);
    const benchList = slots.filter(s => s.type === 'bench').map(s => s.player).filter((p): p is Player => !!p);
    const ownedPlayerIds = slots.map(s => s.player?.id).filter((id): id is number => id !== undefined);

    // Dynamic Theme Classes
    const isLight = settings.theme === 'light';
    const bgMain = isLight ? 'bg-gray-100' : 'bg-gradient-to-b from-[#1a001e] to-[#29002d]';
    const textMain = isLight ? 'text-gray-900' : 'text-white';

    // Light Mode Support for Containers
    const cardBg = isLight
        ? 'bg-white border border-gray-200 shadow-xl text-gray-900'
        : 'bg-[#37003c]/60 backdrop-blur-md border border-white/10 shadow-2xl';

    const subCardBg = isLight
        ? 'bg-white border border-gray-200'
        : 'bg-black/20 border border-white/5';

    const currencySymbol = CURRENCY_SYMBOLS[settings.currency];

    // Format deadline
    const deadlineDate = new Date(DEADLINE_ISO);
    const deadlineString = deadlineDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' ' + deadlineDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    // --- RENDER ---

    if (authLoading) return (
        <div className={`min-h-screen flex flex-col items-center justify-center ${bgMain} ${textMain}`}>
            <div className="w-16 h-16 border-4 border-fpl-green border-t-transparent rounded-full animate-spin mb-6"></div>
            <div className="font-bold text-xl animate-pulse tracking-wider">LOADING RWA FANTASY</div>
        </div>
    );

    if (!user) return <Login />;

    if (userDataLoading) {
        return (
            <div className={`min-h-screen flex flex-col items-center justify-center ${bgMain} ${textMain}`}>
                <div className={`w-12 h-12 border-4 border-t-fpl-green rounded-full animate-spin mb-4 ${isLight ? 'border-gray-300' : 'border-white'}`}></div>
                <div className="text-sm font-medium opacity-70 tracking-widest uppercase">Initializing Manager...</div>
            </div>
        );
    }

    if (isUsernameSetup) {
        return (
            <UsernameSetup
                user={user}
                onComplete={(newUsername) => {
                    const newSettings = {
                        ...settings,
                        username: newUsername,
                        nickname: newUsername,
                        usernameLastChanged: Date.now()
                    };
                    setSettings(newSettings);
                    setIsUsernameSetup(false);
                    // Ensure the DB is updated with this completion
                    saveUserTeam(user.uid, { settings: newSettings });
                    setShowGuide(true);
                }}
                initialSettings={settings}
            />
        );
    }

    return (
        <div className={`min-h-screen font-sans ${bgMain} ${textMain} selection:bg-fpl-green selection:text-[#29002d] flex flex-col overflow-x-hidden transition-colors duration-700`}>

            <GuideOverlay
                active={showGuide}
                onComplete={finishGuide}
                teamName={teamName}
                logoUrl={logoUrl}
                onStepChange={handleGuideStepChange}
            />

            {/* Notification Toast */}
            {notification && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-top-4">
                    <div className="bg-fpl-pink text-white px-6 py-3 rounded-full shadow-[0_0_20px_rgba(233,0,82,0.4)] flex items-center gap-3 font-bold border border-white/20">
                        <XCircle size={20} />
                        {notification}
                    </div>
                </div>
            )}

            {/* Ambient Background Glow (Reduced opacity in light mode) */}
            <div className="fixed top-0 left-0 w-full h-screen pointer-events-none overflow-hidden z-0">
                <div className={`absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[150px] transition-colors duration-1000 ${isEditMode ? 'bg-fpl-pink' : 'bg-fpl-purple'} ${isLight ? 'opacity-10' : 'opacity-40'}`}></div>
                <div className={`absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full blur-[150px] transition-colors duration-1000 ${isEditMode ? 'bg-orange-600' : 'bg-fpl-blue'} ${isLight ? 'opacity-10' : 'opacity-20'}`}></div>
            </div>

            <Navbar
                currentView={currentPage}
                onNavigate={setCurrentPage}
                username={settings.username}
                profilePictureUrl={settings.profilePictureUrl}
                onLogout={logoutUser}
                onOpenSettings={() => setIsSettingsOpen(true)}
            />

            <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 md:py-12 relative z-10 flex flex-col">

                {/* --- HOME VIEW (DASHBOARD) --- */}
                {currentPage === 'home' && (
                    <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full animate-in fade-in zoom-in-95 duration-500">

                        {/* TEAM HEADER CARD */}
                        <div id="team-header" className={`flex flex-col md:flex-row items-center justify-between gap-8 p-8 rounded-3xl relative ${cardBg} transition-all duration-500 ${isEditMode ? 'border-fpl-pink/30 shadow-[0_0_50px_rgba(233,0,82,0.15)]' : 'border-white/10'}`}>

                            <div className="flex flex-col md:flex-row items-center gap-8 w-full md:w-auto text-center md:text-left">
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

                                {/* LOGO OR PLUS SIGN */}
                                <div
                                    className={`w-28 h-28 rounded-2xl flex items-center justify-center border-2 overflow-hidden shadow-2xl cursor-pointer relative group transition-all duration-300 ${isLight ? 'bg-gray-100' : 'bg-black/20'} ${isEditMode ? 'border-fpl-pink shadow-fpl-pink/20' : 'border-white/10 hover:border-fpl-green/50'}`}
                                    onClick={handleLogoClick}
                                    title="Change Team Logo"
                                >
                                    {logoUrl ? (
                                        <>
                                            <img src={logoUrl} alt="Team Logo" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Edit2 size={24} className={isEditMode ? "text-fpl-pink" : "text-fpl-green"} />
                                            </div>
                                        </>
                                    ) : (
                                        <div className={`flex flex-col items-center gap-1 ${isLight ? 'text-gray-400' : 'text-white/30'} group-hover:text-fpl-green transition-colors`}>
                                            <Plus size={32} />
                                            <span className="text-[10px] uppercase font-bold tracking-widest">Logo</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col">
                                    <input
                                        type="text"
                                        value={teamName}
                                        onChange={(e) => persistName(e.target.value)}
                                        className={`text-3xl md:text-5xl font-extrabold bg-transparent border-b-2 border-transparent focus:outline-none w-full min-w-[200px] text-center md:text-left tracking-tight transition-all placeholder-white/30 ${isLight ? 'text-gray-900 focus:border-gray-300' : 'text-white focus:border-white/20'}`}
                                        placeholder="Name your team"
                                    />
                                    <div className="flex items-center justify-center md:justify-start gap-3 mt-3">
                                        <div className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest border transition-colors duration-500 ${isEditMode ? 'bg-fpl-pink/10 text-fpl-pink border-fpl-pink/20' : 'bg-fpl-green/10 text-fpl-green border-fpl-green/20'}`}>
                                            Manager: {settings.username}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Team Stats Summary */}
                            <div id="money-box" className={`flex gap-6 md:gap-10 w-full md:w-auto justify-center md:justify-end mt-4 md:mt-0 pt-6 md:pt-0 ${isLight ? 'border-t border-gray-200' : 'border-t border-white/10'} md:border-t-0`}>
                                <div className="flex flex-col items-center md:items-end">
                                    <span className="text-[10px] uppercase tracking-widest text-gray-400 mb-1 font-bold">Bank</span>
                                    <div className={`flex items-center gap-1.5 font-bold text-2xl ${remainingBudget < 0 ? 'text-red-500' : (isEditMode ? 'text-fpl-pink' : 'text-fpl-green')}`}>
                                        <Coins size={20} strokeWidth={2.5} /> {currencySymbol}{remainingBudget.toFixed(1)}m
                                    </div>
                                </div>
                                <div className="flex flex-col items-center md:items-end">
                                    <span className="text-[10px] uppercase tracking-widest text-gray-400 mb-1 font-bold">Value</span>
                                    <div className={`flex items-center gap-1.5 font-bold text-2xl ${isLight ? 'text-gray-800' : 'text-white'}`}>
                                        <Wallet size={20} strokeWidth={2.5} /> {currencySymbol}{totalValue.toFixed(1)}m
                                    </div>
                                </div>
                                <div className="flex flex-col items-center md:items-end hidden sm:flex">
                                    <span className="text-[10px] uppercase tracking-widest text-gray-400 mb-1 font-bold">Rating</span>
                                    <div className="flex items-center gap-1.5 text-fpl-blue font-bold text-2xl">
                                        <Star size={20} className="fill-fpl-blue" strokeWidth={0} /> {avgTeamRating}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* View Toggles & GW Nav */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                            {/* Gameweek Nav & Mode Toggle */}
                            <div className={`col-span-1 md:col-span-2 flex flex-col p-4 rounded-2xl gap-4 ${subCardBg} shadow-lg backdrop-blur-sm relative overflow-hidden transition-all duration-500 ${isEditMode ? 'border-fpl-pink/20' : 'border-white/5'}`}>

                                <div className="flex items-center justify-between w-full px-2 sm:px-6 z-10">
                                    <button onClick={prevGw} disabled className={`p-3 cursor-not-allowed rounded-xl transition ${isLight ? 'text-gray-300 hover:bg-gray-100' : 'text-white/20 hover:bg-white/5'}`}><ChevronLeft size={24}/></button>
                                    <div className="text-center flex-1">
                                        <div className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Current Gameweek</div>
                                        <div className={`font-black text-3xl leading-none ${isLight ? 'text-gray-900' : 'text-white'}`}>{gameweek}</div>
                                        <div className="text-[10px] font-bold mt-1 uppercase tracking-wider flex items-center justify-center gap-2">
                                            {isEditMode ? (
                                                <span className="text-fpl-pink flex items-center gap-1 animate-pulse"><Edit2 size={10} /> Transfer Window Open</span>
                                            ) : (
                                                <span className="text-fpl-green">Deadline: {deadlineString}</span>
                                            )}
                                        </div>
                                    </div>
                                    <button onClick={nextGw} disabled className={`p-3 cursor-not-allowed rounded-xl transition ${isLight ? 'text-gray-300 hover:bg-gray-100' : 'text-white/20 hover:bg-white/5'}`}><ChevronRight size={24}/></button>
                                </div>

                                {/* EDIT / VIEW TOGGLE */}
                                <div className="w-full flex justify-center z-10">
                                    {isLocked && (
                                        <div className="absolute top-2 right-2 z-20 flex items-center gap-1 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[10px] font-bold uppercase tracking-widest animate-pulse pointer-events-none">
                                            <Lock size={10} /> Locked
                                        </div>
                                    )}

                                    <div className={`relative p-1 rounded-xl border flex ${isLight ? 'bg-gray-200 border-gray-300' : 'bg-black/40 border-white/10'}`}>
                                        {/* Background Slider */}
                                        <div
                                            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg transition-all duration-500 ease-out shadow-lg ${isEditMode ? 'bg-fpl-pink left-[calc(50%)] shadow-fpl-pink/30' : 'bg-fpl-green left-1 shadow-green-500/30'}`}
                                        ></div>

                                        <button
                                            onClick={() => toggleEditMode(false)}
                                            className={`relative z-10 flex items-center gap-2 px-8 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors duration-300 ${!isEditMode ? 'text-[#29002d]' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            <Eye size={14} /> View
                                        </button>
                                        <button
                                            onClick={() => toggleEditMode(true)}
                                            className={`relative z-10 flex items-center gap-2 px-8 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors duration-300 ${isEditMode ? 'text-white' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            <Edit2 size={14} /> Edit
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Points Box */}
                            <div className={`col-span-1 rounded-2xl p-0.5 shadow-lg transition-all duration-500 ${isEditMode ? 'bg-gradient-to-br from-fpl-pink to-orange-500 shadow-fpl-pink/20' : 'bg-gradient-to-br from-fpl-green to-emerald-600 shadow-fpl-green/20'}`}>
                                <div className={`w-full h-full rounded-[14px] flex flex-col items-center justify-center py-4 relative overflow-hidden ${isLight ? 'bg-white' : 'bg-[#29002d]'}`}>
                                    <div className={`absolute inset-0 opacity-5 ${isEditMode ? 'bg-fpl-pink' : 'bg-fpl-green'}`}></div>
                                    <span className={`text-[10px] uppercase font-bold tracking-widest relative z-10 transition-colors duration-500 ${isEditMode ? 'text-fpl-pink' : 'text-fpl-green'}`}>
                                        {isEditMode ? "Projected Cost" : "Live Points"}
                                     </span>
                                    <span className={`text-5xl font-black relative z-10 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                                         {isEditMode ?
                                             <span className="text-4xl">{currencySymbol}{totalValue.toFixed(1)}m</span>
                                             : totalPoints
                                         }
                                     </span>
                                </div>
                            </div>
                        </div>

                        {/* EDIT MODE: ALERTS */}
                        {isEditMode && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                <div className={`p-4 rounded-xl flex items-center gap-4 border ${isLight ? 'bg-white border-fpl-pink/30 shadow-lg' : 'bg-fpl-pink/10 border-fpl-pink/30'}`}>
                                    <div className="bg-fpl-pink text-white p-2 rounded-full"><RefreshCw size={16} /></div>
                                    <div>
                                        <h4 className="text-fpl-pink font-bold text-sm uppercase tracking-wide">Dynamic Formation</h4>
                                        <span className={`text-xs ${isLight ? 'text-gray-600' : 'text-pink-200/70'}`}>Drag and swap players to automatically adjust your defensive and attacking lines.</span>
                                    </div>
                                </div>

                                {!isSquadComplete && (
                                    <div className="bg-black/40 px-4 py-3 rounded-xl border border-red-500/30 flex items-center justify-center gap-2 text-red-400 text-sm font-bold uppercase tracking-wide">
                                        <AlertTriangle size={16} /> Incomplete Squad
                                    </div>
                                )}
                            </div>
                        )}

                        {!isSquadComplete && !isEditMode && (
                            <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex items-center gap-3 animate-pulse">
                                <AlertTriangle className="text-red-500" size={24} />
                                <div>
                                    <h4 className="text-red-400 font-bold text-sm uppercase">Squad Incomplete</h4>
                                    <p className={`text-xs ${isLight ? 'text-red-800' : 'text-red-200/70'}`}>Your team will not score points until you have 8 players selected.</p>
                                </div>
                                <button onClick={() => toggleEditMode(true)} className="ml-auto bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase transition">
                                    Fix Now
                                </button>
                            </div>
                        )}

                        {/* MAIN CONTENT (PITCH/LIST) */}
                        <div id="pitch-container" className="w-full relative">
                            {view === 'pitch' ? (
                                <Pitch
                                    slots={slots}
                                    onSlotClick={handleSlotClick}
                                    onRemovePlayer={handleRemovePlayer}
                                    onReplacePlayer={handleReplacePlayer}
                                    isEditMode={isEditMode}
                                    selectedSlotIndex={selectedSlotIndex}
                                />
                            ) : (
                                <PlayerList
                                    startingXI={startingList}
                                    bench={benchList}
                                    teamName={teamName}
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* --- OTHER VIEWS --- */}
                {currentPage === 'leaderboards' && (
                    <div className="w-full flex justify-center">
                        <Leaderboard players={dbPlayers} currentUserUid={user.uid} />
                    </div>
                )}

                {currentPage === 'about' && <About />}

                {currentPage === 'contact' && <Contact />}

            </main>

            {/* MARKET MODAL */}
            <MarketModal
                isOpen={isMarketOpen}
                onClose={() => setIsMarketOpen(false)}
                players={dbPlayers.length > 0 ? dbPlayers : INITIAL_DB_DATA}
                positionFilter={getMarketFilter(marketSlotIndex)}
                onSelect={handlePlayerSelect}
                currentBudget={remainingBudget}
                sellPrice={marketSlotIndex !== null ? (slots[marketSlotIndex].player?.price || 0) : 0}
                ownedPlayerIds={ownedPlayerIds}
                currencySymbol={currencySymbol}
            />

            {/* SETTINGS MODAL */}
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                user={user}
                currentSettings={settings}
            />

        </div>
    );
};

export default App;