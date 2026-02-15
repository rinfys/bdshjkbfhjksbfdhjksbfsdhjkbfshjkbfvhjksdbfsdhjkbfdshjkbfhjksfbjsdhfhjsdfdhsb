import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase, ref, set, remove, onValue, update, get } from "firebase/database";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import type { Player, TeamSlot, UserSettings, UserData } from "./types";
import { SEED_PLAYERS } from "./constants";

const firebaseConfig = {
    apiKey: "AIzaSyD5I-udG4s1pRRdFWLun6ThC3h9xLlattQ",
    authDomain: "rwafantasy.firebaseapp.com",
    projectId: "rwafantasy",
    storageBucket: "rwafantasy.firebasestorage.app",
    messagingSenderId: "835153782127",
    appId: "1:835153782127:web:4e9419866cd0b38ee6749a",
    measurementId: "G-LHEZJXEGYK",
    databaseURL: "https://rwafantasy-default-rtdb.europe-west1.firebasedatabase.app/",
};

let app;
let db: ReturnType<typeof getDatabase> | null = null;
let auth: ReturnType<typeof getAuth> | null = null;
let isFirebaseAvailable = false;

// Versioned collection to allow "wiping" accounts by changing this string
const USERS_COLLECTION = 'users_v2';
// Versioned collection for players to ensure fresh seed on constant update
const PLAYERS_COLLECTION = 'players_v6';

try {
    // Check if any apps are already initialized
    if (getApps().length > 0) {
        app = getApp();
    } else {
        app = initializeApp(firebaseConfig);
    }

    db = getDatabase(app);
    auth = getAuth(app);
    isFirebaseAvailable = true;
    console.log("✅ Firebase initialized successfully");
} catch (error: any) {
    console.error("❌ Firebase Initialization Error:", error?.message || error);
    isFirebaseAvailable = false;
}

// --- AUTH FUNCTIONS ---
const provider = new GoogleAuthProvider();

export const loginUser = async () => {
    if(!auth) {
        alert("Authentication service is unavailable. Please check console for errors.");
        return;
    }
    return signInWithPopup(auth, provider);
}

export const logoutUser = async () => {
    if(!auth) return;
    return signOut(auth);
}

export const subscribeToAuth = (callback: (user: User | null) => void) => {
    if(!auth) {
        console.warn("Auth not initialized. Defaulting to logged out state.");
        setTimeout(() => callback(null), 0);
        return () => {};
    }
    return onAuthStateChanged(auth, callback);
}

// --- DATA FUNCTIONS ---

const playerPath = (id: number) => `${PLAYERS_COLLECTION}/player_${id}`;

// HELPER: Check Username Uniqueness
export const checkUsernameTaken = async (username: string): Promise<boolean> => {
    if (!isFirebaseAvailable || !db) return false;

    try {
        const snapshot = await get(ref(db, USERS_COLLECTION));
        if (!snapshot.exists()) return false;

        const users = snapshot.val();
        const lowerUsername = username.toLowerCase();

        for (const uid in users) {
            const userSettings = users[uid]?.settings;
            if (userSettings?.username?.toLowerCase() === lowerUsername) {
                return true;
            }
        }
        return false;
    } catch (e: any) {
        // Suppress permission denied errors and assume username is available
        // to allow users to proceed in demo/restricted environments
        if (e.message && e.message.includes("Permission denied")) {
            console.warn("Firebase permission denied. Proceeding with local validation.");
            return false;
        }
        console.error("Error checking username:", e);
        return false;
    }
}

// GLOBAL MARKET PLAYERS
export const subscribeToPlayers = (callback: (players: Player[]) => void) => {
    if (!isFirebaseAvailable || !db) {
        console.warn("Firebase not available during subscribe, returning mock data.");
        setTimeout(() => callback(SEED_PLAYERS), 0);
        return () => {};
    }

    const playersRef = ref(db, PLAYERS_COLLECTION);

    return onValue(
        playersRef,
        (snapshot) => {
            const data = snapshot.val();
            if (!data) {
                // Return empty array so consumer can decide to seed
                return callback([]);
            }

            const list: Player[] = Object.entries<any>(data).map(([key, value]) => {
                const fromKey =
                    typeof key === "string" && key.startsWith("player_")
                        ? Number(key.replace("player_", ""))
                        : undefined;

                const id = Number(value?.id ?? fromKey);

                return {
                    ...value,
                    id: Number.isFinite(id) ? id : 0,
                } as Player;
            });

            callback(list);
        },
        (error) => {
            console.error("Database Read Error:", error);
            // On error, we fallback to seed, but note that it's an error state
            callback(SEED_PLAYERS);
        }
    );
};

// USER SPECIFIC DATA
export const subscribeToUserTeam = (userId: string, callback: (data: any) => void) => {
    if(!db) {
        console.warn("DB not initialized, returning null for user team");
        setTimeout(() => callback(null), 0);
        return () => {};
    }
    const userRef = ref(db, `${USERS_COLLECTION}/${userId}`);
    return onValue(userRef, (snapshot) => {
        const val = snapshot.val();
        callback(val);
    }, (error) => {
        if (!error.message.includes("permission_denied")) {
            console.error("User Sync Error:", error);
        }
        callback(null);
    });
}

// Generic save function
export const saveUserTeam = (userId: string, data: {
    slots?: TeamSlot[],
    teamName?: string,
    logoUrl?: string,
    settings?: UserSettings,
    isSquadComplete?: boolean,
    formation?: string
}) => {
    if(!db) return;
    const userRef = ref(db, `${USERS_COLLECTION}/${userId}`);
    update(userRef, data).catch(err => {
        if (err.message && err.message.includes("Permission denied")) {
            // Suppress alert for better UX in demo mode
            console.warn("Save failed: Permission denied. Data will persist locally in session.");
        } else {
            console.error("Save failed", err);
        }
    });
}

// LEADERBOARD DATA
export const fetchAllUsers = async (): Promise<UserData[]> => {
    if (!isFirebaseAvailable || !db) return [];
    try {
        const snapshot = await get(ref(db, USERS_COLLECTION));
        if (!snapshot.exists()) return [];
        const usersObj = snapshot.val();
        return Object.keys(usersObj).map(uid => ({
            uid,
            ...usersObj[uid]
        }));
    } catch (e: any) {
        if (!e.message?.includes("Permission denied")) {
            console.error("Error fetching leaderboard:", e);
        }
        return [];
    }
};


// ADMIN FUNCTIONS
export const updatePlayerInDb = (player: Player) => {
    if (!isFirebaseAvailable || !db) {
        alert("Firebase not connected. Check console.");
        return Promise.reject(new Error("Firebase not connected"));
    }
    return set(ref(db, playerPath(player.id)), player);
};

export const addPlayerToDb = (player: Player) => updatePlayerInDb(player);

export const deletePlayerFromDb = (id: number) => {
    if (!isFirebaseAvailable || !db) {
        return Promise.reject(new Error("Firebase not connected"));
    }
    return remove(ref(db, playerPath(id)));
};

export const seedDatabase = async (initialPlayers: Player[], silent = false) => {
    if (!isFirebaseAvailable || !db) {
        if (!silent) alert("Firebase not connected.");
        return;
    }

    // Try to seed, catch permissions error
    try {
        await Promise.all(initialPlayers.map((p) => addPlayerToDb(p)));
        if (!silent) alert("Database seeded successfully!");
    } catch (e: any) {
        if (!silent && !e.message?.includes("Permission denied")) {
            alert("Seeding failed: " + e.message);
        }
    }
};

export { db, auth };