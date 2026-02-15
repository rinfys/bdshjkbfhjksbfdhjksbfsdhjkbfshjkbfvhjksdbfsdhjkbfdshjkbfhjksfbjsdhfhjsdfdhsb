import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { saveUserTeam, checkUsernameTaken } from '../firebase';
import { UserSettings } from '../types';

interface UsernameSetupProps {
    user: User;
    onComplete: (username: string) => void;
    initialSettings: UserSettings;
}

const UsernameSetup: React.FC<UsernameSetupProps> = ({ user, onComplete, initialSettings }) => {
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const trimmed = username.trim();
        if (trimmed.length < 3) {
            setError("Username must be at least 3 characters.");
            return;
        }
        if (trimmed.length > 15) {
            setError("Username max 15 characters.");
            return;
        }
        if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
            setError("Only letters, numbers, and underscores allowed.");
            return;
        }

        setLoading(true);

        // Check uniqueness
        const taken = await checkUsernameTaken(trimmed);
        if (taken) {
            setError("Username already taken.");
            setLoading(false);
            return;
        }

        // Save
        const newSettings = {
            ...initialSettings,
            username: trimmed,
            nickname: trimmed, // Default nickname to username
            usernameLastChanged: Date.now()
        };

        saveUserTeam(user.uid, { settings: newSettings });
        onComplete(trimmed);
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-fpl-purple/95 z-[200] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-[#29002d] border border-white/20 rounded-2xl shadow-2xl p-8 text-center relative overflow-hidden">

                {/* Background glow */}
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-br from-fpl-green/10 to-fpl-blue/10 pointer-events-none rounded-full blur-3xl"></div>

                <div className="flex justify-center mb-6 relative z-10">
                    <div className="w-24 h-24 rounded-2xl flex items-center justify-center transform -rotate-3 shadow-2xl border-2 border-white/10 bg-black/20 overflow-hidden">
                        <img src="https://i.imgur.com/AZYKczg.png" alt="Logo" className="w-full h-full object-cover" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-white mb-2 relative z-10">Set your username</h1>
                <p className="text-gray-400 mb-8 text-sm relative z-10">Choose a unique username to identify yourself in the league.</p>

                <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                    <div>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter username"
                            className="w-full bg-black/30 border border-white/20 rounded-lg py-4 px-4 text-white text-center text-xl font-bold focus:outline-none focus:border-fpl-green focus:ring-1 focus:ring-fpl-green placeholder-gray-600 uppercase tracking-widest"
                            autoFocus
                        />
                    </div>

                    {error && <div className="text-red-400 text-xs font-bold bg-red-500/10 py-2 rounded">{error}</div>}

                    <button
                        type="submit"
                        disabled={loading || !username}
                        className="w-full bg-fpl-green hover:bg-white text-fpl-purple font-bold py-4 px-6 rounded-lg transition-all shadow-lg shadow-fpl-green/20 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
                    >
                        {loading ? 'Checking...' : 'Confirm Username'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default UsernameSetup;