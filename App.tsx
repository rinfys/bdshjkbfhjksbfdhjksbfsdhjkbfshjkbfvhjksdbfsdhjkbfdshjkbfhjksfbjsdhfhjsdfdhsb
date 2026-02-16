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
import { ChevronLeft, ChevronRight, Edit2, Wallet, Star, Coins, Lock, AlertTriangle, Plus, RefreshCw, XCircle, CheckCircle, Send, Save, Undo2, Users } from 'lucide-react';
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
    const [logoUrl, setLogoUrl] = useState("");

    // Edit Mode State & Backup for Revert
    const [isEditMode, setIsEditMode] = useState(false);
    const [backupSlots, setBackupSlots] = useState<TeamSlot[]>([]);

    // Swap Logic State
    const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);

    // Settings State
    const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
    const [isUsernameSetup, setIsUsernameSetup] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [notification, setNotification] = useState<string | null>(null);

    // Players from Database (Market)
    const [dbPlayers, setDbPlayers] = useState<Player[]>([]);

    // State for Team Slots
    const [slots, setSlots] = useState<TeamSlot[]>(INITIAL_TEAM_SLOTS);
    const [isSquadComplete, setIsSquadComplete] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

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

        const unsubscribeUser = subscribeToUserTeam(user.uid, (data) => {
            if (data) {
                if (data.teamName) setTeamName(data.teamName);
                setLogoUrl(data.logoUrl || "");
                setIsSquadComplete(!!data.isSquadComplete);
                setIsSubmitted(!!data.isSubmitted);

                if (data.settings) {
                    const mergedSettings = { ...DEFAULT_SETTINGS, ...data.settings };
                    setSettings(mergedSettings);
                    if (!mergedSettings.username || mergedSettings.username.trim() === '') {
                        setIsUsernameSetup(true);
                    } else {
                        setIsUsernameSetup(false);
                        if (!mergedSettings.tutorialCompleted) setTimeout(() => setShowGuide(true), 500);
                    }
                } else {
                    const newSettings = { ...DEFAULT_SETTINGS, username: '' };
                    setSettings(newSettings);
                    setIsUsernameSetup(true);
                }

                if (data.slots && Array.isArray(data.slots)) {
                    const mergedSlots = INITIAL_TEAM_SLOTS.map((defaultSlot, idx) => {
                        const savedSlot = data.slots[idx];
                        return savedSlot ? { ...defaultSlot, ...savedSlot } : defaultSlot;
                    });
                    setSlots(mergedSlots);
                }
            } else {
                const initialSettings = { ...DEFAULT_SETTINGS, username: '' };
                const initialData = {
                    teamName: "My Team",
                    slots: INITIAL_TEAM_SLOTS,
                    logoUrl: "",
                    settings: initialSettings,
                    isSquadComplete: false,
                    isSubmitted: false
                };
                saveUserTeam(user.uid, initialData);
                setSettings(initialSettings);
                setIsUsernameSetup(true);
            }
            setUserDataLoading(false);
        });

        return () => unsubscribeUser();
    }, [user]);

    // Sync Global Market Players
    useEffect(() => {
        if (!user) return;
        const unsubscribeMarket = subscribeToPlayers((fetchedPlayers) => {
            if (!fetchedPlayers || fetchedPlayers.length === 0) {
                seedDatabase(INITIAL_DB_DATA, false);
                setDbPlayers(INITIAL_DB_DATA);
            } else {
                setDbPlayers(fetchedPlayers);
            }

            // Live update prices/points of owned players
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

    // Theme Application
    useEffect(() => {
        if (settings.theme === 'light') {
            document.body.style.backgroundColor = '#f3f4f6';
            document.body.style.color = '#1f2937';
        } else {
            document.body.style.backgroundColor = '#1a001e';
            document.body.style.color = '#ffffff';
        }
    }, [settings.theme]);

    // --- LOGIC ---

    const persistTeam = (newSlots: TeamSlot[]) => {
        // Only update local state here if in edit mode.
        // We do NOT save to Firebase on every click in Edit Mode anymore to allow "Cancel".
        // BUT to prevent data loss on refresh, we will autosave to a "draft" state implicitly
        // by saving to Firebase but keeping isSubmitted false.

        const starters = newSlots.filter(s => s.type === 'starter');
        const startersFilled = starters.every(s => s.player !== null);
        const complete = startersFilled;

        setIsSquadComplete(complete);
        setSlots(newSlots);

        // Auto-save draft, but REVOKE submission
        if(user) {
            saveUserTeam(user.uid, {
                slots: newSlots,
                isSquadComplete: complete,
                isSubmitted: false // Editing revokes submission
            });
            setIsSubmitted(false);
        }
    };

    const enterEditMode = () => {
        if (isLocked) {
            setNotification(`Deadline Passed! Locked until ${new Date(UNLOCK_ISO).toLocaleDateString('en-GB')}.`);
            setTimeout(() => setNotification(null), 4000);
            return;
        }
        // Snapshot current slots for revert capability
        setBackupSlots(JSON.parse(JSON.stringify(slots)));
        setIsEditMode(true);
    };

    const cancelEditMode = () => {
        // Revert to backup
        setSlots(backupSlots);
        setIsEditMode(false);
        // We also need to restore the previous "isSubmitted" state if we reverted?
        // This is tricky. Simplified: If they cancel, we revert slots in DB too.
        if (user) {
            saveUserTeam(user.uid, {
                slots: backupSlots,
                // We assume if they cancel, we go back to whatever state they were in.
                // Ideally we'd store the previous isSubmitted state too, but let's assume
                // if they revert to a valid squad it might be submitted.
                // For safety, let's keep isSubmitted as is (likely false if they edited).
                // Actually, let's just revert slots.
            });
        }
    };

    const handleSubmitSquad = () => {
        if (!user) return;

        const starters = slots.filter(s => s.type === 'starter');
        const startersFilled = starters.every(s => s.player !== null);

        if (!startersFilled) {
            setNotification("You must fill your starting 5 before submitting!");
            setTimeout(() => setNotification(null), 3000);
            return;
        }

        setIsSubmitted(true);
        saveUserTeam(user.uid, { isSubmitted: true, slots: slots });
        setNotification("Squad Submitted! Good luck.");
        setTimeout(() => setNotification(null), 3000);
        setIsEditMode(false);
    };

    const persistName = (name: string) => {
        setTeamName(name);
        if(user) saveUserTeam(user.uid, { teamName: name });
    };

    const persistLogo = (url: string) => {
        setLogoUrl(url);
        if(user) saveUserTeam(user.uid, { logoUrl: url });
    }

    const finishGuide = () => {
        setShowGuide(false);
        const updatedSettings = { ...settings, tutorialCompleted: true };
        setSettings(updatedSettings);
        if(user) saveUserTeam(user.uid, { settings: updatedSettings });
        enterEditMode();
    };

    const handleGuideStepChange = (step: number) => {
        if (step === 2 && !isEditMode) enterEditMode();
    };

    const handleLogoClick = () => isEditMode && fileInputRef.current?.click();

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

    // --- TEAM BUILDER ACTIONS ---

    const handleRemovePlayer = (index: number) => {
        if (!isEditMode) return;
        const newSlots = [...slots];
        newSlots[index].player = null;
        persistTeam(newSlots);
        setSelectedSlotIndex(null);
    };

    const handleReplacePlayer = (index: number) => {
        if (!isEditMode) return;
        setMarketSlotIndex(index);
        setIsMarketOpen(true);
        setSelectedSlotIndex(null);
    };

    const handleSlotClick = (index: number) => {
        if (!isEditMode) return;
        const clickedSlot = slots[index];

        // Swap Logic
        if (selectedSlotIndex !== null) {
            if (selectedSlotIndex === index) {
                setSelectedSlotIndex(null);
            } else {
                const newSlots = [...slots];
                const player1 = newSlots[selectedSlotIndex].player;
                const player2 = newSlots[index].player;

                const isGKSlot = (i: number) => i === 0 || i === 5;
                const isGKPlayer = (p: Player | null) => p?.position === 'GK';

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

                newSlots[selectedSlotIndex].player = player2;
                newSlots[index].player = player1;
                persistTeam(newSlots);
                setSelectedSlotIndex(null);
            }
            return;
        }

        if (!clickedSlot.player) {
            setMarketSlotIndex(index);
            setIsMarketOpen(true);
        } else {
            setSelectedSlotIndex(index);
        }
    };

    const handlePlayerSelect = (player: Player) => {
        if (marketSlotIndex === null) return;
        const existingSlotIndex = slots.findIndex(s => s.player?.id === player.id);
        if (existingSlotIndex !== -1 && existingSlotIndex !== marketSlotIndex) {
            setNotification("Player already in squad!");
            setTimeout(() => setNotification(null), 3000);
            return;
        }
        const newSlots = [...slots];
        newSlots[marketSlotIndex] = { ...newSlots[marketSlotIndex], player: player };
        persistTeam(newSlots);
        setIsMarketOpen(false);
        setMarketSlotIndex(null);
    };

    const getMarketFilter = (index: number | null) => {
        if (index === null) return '';
        if (index === 0 || index === 5) return 'GK';
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

    // Styling
    const isLight = settings.theme === 'light';
    const bgMain = isLight ? 'bg-gray-100' : 'bg-gradient-to-b from-[#1a001e] to-[#29002d]';
    const textMain = isLight ? 'text-gray-900' : 'text-white';
    const cardBg = isLight ? 'bg-white shadow-xl border-gray-200' : 'bg-[#37003c]/60 backdrop-blur-md border-white/10 shadow-2xl';
    const currencySymbol = CURRENCY_SYMBOLS[settings.currency];
    const deadlineString = new Date(DEADLINE_ISO).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

    if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-[#1a001e]"><div className="animate-spin w-12 h-12 border-4 border-fpl-green rounded-full border-t-transparent"></div></div>;
    if (!user) return <Login />;
    if (userDataLoading) return <div className="min-h-screen flex items-center justify-center bg-[#1a001e] text-fpl-green font-bold">LOADING MANAGER...</div>;
    if (isUsernameSetup) return <UsernameSetup user={user} onComplete={(name) => { setSettings({...settings, username: name}); setIsUsernameSetup(false); saveUserTeam(user.uid, { settings: {...settings, username: name}}); setShowGuide(true); }} initialSettings={settings} />;

    return (
        <div className={`min-h-screen font-sans ${bgMain} ${textMain} selection:bg-fpl-green selection:text-[#29002d] flex flex-col pb-24`}>

            <GuideOverlay active={showGuide} onComplete={finishGuide} teamName={teamName} logoUrl={logoUrl} onStepChange={handleGuideStepChange} />

            {/* Notification */}
            {notification && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-4 fade-in">
                    <div className="bg-fpl-pink text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 font-bold border border-white/20">
                        {notification.includes("Submitted") ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                        {notification}
                    </div>
                </div>
            )}

            {/* EDIT MODE STICKY FOOTER */}
            {isEditMode && (
                <div className="fixed bottom-0 left-0 w-full bg-[#29002d]/95 backdrop-blur-xl z-[100] border-t border-fpl-pink/30 shadow-[0_-5px_30px_rgba(233,0,82,0.2)] animate-in slide-in-from-bottom-full duration-300">
                    <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-xs text-fpl-pink font-bold uppercase tracking-widest">Editing Squad</span>
                            <div className={`text-sm font-bold ${remainingBudget < 0 ? 'text-red-500' : 'text-white'}`}>
                                Bank: {currencySymbol}{remainingBudget.toFixed(1)}m
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={cancelEditMode} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold uppercase flex items-center gap-2 transition">
                                <Undo2 size={16} /> Cancel
                            </button>
                            <button onClick={handleSubmitSquad} className="px-6 py-2 bg-fpl-green hover:bg-white text-fpl-purple rounded-lg text-xs font-bold uppercase flex items-center gap-2 transition shadow-lg shadow-green-500/20">
                                <Save size={16} /> Submit Team
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* BACKGROUND */}
            <div className="fixed top-0 left-0 w-full h-screen pointer-events-none overflow-hidden z-0">
                <div className={`absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full blur-[120px] transition-colors duration-1000 ${isEditMode ? 'bg-fpl-pink opacity-20' : 'bg-fpl-purple opacity-30'}`}></div>
                <div className={`absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[120px] transition-colors duration-1000 ${isEditMode ? 'bg-orange-600 opacity-20' : 'bg-fpl-blue opacity-20'}`}></div>
            </div>

            <Navbar currentView={currentPage} onNavigate={setCurrentPage} username={settings.username} profilePictureUrl={settings.profilePictureUrl} onLogout={logoutUser} onOpenSettings={() => setIsSettingsOpen(true)} />

            <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 relative z-10 flex flex-col gap-6">

                {currentPage === 'home' && (
                    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full animate-in fade-in zoom-in-95 duration-500">

                        {/* HEADER CARD */}
                        <div id="team-header" className={`flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-3xl border transition-all duration-500 ${isEditMode ? 'bg-[#29002d] border-fpl-pink/40 shadow-[0_0_30px_rgba(233,0,82,0.1)]' : `${cardBg} border-white/10`}`}>
                            <div className="flex items-center gap-6 w-full md:w-auto">
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                                <div onClick={handleLogoClick} className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center border-2 overflow-hidden shadow-lg relative group transition-all duration-300 ${isEditMode ? 'cursor-pointer border-fpl-pink' : 'border-white/10'}`}>
                                    {logoUrl ? (
                                        <>
                                            <img src={logoUrl} className="w-full h-full object-cover" />
                                            {isEditMode && <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100"><Edit2 className="text-white"/></div>}
                                        </>
                                    ) : <Plus className="text-gray-500" />}
                                </div>
                                <div>
                                    {isEditMode ? (
                                        <input type="text" value={teamName} onChange={(e) => persistName(e.target.value)} className="bg-transparent text-2xl md:text-4xl font-black text-white border-b border-white/20 focus:border-fpl-pink outline-none w-full" placeholder="Team Name" />
                                    ) : (
                                        <h1 className="text-2xl md:text-4xl font-black">{teamName}</h1>
                                    )}
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Manager: {settings.username}</span>
                                        {isSubmitted && <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded font-bold border border-blue-500/20 flex items-center gap-1"><CheckCircle size={10}/> Verified</span>}
                                    </div>
                                </div>
                            </div>

                            {/* STATS */}
                            <div className="flex gap-8">
                                <div className="text-right">
                                    <div className="text-[10px] font-bold uppercase text-gray-400 mb-1">Total Points</div>
                                    <div className={`text-3xl font-black ${isLight ? 'text-gray-900' : 'text-white'}`}>{settings.totalHistoryPoints || 0}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-bold uppercase text-gray-400 mb-1">Team Value</div>
                                    <div className="text-3xl font-black text-fpl-green flex items-center gap-1 justify-end">{currencySymbol}{totalValue.toFixed(1)}m</div>
                                </div>
                            </div>
                        </div>

                        {/* ACTION BAR */}
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div className="flex items-center gap-4 bg-white/5 p-2 rounded-xl border border-white/5">
                                <button className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-30"><ChevronLeft size={20}/></button>
                                <div className="text-center">
                                    <div className="text-[10px] uppercase font-bold text-gray-400">Gameweek</div>
                                    <div className="text-xl font-black leading-none">{gameweek}</div>
                                </div>
                                <button className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-30"><ChevronRight size={20}/></button>
                            </div>

                            {!isEditMode && (
                                <button
                                    onClick={enterEditMode}
                                    className="w-full md:w-auto px-8 py-3 bg-fpl-green text-fpl-purple font-extrabold text-sm uppercase tracking-widest rounded-xl hover:bg-white transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
                                >
                                    <Users size={18} /> Manage Team
                                </button>
                            )}
                        </div>

                        {/* PITCH */}
                        <div id="pitch-container" className="relative">
                            {view === 'pitch' ? (
                                <Pitch slots={slots} onSlotClick={handleSlotClick} onRemovePlayer={handleRemovePlayer} onReplacePlayer={handleReplacePlayer} isEditMode={isEditMode} selectedSlotIndex={selectedSlotIndex} />
                            ) : (
                                <PlayerList startingXI={startingList} bench={benchList} teamName={teamName} />
                            )}
                        </div>
                    </div>
                )}

                {currentPage === 'leaderboards' && <div className="flex justify-center"><Leaderboard players={dbPlayers} currentUserUid={user.uid} /></div>}
                {currentPage === 'about' && <About />}
                {currentPage === 'contact' && <Contact />}

            </main>

            <MarketModal isOpen={isMarketOpen} onClose={() => setIsMarketOpen(false)} players={dbPlayers.length > 0 ? dbPlayers : INITIAL_DB_DATA} positionFilter={getMarketFilter(marketSlotIndex)} onSelect={handlePlayerSelect} currentBudget={remainingBudget} sellPrice={marketSlotIndex !== null ? (slots[marketSlotIndex].player?.price || 0) : 0} ownedPlayerIds={ownedPlayerIds} currencySymbol={currencySymbol} />
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} user={user} currentSettings={settings} />

        </div>
    );
};

export default App;