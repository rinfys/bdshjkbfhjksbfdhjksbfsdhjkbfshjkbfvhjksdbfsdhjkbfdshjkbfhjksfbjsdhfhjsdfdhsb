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
import RulesModal from './components/RulesModal';

import { INITIAL_TEAM_SLOTS, GAMEWEEK_SCHEDULE } from './constants';
import { ChevronLeft, ChevronRight, Edit2, AlertTriangle, Plus, CheckCircle, Save, Undo2, Users, LayoutDashboard, Lock as LockIcon, BookOpen, Crown, Zap, Shield, ArrowUpCircle } from 'lucide-react';
import { Player, TeamSlot, UserSettings, UserChips } from './types';
import { subscribeToPlayers, seedDatabase, subscribeToAuth, logoutUser, subscribeToUserTeam, saveUserTeam, INITIAL_DB_DATA, logLeaderboardEntry } from './firebase';
import { User } from 'firebase/auth';

const MAX_BUDGET = 100.0;
const CURRENCY_SYMBOLS = { 'GBP': '£', 'USD': '$', 'EUR': '€' };

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

const DEFAULT_CHIPS: UserChips = {
    benchBoost: { available: 1 },
    tripleCaptain: { available: 2 },
    freeHit: { available: 2 },
    wildcard: { available: 1 } // Keeping generic just in case
};

