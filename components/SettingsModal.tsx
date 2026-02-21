import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Clock, Moon, Sun, Camera, Upload } from 'lucide-react';
import { UserSettings } from '../types';
import { saveUserTeam, checkUsernameTaken, seedDatabase, INITIAL_DB_DATA } from '../firebase';
import { User } from 'firebase/auth';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    currentSettings: UserSettings;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, user, currentSettings }) => {
    const [formData, setFormData] = useState<UserSettings>(currentSettings);
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setFormData(currentSettings);
    }, [currentSettings, isOpen]);

    if (!isOpen) return null;

    const isLight = formData.theme === 'light';

    const COOLDOWN_MS = 15 * 24 * 60 * 60 * 1000;
    const timeSinceLastChange = Date.now() - (formData.usernameLastChanged || 0);
    const canChangeUsername = timeSinceLastChange > COOLDOWN_MS;
    const daysRemaining = Math.ceil((COOLDOWN_MS - timeSinceLastChange) / (24 * 60 * 60 * 1000));

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setFormData({ ...formData, profilePictureUrl: base64String });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleResetDb = async () => {
        if (confirm("Are you sure you want to reset the player database? This will update all player names and prices to the latest defaults.")) {
            try {
                await seedDatabase(INITIAL_DB_DATA, false);
                alert("Database reset complete.");
            } catch (e: any) {
                console.error("Reset failed:", e);
                if (e.code === 'PERMISSION_DENIED' || e.message?.includes('permission_denied')) {
                    alert("Error: Permission Denied.\n\nYour Firebase Database Rules are blocking this write operation.\n\nPlease go to the Firebase Console > Realtime Database > Rules and ensure you have write access.\n\nTemporary Rule (for development):\n{\n  \"rules\": {\n    \".read\": true,\n    \".write\": true\n  }\n}");
                } else {
                    alert(`Error resetting database: ${e.message}`);
                }
            }
        }
    };

    const handleSave = async () => {
        setError('');
        setIsSaving(true);

        if (formData.username.length < 3) {
            setError('Username must be at least 3 characters.');
            setIsSaving(false);
            return;
        }

        const usernameChanged = formData.username !== currentSettings.username;

        if (usernameChanged) {
            if (!canChangeUsername) {
                setError(`You must wait ${daysRemaining} more days to change your username.`);
                setIsSaving(false);
                return;
            }

            const isTaken = await checkUsernameTaken(formData.username);
            if (isTaken) {
                setError('This username is already taken. Please choose another.');
                setIsSaving(false);
                return;
            }
        }

        const updates = { ...formData };
        if (usernameChanged) {
            updates.usernameLastChanged = Date.now();
        }

        saveUserTeam(user.uid, { settings: updates });
        setIsSaving(false);
        onClose();
    };

    const modalBg = isLight ? 'bg-white' : 'bg-[#0160C9]';
    const textColor = isLight ? 'text-gray-900' : 'text-white';
    const borderColor = isLight ? 'border-gray-200' : 'border-white/10';
    const inputBg = isLight ? 'bg-gray-100 border-gray-300 focus:border-black' : 'bg-black/30 border-white/10 focus:border-[#3ACBE8]';
    const sectionTitleColor = isLight ? 'text-gray-500' : 'text-gray-300';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className={`${modalBg} ${textColor} w-full max-w-md rounded-2xl shadow-2xl border ${borderColor} flex flex-col overflow-hidden transition-colors duration-300`}>

                <div className={`p-6 border-b ${borderColor} flex items-center justify-between ${isLight ? 'bg-gray-50' : 'bg-gradient-to-r from-[#0160C9] to-[#0041C7]'}`}>
                    <h2 className="text-xl font-bold">User Settings</h2>
                    <button onClick={onClose} className={`p-2 rounded-full transition ${isLight ? 'hover:bg-gray-200 text-gray-500' : 'hover:bg-white/10 text-gray-400 hover:text-white'}`}>
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex flex-col items-center">
                        <div className={`relative w-24 h-24 rounded-full overflow-hidden border-2 mb-3 shadow-lg group cursor-pointer ${isLight ? 'border-gray-300 bg-gray-200' : 'border-white/20 bg-black/40'}`} onClick={() => fileInputRef.current?.click()}>
                            {formData.profilePictureUrl ? (
                                <img src={formData.profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Camera size={32} className="opacity-50"/>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Upload size={24} className="text-white"/>
                            </div>
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                        <span className="text-xs font-bold uppercase tracking-wider opacity-60">Change Profile Picture</span>
                    </div>

                    <div>
                        <label className={`block text-xs uppercase tracking-wider ${sectionTitleColor} mb-2 font-bold`}>Unique Username</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={formData.username}
                                onChange={(e) => setFormData({...formData, username: e.target.value})}
                                disabled={!canChangeUsername}
                                className={`w-full rounded-lg py-3 px-4 focus:outline-none focus:ring-1 transition ${inputBg} ${!canChangeUsername ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />
                            {!canChangeUsername && (
                                <div className="absolute right-3 top-3 text-yellow-500 flex items-center gap-1 text-xs font-bold">
                                    <Clock size={12} /> {daysRemaining} days left
                                </div>
                            )}
                        </div>
                        <p className={`text-[10px] mt-1 ${isLight ? 'text-gray-400' : 'text-gray-400'}`}>Changes are limited to once every 15 days.</p>
                    </div>

                    <div>
                        <label className={`block text-xs uppercase tracking-wider ${sectionTitleColor} mb-2 font-bold`}>Appearance</label>
                        <div className={`flex p-1 rounded-lg border ${isLight ? 'bg-gray-100 border-gray-200' : 'bg-black/30 border-white/10'}`}>
                            <button
                                onClick={() => setFormData({...formData, theme: 'dark'})}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition ${formData.theme === 'dark' ? 'bg-[#0041C7] text-white shadow-md' : 'text-gray-500 hover:text-black'}`}
                            >
                                <Moon size={14} /> Dark
                            </button>
                            <button
                                onClick={() => setFormData({...formData, theme: 'light'})}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition ${formData.theme === 'light' ? 'bg-white text-black shadow-md' : 'text-gray-500 hover:text-white'}`}
                            >
                                <Sun size={14} /> Light
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className={`block text-xs uppercase tracking-wider ${sectionTitleColor} mb-2 font-bold`}>Currency</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['GBP', 'USD', 'EUR'] as const).map((curr) => (
                                <button
                                    key={curr}
                                    onClick={() => setFormData({...formData, currency: curr})}
                                    className={`py-2 rounded-lg border text-sm font-bold transition ${formData.currency === curr ? 'bg-[#3ACBE8] text-[#0041C7] border-[#3ACBE8]' : `${inputBg} ${isLight ? 'text-gray-500 hover:border-gray-400' : 'text-gray-400 hover:border-white/30'}`}`}
                                >
                                    {curr === 'GBP' && '£'} {curr === 'USD' && '$'} {curr === 'EUR' && '€'} {curr}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                        <button
                            onClick={handleResetDb}
                            className="w-full py-2 text-xs text-red-400 hover:text-red-300 font-bold uppercase tracking-wider border border-red-500/30 rounded-lg hover:bg-red-500/10 transition"
                        >
                            Reset Player Database
                        </button>
                        <p className="text-[10px] text-gray-500 text-center mt-1">Use this if player names are outdated.</p>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-500 text-xs text-center font-bold">
                            {error}
                        </div>
                    )}
                </div>

                <div className={`p-6 border-t ${borderColor} ${isLight ? 'bg-gray-50' : 'bg-[#0041C7]'}`}>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full bg-[#3ACBE8] hover:bg-white text-[#0041C7] font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#3ACBE8]/20 disabled:opacity-50 disabled:cursor-wait"
                    >
                        <Save size={18} /> {isSaving ? 'Checking...' : 'Save Changes'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default SettingsModal;