const App: React.FC = () => {
    // Auth & Data
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [userDataLoading, setUserDataLoading] = useState(true);

    // Global State
    const [dbPlayers, setDbPlayers] = useState<Player[]>([]);
    const [currentRealGameweek, setCurrentRealGameweek] = useState(2);

    // User State
    const [currentPage, setCurrentPage] = useState('home');
    const [view, setView] = useState<'pitch' | 'list'>('pitch');
    const [viewGameweek, setViewGameweek] = useState(2);
    const [teamName, setTeamName] = useState("My Team");
    const [logoUrl, setLogoUrl] = useState("");
    const [slots, setSlots] = useState<TeamSlot[]>(INITIAL_TEAM_SLOTS);
    const [isSquadComplete, setIsSquadComplete] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Chips
    const [chips, setChips] = useState<UserChips>(DEFAULT_CHIPS);
    const [activeChip, setActiveChip] = useState<string | null>(null);

    // Edit Mode
    const [isEditMode, setIsEditMode] = useState(false);
    const [backupSlots, setBackupSlots] = useState<TeamSlot[]>([]);
    const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);

    // Modals
    const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
    const [isUsernameSetup, setIsUsernameSetup] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [notification, setNotification] = useState<string | null>(null);
    const [isMarketOpen, setIsMarketOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isRulesOpen, setIsRulesOpen] = useState(false);
    const [marketSlotIndex, setMarketSlotIndex] = useState<number | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- GAMEWEEK & INIT ---
    useEffect(() => {
        const now = new Date().toISOString();
        let activeGW = 2;
        for (const gw of GAMEWEEK_SCHEDULE) {
            if (now >= gw.start && now <= gw.deadline) {
                activeGW = gw.id;
                break;
            } else if (now > gw.deadline) {
                activeGW = gw.id + 1;
            }
        }
        if (activeGW > GAMEWEEK_SCHEDULE.length) activeGW = GAMEWEEK_SCHEDULE.length;
        if (activeGW < 2) activeGW = 2;
        setCurrentRealGameweek(activeGW);
        setViewGameweek(activeGW);
    }, []);

    useEffect(() => {
        const safetyTimer = setTimeout(() => { if (authLoading) setAuthLoading(false); }, 2500);
        const unsubscribeAuth = subscribeToAuth((currentUser) => {
            setUser(currentUser);
            setAuthLoading(false);
            clearTimeout(safetyTimer);
        });
        return () => { unsubscribeAuth(); clearTimeout(safetyTimer); };
    }, []);

    // Sync User Data
    useEffect(() => {
        if (!user) { setUserDataLoading(false); return; }
        setUserDataLoading(true);
        const unsubscribeUser = subscribeToUserTeam(user.uid, async (data) => {
            if (data) {
                if (data.teamName) setTeamName(data.teamName);
                setLogoUrl(data.logoUrl || "");
                setChips(data.chips || DEFAULT_CHIPS);

                // GW Reset Logic
                if (data.lastGameweekSaved && data.lastGameweekSaved < currentRealGameweek) {
                    setIsSubmitted(false);
                    setActiveChip(null); // Reset active chip for new week
                    setNotification(`Welcome to Gameweek ${currentRealGameweek}! Review your team.`);
                } else {
                    setIsSubmitted(!!data.isSubmitted);
                    setActiveChip(data.activeChip || null);
                }

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
                    setSettings({ ...DEFAULT_SETTINGS, username: '' });
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
                const initialData = {
                    teamName: "My Team",
                    slots: INITIAL_TEAM_SLOTS,
                    logoUrl: "",
                    settings: { ...DEFAULT_SETTINGS, username: '' },
                    isSquadComplete: false,
                    isSubmitted: false,
                    lastGameweekSaved: currentRealGameweek,
                    chips: DEFAULT_CHIPS
                };
                saveUserTeam(user.uid, initialData);
                setSettings(initialData.settings);
                setIsUsernameSetup(true);
            }
            setUserDataLoading(false);
        });
        return () => unsubscribeUser();
    }, [user, currentRealGameweek]);

    // Live Player Updates
    useEffect(() => {
        if (!user) return;
        const unsubscribeMarket = subscribeToPlayers((fetchedPlayers) => {
            if (!fetchedPlayers || fetchedPlayers.length === 0) {
                seedDatabase(INITIAL_DB_DATA, false);
                setDbPlayers(INITIAL_DB_DATA);
            } else {
                setDbPlayers(fetchedPlayers);
            }
            const sourceData = (fetchedPlayers && fetchedPlayers.length > 0) ? fetchedPlayers : INITIAL_DB_DATA;
            setSlots(currentSlots => {
                return currentSlots.map(slot => {
                    if (!slot.player) return slot;
                    const updatedPlayer = sourceData.find(p => p.id === slot.player!.id);
                    return updatedPlayer ? { ...slot, player: updatedPlayer } : slot;
                });
            });
        });
        return () => unsubscribeMarket();
    }, [user]);

    // --- ACTIONS ---

    const persistTeam = async (newSlots: TeamSlot[]) => {
        const starters = newSlots.filter(s => s.type === 'starter');
        const complete = starters.every(s => s.player !== null);
        setIsSquadComplete(complete);
        setSlots(newSlots);
        if(user) {
            await saveUserTeam(user.uid, {
                slots: newSlots,
                isSquadComplete: complete,
                isSubmitted: false,
                lastGameweekSaved: currentRealGameweek,
                activeChip: activeChip // persist chip choice even if not submitted
            });
            setIsSubmitted(false);
        }
    };

    const enterEditMode = () => {
        const currentGWConfig = GAMEWEEK_SCHEDULE.find(g => g.id === currentRealGameweek);
        const deadline = currentGWConfig ? new Date(currentGWConfig.deadline).getTime() : Date.now();
        const now = Date.now();
        if (now > deadline) {
            setNotification(`Gameweek ${currentRealGameweek} is Locked! Wait for GW${currentRealGameweek+1}.`);
            setTimeout(() => setNotification(null), 4000);
            return;
        }
        setBackupSlots(JSON.parse(JSON.stringify(slots)));
        setIsEditMode(true);
    };

    const cancelEditMode = () => {
        setSlots(backupSlots);
        setIsEditMode(false);
        if (user) saveUserTeam(user.uid, { slots: backupSlots });
    };

    const handleChipToggle = (chipName: keyof UserChips) => {
        if (!isEditMode) {
            setNotification("Enable 'Manage Team' to activate chips!");
            setTimeout(() => setNotification(null), 2000);
            return;
        }

        if (chips[chipName].available <= 0) {
            setNotification("You have used all available chips of this type.");
            setTimeout(() => setNotification(null), 2000);
            return;
        }

        if (activeChip === chipName) {
            setActiveChip(null); // Deselect
        } else {
            setActiveChip(chipName); // Select
        }
    };

    const handleSubmitSquad = async () => {
        if (!user) return;

        // Validation
        const starters = slots.filter(s => s.type === 'starter');
        if (!starters.every(s => s.player !== null)) {
            setNotification("Fill your starting lineup first!");
            setTimeout(() => setNotification(null), 3000);
            return;
        }

        // Check Captains (Allow bench captain technically, but warn if no starter captain unless auto-sub logic exists)
        // For simplicity, enforce 1 captain, 1 vice.
        const captain = slots.find(s => s.isCaptain);
        const vice = slots.find(s => s.isViceCaptain);

        if (!captain) {
            setNotification("You must select a Captain!");
            setTimeout(() => setNotification(null), 3000);
            return;
        }
        if (!vice) {
            setNotification("You must select a Vice-Captain!");
            setTimeout(() => setNotification(null), 3000);
            return;
        }
        if (captain.index === vice.index) {
            setNotification("Captain and Vice-Captain cannot be the same player.");
            setTimeout(() => setNotification(null), 3000);
            return;
        }

        // Chip Consumption Logic
        let updatedChips = { ...chips };
        if (activeChip) {
            const key = activeChip as keyof UserChips;
            // Decrement
            updatedChips[key] = {
                ...updatedChips[key],
                available: updatedChips[key].available - 1,
                usedInGw: [...(updatedChips[key].usedInGw || []), currentRealGameweek]
            };
        }

        setIsSubmitted(true);
        await saveUserTeam(user.uid, {
            isSubmitted: true,
            slots: slots,
            lastGameweekSaved: currentRealGameweek,
            activeChip: activeChip,
            chips: updatedChips
        });

        // CALCULATE POINTS SNAPSHOT
        const pointTotal = slots.reduce((acc, slot) => {
            if (!slot.player) return acc;

            // Bench Boost Logic: Count Bench
            const isBench = slot.type === 'bench';
            if (isBench && activeChip !== 'benchBoost') return acc; // Skip bench if no boost

            let pts = slot.player.points;

            // Triple Captain Logic
            if (slot.isCaptain) {
                pts *= (activeChip === 'tripleCaptain' ? 3 : 2);
            }

            return acc + pts;
        }, 0);

        await logLeaderboardEntry(currentRealGameweek, user.uid, {
            points: pointTotal,
            teamName: teamName,
            username: settings.username,
            avatar: logoUrl
        });

        setNotification(`Squad Submitted for GW${currentRealGameweek}! ${activeChip ? 'Chip Active!' : ''}`);
        setChips(updatedChips); // Update local state
        setTimeout(() => setNotification(null), 3000);
        setIsEditMode(false);
    };

    const handleMakeCaptain = (index: number) => {
        if (!isEditMode) return;
        if (!slots[index].player) return;
        const newSlots = slots.map((s, i) => ({
            ...s,
            isCaptain: i === index,
            isViceCaptain: i === index ? false : s.isViceCaptain // clear VC if becoming C
        }));
        persistTeam(newSlots);
        setNotification(`Captain set to ${slots[index].player?.name}`);
        setTimeout(() => setNotification(null), 1000);
    };

    const handleMakeViceCaptain = (index: number) => {
        if (!isEditMode) return;
        if (!slots[index].player) return;
        const newSlots = slots.map((s, i) => ({
            ...s,
            isViceCaptain: i === index,
            isCaptain: i === index ? false : s.isCaptain // clear C if becoming VC
        }));
        persistTeam(newSlots);
        setNotification(`Vice-Captain set to ${slots[index].player?.name}`);
        setTimeout(() => setNotification(null), 1000);
    };

    const persistName = (name: string) => { setTeamName(name); if(user) saveUserTeam(user.uid, { teamName: name }); };
    const persistLogo = (url: string) => { setLogoUrl(url); if(user) saveUserTeam(user.uid, { logoUrl: url }); };
    const finishGuide = () => { setShowGuide(false); const updated = { ...settings, tutorialCompleted: true }; setSettings(updated); if(user) saveUserTeam(user.uid, { settings: updated }); enterEditMode(); };
    const handleGuideStepChange = (step: number) => { if (step === 2 && !isEditMode) enterEditMode(); };
    const handleLogoClick = () => isEditMode && fileInputRef.current?.click();
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => { persistLogo(reader.result as string); }; reader.readAsDataURL(file); } };
    const handleRemovePlayer = (index: number) => { if (!isEditMode) return; const newSlots = [...slots]; newSlots[index].player = null; newSlots[index].isCaptain = false; newSlots[index].isViceCaptain = false; persistTeam(newSlots); setSelectedSlotIndex(null); };
    const handleReplacePlayer = (index: number) => { if (!isEditMode) return; setMarketSlotIndex(index); setIsMarketOpen(true); setSelectedSlotIndex(null); };

    const handleSlotClick = (index: number) => {
        if (!isEditMode) return;
        if (selectedSlotIndex !== null) {
            if (selectedSlotIndex === index) { setSelectedSlotIndex(null); } else {
                const newSlots = [...slots];
                const s1 = newSlots[selectedSlotIndex];
                const s2 = newSlots[index];

                // Check GK constraint
                const isGKSlot = (i: number) => i === 0 || i === 5;
                const isGKPlayer = (p: Player | null) => p?.position === 'GK';
                if ((isGKSlot(index) && s1.player && !isGKPlayer(s1.player)) || (isGKSlot(selectedSlotIndex) && s2.player && !isGKPlayer(s2.player))) {
                    setNotification("Only Goalkeepers can play in GK slots.");
                    setTimeout(() => setNotification(null), 3000);
                    setSelectedSlotIndex(null);
                    return;
                }

                // Swap logic
                const tempP = s1.player; const tempC = s1.isCaptain; const tempVC = s1.isViceCaptain;
                newSlots[selectedSlotIndex].player = s2.player; newSlots[selectedSlotIndex].isCaptain = s2.isCaptain; newSlots[selectedSlotIndex].isViceCaptain = s2.isViceCaptain;
                newSlots[index].player = tempP; newSlots[index].isCaptain = tempC; newSlots[index].isViceCaptain = tempVC;

                persistTeam(newSlots);
                setSelectedSlotIndex(null);
            }
        } else {
            !slots[index].player ? (setMarketSlotIndex(index), setIsMarketOpen(true)) : setSelectedSlotIndex(index);
        }
    };

    const handlePlayerSelect = (player: Player) => {
        if (marketSlotIndex === null) return;
        const existing = slots.findIndex(s => s.player?.id === player.id);
        if (existing !== -1 && existing !== marketSlotIndex) { setNotification("Player already in squad!"); setTimeout(() => setNotification(null), 3000); return; }
        const newSlots = [...slots];
        newSlots[marketSlotIndex] = { ...newSlots[marketSlotIndex], player: player, isCaptain: false, isViceCaptain: false };
        persistTeam(newSlots);
        setIsMarketOpen(false);
        setMarketSlotIndex(null);
    };

    const getMarketFilter = (index: number | null) => { if (index === null) return ''; if (index === 0 || index === 5) return 'GK'; return 'OUTFIELD'; };

    // Calculations
    const filledSlots = slots.filter(s => s.player !== null);
    const totalValue = filledSlots.reduce((acc, s) => acc + (s.player?.price || 0), 0);
    const remainingBudget = MAX_BUDGET - totalValue;
    const startingList = slots.filter(s => s.type === 'starter').map(s => s.player).filter((p): p is Player => !!p);
    const benchList = slots.filter(s => s.type === 'bench').map(s => s.player).filter((p): p is Player => !!p);
    const ownedPlayerIds = slots.map(s => s.player?.id).filter((id): id is number => id !== undefined);

    // Live Point Calculation
    const currentPoints = slots.reduce((acc, slot) => {
        if (!slot.player) return acc;

        // Bench Boost: Count bench points
        const isBench = slot.type === 'bench';
        if (isBench && activeChip !== 'benchBoost') return acc;

        let pts = slot.player.points;
        if (slot.isCaptain) pts *= (activeChip === 'tripleCaptain' ? 3 : 2);

        return acc + pts;
    }, 0);

    const isLight = settings.theme === 'light';
    const bgMain = isLight ? 'bg-gray-100' : 'bg-[#0041C7]';
    const textMain = isLight ? 'text-gray-900' : 'text-white';
    const cardBg = isLight ? 'bg-white shadow-xl border-gray-200' : 'bg-[#0160C9]/80 backdrop-blur-md border-white/20 shadow-2xl';
    const currencySymbol = CURRENCY_SYMBOLS[settings.currency];

    const canGoBack = viewGameweek > 2;
    const canGoForward = viewGameweek < currentRealGameweek;

    // Render Chip Button
    const ChipButton = ({ id, label, icon: Icon, available }: { id: keyof UserChips, label: string, icon: any, available: number }) => {
        const isActive = activeChip === id;
        const isDisabled = available <= 0 && !isActive;
        return (
            <button
                onClick={() => handleChipToggle(id)}
                disabled={isDisabled}
                className={`relative overflow-hidden group rounded-xl p-3 flex flex-col items-center justify-center border transition-all duration-300 w-full
                    ${isActive
                    ? 'bg-gradient-to-b from-[#3ACBE8] to-[#1CA3DE] border-white shadow-[0_0_20px_rgba(58,203,232,0.5)] scale-105 z-10'
                    : isDisabled
                        ? 'bg-black/20 border-white/5 opacity-40 grayscale cursor-not-allowed'
                        : 'bg-[#29002d]/60 border-white/10 hover:border-white/30 hover:bg-[#29002d]'
                }
                `}
            >
                {isActive && <div className="absolute top-1 right-2 w-2 h-2 bg-white rounded-full animate-ping"></div>}
                <div className={`p-2 rounded-full mb-1 ${isActive ? 'bg-white text-[#0041C7]' : 'bg-[#0041C7] text-[#3ACBE8]'}`}>
                    <Icon size={20} />
                </div>
                <div className={`text-[10px] uppercase font-bold tracking-wider ${isActive ? 'text-[#0041C7]' : 'text-white'}`}>{label}</div>
                <div className={`text-[9px] mt-1 px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-[#0041C7]' : 'bg-white/10 text-gray-400'}`}>
                    {isActive ? 'ACTIVE' : (available > 0 ? 'Play' : 'Used')}
                </div>
            </button>
        );
    };

    if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-[#0041C7]"><div className="animate-spin w-12 h-12 border-4 border-[#3ACBE8] rounded-full border-t-transparent"></div></div>;
    if (!user) return <Login />;
    if (userDataLoading) return <div className="min-h-screen flex items-center justify-center bg-[#0041C7] text-white font-bold animate-pulse">LOADING MANAGER...</div>;
    if (isUsernameSetup) return <UsernameSetup user={user} onComplete={(name) => { setSettings({...settings, username: name}); setIsUsernameSetup(false); saveUserTeam(user.uid, { settings: {...settings, username: name}}); setShowGuide(true); }} initialSettings={settings} />;

    return (
        <div className={`min-h-screen font-sans ${bgMain} ${textMain} selection:bg-[#3ACBE8] selection:text-[#0041C7] flex flex-col pb-24`}>

            <GuideOverlay active={showGuide} onComplete={finishGuide} teamName={teamName} logoUrl={logoUrl} onStepChange={handleGuideStepChange} />
            <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

            {notification && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-4 fade-in">
                    <div className="bg-[#0D85D8] text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 font-bold border border-white/20">
                        {notification.includes("Submitted") ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                        {notification}
                    </div>
                </div>
            )}

            {isEditMode && (
                <div className="fixed bottom-0 left-0 w-full bg-[#0160C9]/95 backdrop-blur-xl z-[100] border-t border-[#3ACBE8]/30 shadow-[0_-5px_30px_rgba(58,203,232,0.2)] animate-in slide-in-from-bottom-full duration-300">
                    <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                        <div className="flex flex-col">
                             <span className="text-xs text-[#3ACBE8] font-bold uppercase tracking-widest flex items-center gap-1">
                                 <Edit2 size={12} /> Editing GW {currentRealGameweek}
                             </span>
                            <div className={`text-sm font-bold ${remainingBudget < 0 ? 'text-red-300' : 'text-white'}`}>
                                Budget: {currencySymbol}{remainingBudget.toFixed(1)}m
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={cancelEditMode} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold uppercase flex items-center gap-2 transition border border-white/5">
                                <Undo2 size={16} /> Cancel
                            </button>
                            <button onClick={handleSubmitSquad} className="px-6 py-2.5 bg-[#3ACBE8] hover:bg-white text-[#0041C7] font-extrabold rounded-xl text-xs uppercase flex items-center gap-2 transition shadow-lg shadow-[#3ACBE8]/30 transform hover:scale-105">
                                <Save size={16} /> Submit & Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="fixed top-0 left-0 w-full h-screen pointer-events-none overflow-hidden z-0">
                <div className={`absolute top-[-20%] left-[-20%] w-[70vw] h-[70vw] rounded-full blur-[150px] transition-colors duration-1000 bg-[#3ACBE8] opacity-10`}></div>
                <div className={`absolute bottom-[-20%] right-[-20%] w-[70vw] h-[70vw] rounded-full blur-[150px] transition-colors duration-1000 bg-[#1CA3DE] opacity-15`}></div>
            </div>

            {!isEditMode && (
                <Navbar currentView={currentPage} onNavigate={setCurrentPage} username={settings.username} profilePictureUrl={settings.profilePictureUrl} onLogout={logoutUser} onOpenSettings={() => setIsSettingsOpen(true)} />
            )}

            <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 relative z-10 flex flex-col gap-6">

                {currentPage === 'home' && (
                    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full animate-in fade-in zoom-in-95 duration-500">

                        {/* CHIPS BAR */}
                        <div className="grid grid-cols-4 gap-2 md:gap-4 mb-2">
                            <ChipButton id="benchBoost" label="Bench Boost" icon={ArrowUpCircle} available={chips.benchBoost.available} />
                            <ChipButton id="tripleCaptain" label="Triple Captain" icon={Crown} available={chips.tripleCaptain.available} />
                            <ChipButton id="wildcard" label="Wildcard" icon={Zap} available={chips.wildcard.available} />
                            <ChipButton id="freeHit" label="Free Hit" icon={Shield} available={chips.freeHit.available} />
                        </div>

                        <div id="team-header" className={`flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-3xl border transition-all duration-500 ${isEditMode ? 'bg-[#0160C9] border-[#3ACBE8]/40 shadow-[0_0_30px_rgba(58,203,232,0.15)] scale-[1.01]' : `${cardBg}`}`}>
                            <div className="flex items-center gap-6 w-full md:w-auto">
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                                <div onClick={handleLogoClick} className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center border-2 overflow-hidden shadow-lg relative group transition-all duration-300 ${isEditMode ? 'cursor-pointer border-[#3ACBE8] bg-[#3ACBE8]/10' : 'border-white/10 bg-white/5'}`}>
                                    {logoUrl ? (
                                        <>
                                            <img src={logoUrl} className="w-full h-full object-cover" />
                                            {isEditMode && <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100"><Edit2 className="text-white"/></div>}
                                        </>
                                    ) : <Plus className="text-gray-400" />}
                                </div>
                                <div>
                                    {isEditMode ? (
                                        <input type="text" value={teamName} onChange={(e) => persistName(e.target.value)} className="bg-transparent text-2xl md:text-4xl font-black text-white border-b-2 border-[#3ACBE8]/50 focus:border-[#3ACBE8] outline-none w-full placeholder-white/30" placeholder="Team Name" />
                                    ) : (
                                        <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">{teamName}</h1>
                                    )}
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs font-bold uppercase tracking-wider text-gray-300 opacity-70">Manager: {settings.username}</span>
                                        {isSubmitted ? (
                                            <span className="text-[10px] bg-[#3ACBE8]/10 text-[#3ACBE8] px-2 py-0.5 rounded font-bold border border-[#3ACBE8]/20 flex items-center gap-1 uppercase tracking-wider"><CheckCircle size={10}/> Verified GW{currentRealGameweek}</span>
                                        ) : (
                                            <span className="text-[10px] bg-red-500/10 text-red-300 px-2 py-0.5 rounded font-bold border border-red-500/20 flex items-center gap-1 uppercase tracking-wider"><AlertTriangle size={10}/> Unsaved for GW{currentRealGameweek}</span>
                                        )}
                                        <button onClick={() => setIsRulesOpen(true)} className="ml-2 bg-white/10 hover:bg-white/20 p-1 rounded transition" title="Scoring Rules"><BookOpen size={12} className="text-white"/></button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-8">
                                <div className="text-right">
                                    <div className="text-[10px] font-bold uppercase text-gray-400 mb-1">GW{currentRealGameweek} Points</div>
                                    <div className={`text-3xl font-black ${isLight ? 'text-gray-900' : 'text-white'}`}>{currentPoints}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-bold uppercase text-gray-400 mb-1">Team Value</div>
                                    <div className="text-3xl font-black text-[#3ACBE8] flex items-center gap-1 justify-end">{currencySymbol}{totalValue.toFixed(1)}m</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div className="flex items-center gap-4 bg-white/5 p-2 rounded-xl border border-white/5 shadow-inner">
                                <button onClick={() => setViewGameweek(prev => prev - 1)} disabled={!canGoBack} className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition"><ChevronLeft size={20}/></button>
                                <div className="text-center px-2">
                                    <div className="text-[10px] uppercase font-bold text-gray-400">Gameweek</div>
                                    <div className="text-xl font-black leading-none">{viewGameweek}</div>
                                </div>
                                <button onClick={() => setViewGameweek(prev => prev + 1)} disabled={!canGoForward} className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition"><ChevronRight size={20}/></button>
                            </div>

                            {!isEditMode && (
                                viewGameweek === currentRealGameweek ? (
                                    <button
                                        onClick={enterEditMode}
                                        className="w-full md:w-auto px-8 py-3.5 bg-[#3ACBE8] text-[#0041C7] font-extrabold text-sm uppercase tracking-widest rounded-xl hover:bg-white hover:scale-105 transition-all shadow-lg shadow-[#3ACBE8]/20 flex items-center justify-center gap-2 group"
                                    >
                                        <Users size={18} className="group-hover:rotate-6 transition-transform" /> Manage Team
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest bg-white/5 px-4 py-3 rounded-xl border border-white/10">
                                        <LockIcon size={16} /> Viewing History
                                    </div>
                                )
                            )}
                            {isEditMode && (
                                <div className="flex items-center gap-2 text-[#3ACBE8] text-xs font-bold uppercase tracking-widest bg-[#3ACBE8]/10 px-4 py-3 rounded-xl border border-[#3ACBE8]/20 animate-pulse">
                                    <LayoutDashboard size={16} /> Transfer Market Open
                                </div>
                            )}
                        </div>

                        <div id="pitch-container" className="relative">
                            {view === 'pitch' ? (
                                <Pitch
                                    slots={slots}
                                    onSlotClick={handleSlotClick}
                                    onRemovePlayer={handleRemovePlayer}
                                    onReplacePlayer={handleReplacePlayer}
                                    onMakeCaptain={handleMakeCaptain}
                                    onMakeViceCaptain={handleMakeViceCaptain}
                                    isEditMode={isEditMode}
                                    selectedSlotIndex={selectedSlotIndex}
                                    activeChip={activeChip}
                                />
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